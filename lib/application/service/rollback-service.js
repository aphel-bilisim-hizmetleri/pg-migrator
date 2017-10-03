'use strict'

const colors = require('../../colors')
const _ = require('lodash')

const DOWN = -1

class RollbackService {
  constructor (scriptService, versionService, messages) {
    this._scriptService = scriptService
    this._versionService = versionService
    this._messages = messages
  }

  async rollback (currentPath, targetVersion) {
    const scriptVersions = this._scriptService.getList(currentPath, DOWN)
    const dbVersions = await this._versionService.getAll()

    if (scriptVersions.length == 0) {
      throw this._messages.MIGRATION_SCRIPT_NOT_FOUND
    }

    const currentVersion = await this._versionService.getLastVersion()

    if (targetVersion == 'initial') {
      targetVersion = null
    } else if (targetVersion == -1) {
      if (currentVersion == null) {
        throw this._messages.NO_MORE_ROLLBACK
      }

      targetVersion = this._scriptService.getPreviousVersion(
        scriptVersions,
        currentVersion
      )
    } else {
      if (
        this._scriptService.versionExists(scriptVersions, targetVersion) ==
        false
      ) {
        throw this._messages.INVALID_TARGET_VERSION + targetVersion
      }

      if (currentVersion < targetVersion) {
        throw new Error(
          `Cannot rollback to newer version. Current: ${currentVersion}, ` +
            `target: ${targetVersion}.`
        )
      }
    }

    console.log(
      colors.verbose(
        this._messages.CURRENT_VERSION +
          (currentVersion ? currentVersion : this._messages.INITIAL_STATE)
      )
    )
    console.log(
      colors.verbose(
        this._messages.TARGET_VERSION +
          (targetVersion ? targetVersion : this._messages.INITIAL_STATE)
      )
    )

    const rollbackVersions = _.filter(scriptVersions, function (v) {
      return dbVersions[v.version] && v.version > targetVersion
    })

    if (rollbackVersions.length == 0) {
      console.log(colors.warn(this._messages.ALREADY_MIGRATED))
      return currentVersion
    }

    for (const v of rollbackVersions) {
      await this._rollbackVersion(v)
    }

    return targetVersion
  }

  async _rollbackVersion (versionInfo) {
    const fileContent = this._scriptService.get(versionInfo.path)

    console.log(
      colors.grey('--------------------------------------------------')
    )
    console.log(colors.white(fileContent))

    await this._scriptService.execute(fileContent)

    console.log(colors.info(versionInfo.name + '.sql executed'))
    console.log(
      colors.grey('--------------------------------------------------')
    )

    await this._versionService.removeVersion(versionInfo.version)
  }
}

module.exports = RollbackService
