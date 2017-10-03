'use strict'

/* eslint-disable no-console, no-process-exit, no-process-env */

const migrate = require('db-migrator/lib/migrate')
const status = require('db-migrator/lib/status')
const dotenv = require('dotenv')
const path = require('path')

const env = process.argv[2] || 'local'

let envFile

switch (env) {
  case 'staging':
  case 'production':
  case 'dev':
    envFile = `.env-heroku-${env}`
    break
  default:
    envFile = '.env'
}

dotenv.config({
  path: path.join(__dirname, envFile),
})

if (!process.env.DATABASE_URL) {
  console.error('DB connection string not defined.')
  process.exit(1)
}

const DB_URL = `${process.env.DATABASE_URL}?ssl=true`

async function run() {
  await status({
    connectionString: DB_URL,
    path: './migrations',
    tableName: 'migrations',
  })
  await migrate({
    connectionString: DB_URL,
    path: './migrations',
    tableName: 'migrations',
  })
  console.log(envFile, 'migrated')
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
