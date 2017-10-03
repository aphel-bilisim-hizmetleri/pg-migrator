'use strict'

let mysqlLib

try {
  mysqlLib = require('promise-mysql')
} catch (er) {
  throw new Error(
    'Add promise-mysql as a dependency to your project to use db-migrator with MySQL.'
  )
}

const util = require('util')

const CHECK_TABLE_SQL = 'SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = ?) as value'
const CREATE_TABLE_SQL = 'CREATE TABLE %s (id int, description VARCHAR(500), migrated_at DATETIME)'
const LAST_VERSION_SQL = 'SELECT id AS value FROM %s ORDER BY id DESC LIMIT 1'
const GET_ALL_SQL = 'SELECT id, description, migrated_at FROM %s ORDER BY id DESC'
const ADD_VERSION_SQL = 'INSERT INTO %s (id, description, migrated_at) VALUES (?, ?, ?)'
const REMOVE_VERSION_SQL = 'DELETE FROM %s WHERE id = ?'

function createMysqlPersister (client, tableName) {
  const queryValue = (sql, params) =>
    client
      .query(sql, params)
      .then(result => result.length > 0 ? result[0].value : null)

  const beginTransaction = () => client.query('SET AUTOCOMMIT = 0')
    .then(() => client.query('START TRANSACTION'))

  const commitTransaction = () => client.query('COMMIT')

  const checkTableExists = () => queryValue(CHECK_TABLE_SQL, [client.connection.config.database, tableName])

  const createTable = () =>
    client.query(util.format(CREATE_TABLE_SQL, tableName))

  const getLastVersion = () =>
    queryValue(util.format(LAST_VERSION_SQL, tableName))

  const getAll = () => client.query(util.format(GET_ALL_SQL, tableName))

  const addVersion = (version, description) =>
    client.query(util.format(ADD_VERSION_SQL, tableName), [
      version,
      description,
      new Date()
    ])

  const removeVersion = version =>
    client.query(util.format(REMOVE_VERSION_SQL, tableName), [version])

  const executeRawQuery = async sql => {
    const queries = sql.split(';').filter(q => q.trim() != '')

    for (const query of queries) {
      await client.query(query)
    }
  }

  const done = () => {}

  return {
    beginTransaction,
    commitTransaction,
    checkTableExists,
    createTable,
    getLastVersion,
    getAll,
    addVersion,
    removeVersion,
    executeRawQuery,
    done
  }
}

module.exports = {
  create: async (connectionString, tableName) => {
    let client
    const maxTries = (process.env.DB_CONNECT_MAX_ATTEMPTS || 25) - 1
    const waitMsec = process.env.DB_CONNECT_NEXT_ATTEMPT_DELAY || 1000

    for (let i = 0; !client; i++) {
      try {
        client = await mysqlLib.createConnection(connectionString)
      } catch(err) {
        if (err.code !== 'ECONNREFUSED' || i >= maxTries) {
          throw err
        }
        console.info('WAITING FOR DB...')
        await new Promise(resolve => setTimeout(resolve, waitMsec))
      }
    }

    return createMysqlPersister(client, tableName)
  }
}
