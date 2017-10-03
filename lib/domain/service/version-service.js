'use strict'

const colors = require('colors/safe')

class VersionService {
  constructor (versionRepository, messages) {
    this._versionRepository = versionRepository
    this._messages = messages
  }

  async getLastVersion () {
    let currentVersion = null

    const exists = await this._versionRepository.checkTable()

    if (!exists) {
      console.log(colors.warn(this._messages.FIRST_INITIALIZE))
      await this._versionRepository.createTable()
    } else {
      currentVersion = await this._versionRepository.getLastVersion()
    }

    return currentVersion
  }

  async getAll () {
    const exists = await this._versionRepository.checkTable()
    const indexedVersions = {}

    if (!exists) {
      console.log(colors.warn(this._messages.FIRST_INITIALIZE))
      await this._versionRepository.createTable()
    } else {
      const versions = await this._versionRepository.getAll()

      versions.forEach(v => {
        indexedVersions[v.id] = {
          version: v.id,
          migrated_at: v.migrated_at.toLocaleString(),
          description: v.description
        }
      })
    }

    return indexedVersions
  }

  addVersion (version, description) {
    return this._versionRepository.addVersion(version, description)
  }

  removeVersion (version) {
    return this._versionRepository.removeVersion(version)
  }
}

module.exports = VersionService
