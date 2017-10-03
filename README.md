DB Migrator
===========

The complete and easy to use database migration tool for Node.js projects. Supports PostgreSQL and MySQL.

## Features

  * Auto migration from scratch to up to date
  * Step by step forward migration
  * Step by step backward migration
  * Migrate to a specific version forward or backward
  * Subfolder deep search for migration scripts
  * All or nothing (transactional migration)

## Installation

```
npm install db-migrator --save
# and one of
npm install pg --save
npm install promise-mysql --save
```

## Quick Start

Add following to your `package.json`:

```
"scripts": {
  "db-migrate": "db-migrate",
  "db-rollback": "db-rollback",
  "db-create": "db-create",
  "db-status": "db-status"
}
```

Create `.npmrc` with a database connection string:

```
# For PostgreSQL it can look like this
db_migrator_db_url=postgresql://mydatabase@localhost?ssl=false
# For MySQL
db_migrator_db_url=mysql://user:pass@host/db
```

Create folder for migration files, by default `migrations`.

```
mkdir migrations
```

At this point you should be able to run all following commands.

### db-create

Run `npm run db-create description of the migration` to generate files for UP and DOWN migration and put your SQL to these files. Migration scripts name has to match pattern `timestamp-[UP|DOWN](-optional-description).sql`.

![Example migration scripts](https://raw.githubusercontent.com/Pajk/db-migrator/master/doc/db-create.png)

### db-migrate

Run `npm run db-migrate` to migrate your database to the latest version.

### db-rollback

Run `npm run db-rollback` to rollback one last migration.

### db-status

Run `npm run db-status` to see the state of your database.

![Example output of db-status](https://raw.githubusercontent.com/Pajk/db-migrator/master/doc/db-status.png)

## Configuration

There's not too much to set up but it's very common to have several deployment and testing environments for each project. There are several ways how to configure DB Migrator so everyone should find an easy way how to plug it in their stack.

Check out [this document](doc/CONFIGURATION.md) to find out more.

## Common Pitfalls

* All migration scripts are executed in the same transaction scope and totally roll back in case of fail so you shouldn't put any transaction statements in your scripts.
* You should use a database user with sufficient permissions according to your script content.
* Postgres ENUM type cannot be altered in a transaction so you have to change the columns type to varchar, recreate the enum and set the columns type back to use the enum.

## Credits

This is a fork of [pg-migrator](https://github.com/aphel-bilisim-hizmetleri/pg-migrator) library with following differences features:

  * Timestamp-based version id
  * All version ids together with time of execution are stored in the database
  * It's possible to get a list of versions migrated in the database
  * Async/Await is used in the codebase so at least Node.js v7.6.0 is required
  * Migration file name can contain a short description of the migration
  * Favors npm scripts (and .npmrc config file) but supports also custom execution scripts
  * MySQL support
