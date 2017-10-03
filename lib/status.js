'use strict'

const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const colors = require('./colors')
const messages = require('./infrastructure/messages')
const ScriptService = require('./domain/service/script-service')
const VersionService = require('./domain/service/version-service')
const ScriptRepository = require('./domain/repository/script-repository')
const VersionRepository = require('./domain/repository/version-repository')

async function status (options) {
  const connectionString = options.connectionString
  const currentPath = options.path || '.'
  const tableName = options.tableName || 'version'
  const dbDriver = options.dbDriver || 'postgres'
  let persister

  try {
    const persisterProvider = require('./domain/persister/' + dbDriver)
    persister = await persisterProvider.create(connectionString, tableName)

    const scriptService = new ScriptService(
      new ScriptRepository(fs, persister),
      path
    )
    const versionService = new VersionService(
      new VersionRepository(persister),
      messages
    )

    const scriptVersions = scriptService.getList(currentPath, 1)
    const dbVersions = await versionService.getAll()

    console.log(
      colors.grey('\n----------------- Database Status ----------------\n')
    )
    console.log(
      colors.grey('Version | Migrated At | Description --------------\n')
    )

    const middleColumnSize = new Date().toLocaleString().length
    const notMigratedMsg = _.pad(messages.NOT_MIGRATED, middleColumnSize)
    let line

    scriptVersions.forEach(function (v) {
      if (dbVersions[v.version]) {
        line = [
          v.version,
          dbVersions[v.version].migrated_at,
          v.description
        ].join(' | ')
        delete dbVersions[v.version]
        console.log(colors.info(line))
      } else {
        line = [v.version, notMigratedMsg, v.description].join(' | ')
        console.log(colors.warn(line))
      }
    })

    if (_.size(dbVersions) > 0) {
      console.log('\nMissing files ------------------------------------\n')

      _.forOwn(dbVersions, function (info) {
        line = [info.version, info.migrated_at, info.description].join(' | ')
        console.log(colors.error(line))
      })
    }
    console.log('')

    persister.done()
  } catch (error) {
    if (error) {
      console.log(error.stack)
      console.error(colors.error(messages.MIGRATION_ERROR + error))
    }

    if (persister) {
      persister.done()
    }

    throw error
  }
}

module.exports = status
