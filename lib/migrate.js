'use strict'

const fs = require('fs')
const path = require('path')
const colors = require('./colors')
const printStatus = require('./status')
const messages = require('./infrastructure/messages')

async function migrate (options) {
  const connectionString = options.connectionString
  const targetVersion = options.targetVersion || 0
  const currentPath = options.path || '.'
  const tableName = options.tableName || 'migrations'
  const dbDriver = options.dbDriver || 'postgres'
  let persister

  try {
    const persisterProvider = require('./domain/persister/' + dbDriver)

    persister = await persisterProvider.create(connectionString, tableName)

    await persister.beginTransaction()

    const migrationService = getMigrationService(persister)

    const currentVersion = await migrationService.migrate(
      currentPath,
      targetVersion
    )

    await persister.commitTransaction()

    persister.done()

    console.log(
      colors.info('--------------------------------------------------')
    )
    console.log(
      colors.info(
        messages.MIGRATION_COMPLETED +
          (currentVersion ? currentVersion : messages.INITIAL_STATE)
      )
    )
  } catch (error) {
    if (error) {
      console.error(colors.error(messages.MIGRATION_ERROR + error))
    }

    if (persister) {
      persister.done()
    }

    throw error
  }

  if (options.printStatus) {
    await printStatus(options)
  }
}

function getMigrationService (persister) {
  const MigratorService = require('./application/service/migrator-service')
  const ScriptService = require('./domain/service/script-service')
  const VersionService = require('./domain/service/version-service')
  const ScriptRepository = require('./domain/repository/script-repository')
  const VersionRepository = require('./domain/repository/version-repository')

  return new MigratorService(
    new ScriptService(new ScriptRepository(fs, persister), path),
    new VersionService(new VersionRepository(persister), messages),
    messages
  )
}

module.exports = migrate
