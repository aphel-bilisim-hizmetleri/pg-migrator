'use strict'

const fs = require('fs')
const path = require('path')
const colors = require('./colors')
const printStatus = require('./status')
const messages = require('./infrastructure/messages')

async function rollback (options) {
  const connectionString = options.connectionString
  const targetVersion = options.targetVersion || -1
  const currentPath = options.path || '.'
  const tableName = options.tableName || 'migrations'
  const dbDriver = options.dbDriver || 'postgres'
  let persister

  try {
    const persisterProvider = require('./domain/persister/' + dbDriver)

    persister = await persisterProvider.create(connectionString, tableName)

    await persister.beginTransaction()

    const rollbackService = getRollbackService(persister)

    const currentVersion = await rollbackService.rollback(
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
        messages.ROLLBACK_COMPLETED +
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

function getRollbackService (persister) {
  const RollbackService = require('./application/service/rollback-service')
  const ScriptService = require('./domain/service/script-service')
  const VersionService = require('./domain/service/version-service')
  const ScriptRepository = require('./domain/repository/script-repository')
  const VersionRepository = require('./domain/repository/version-repository')

  return new RollbackService(
    new ScriptService(new ScriptRepository(fs, persister), path),
    new VersionService(new VersionRepository(persister), messages),
    messages
  )
}

module.exports = rollback
