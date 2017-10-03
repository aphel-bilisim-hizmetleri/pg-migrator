'use strict'

let pg
try {
  pg = require('pg')
} catch (er) {
  throw new Error(
    'Add `pg` as a dependency to your project to use db-migrator with PostgreSQL.'
  )
}

const util = require('util')

const CHECK_TABLE_SQL = 'SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = $1) as value'
const CREATE_TABLE_SQL = 'CREATE TABLE %s (id int, description VARCHAR(500), migrated_at timestamptz DEFAULT NOW())'
const LAST_VERSION_SQL = 'SELECT id AS value FROM %s ORDER BY id DESC LIMIT 1'
const GET_ALL_SQL = 'SELECT id, description, migrated_at FROM %s ORDER BY id DESC'
const ADD_VERSION_SQL = 'INSERT INTO %s (id, description) VALUES ($1, $2)'
const REMOVE_VERSION_SQL = 'DELETE FROM %s WHERE id = $1'

function createPostgresPersister (client, tableName) {
  const queryValue = (sql, params) =>
    client
      .query(sql, params)
      .then(result => result.rows.length > 0 ? result.rows[0].value : null)

  const beginTransaction = () => client.query('BEGIN TRANSACTION')

  const commitTransaction = () => client.query('COMMIT')

  const checkTableExists = () => queryValue(CHECK_TABLE_SQL, [tableName])

  const createTable = () =>
    client.query(util.format(CREATE_TABLE_SQL, tableName))

  const getLastVersion = () =>
    queryValue(util.format(LAST_VERSION_SQL, tableName))

  const getAll = () =>
    client
      .query(util.format(GET_ALL_SQL, tableName))
      .then(result => result.rows)

  const addVersion = (version, description) =>
    client.query(util.format(ADD_VERSION_SQL, tableName), [
      version,
      description
    ])

  const removeVersion = version =>
    client.query(util.format(REMOVE_VERSION_SQL, tableName), [version])

  const executeRawQuery = async sql =>
    client.query(sql).then(result => result.rows)

  const done = () => client && client.release()

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
    const pool = new pg.Pool({
      connectionString: connectionString
    })

    let client
    const maxTries = (process.env.DB_CONNECT_MAX_ATTEMPTS || 25) - 1
    const waitMsec = process.env.DB_CONNECT_NEXT_ATTEMPT_DELAY || 1000

    for (let i = 0; !client; i++) {
      try {
        client = await pool.connect()
      } catch(err) {
        if (err.code !== 'ECONNREFUSED' || i >= maxTries) {
          throw err
        }
        console.info('WAITING FOR DB...')
        await new Promise(resolve => setTimeout(resolve, waitMsec))
      }
    }

    return createPostgresPersister(client, tableName)
  }
}