'use strict'

module.exports = {
  CURRENT_VERSION: 'Current Version : ',
  TARGET_VERSION: 'Target Version : ',
  FIRST_INITIALIZE: 'Versioning table does not exist, will be created for the first time',
  CONNECTION_STRING_MUST_BE_PROVIDED: 'ConnectionString must be provided',
  INVALID_TARGET_VERSION: 'Target version parameter must be:\n* a valid version id to migrate to\n* or +1 to roll one step forward\n* or -1 to roll one step back\n* or empty to migrate to the latest version available\nTarget version was set to: ',
  ALREADY_MIGRATED: 'Database is already migrated to the target version',
  MIGRATION_SCRIPT_NOT_FOUND: 'There is no migration script file in current folder and subfolders',
  FILE_NOT_FOUND: 'Migration script could not be found : ',
  NO_MORE_ROLLBACK: "Database at the initial state, can't roll back more",
  NO_MORE_MIGRATE: "Database at the latest version, can't find newer migrations",
  MIGRATION_ERROR: 'Migration could not be completed: ',
  MIGRATION_COMPLETED: 'Migration has been completed successfully\nCurrent database version : ',
  ROLLBACK_COMPLETED: 'Rollback has been completed successfully\nCurrent database version : ',
  INITIAL_STATE: 'initial state',
  NOT_MIGRATED: 'NOT MIGRATED'
}
