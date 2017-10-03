## DB Migrator Configuration

There are more ways how to tell DB Migrator where to look for migrations and what database to use. You can choose which one suits you most.

### Custom execution scripts

My personal favorite because it gives you absolute freedom. There's not much to explain here, just take a look at [this example](db-migrate.js).

### Environment Variables

Configuration with env variables is most useful when executing migrations on your CI (e.g. Travis) or on your servers.  

* `DATABASE_URL` or `DB_MIGRATOR_URL` - Database connection string. 
* `DB_MIGRATOR_DIR` - Name of the migration scripts folder (defaults to `./migrations`).
* `DB_MIGRATOR_TABLE` - Name of the database table where to store the database state (defaults to `migrations`).
* `DB_MIGRATOR_TARGET` - Target migration id (timestamp).
* `DB_CONNECT_MAX_ATTEMPTS` - Default `25`. Maximum number of attemps if the database is not running yet (ECONNREFUSED).
* `DB_CONNECT_NEXT_ATTEMPT_DELAY` - Default `1000`. How long should pg-migrator wait before next attempt to connect to the database.

### NPM Config Variables

You can utilize [npm config variables](https://docs.npmjs.com/misc/config). It has higher priority than env variables.

Available options are:

* `db_url` - Database connection string.
* `directory` - Name of the migration scripts folder (defaults to `./migrations`).
* `table_name` - Name of the database table where to store database state (defaults to `migrations`).
* `target` - Target migration id (timestamp).

All npm config variables can be set in `package.json`, in `.npmrc` or as command line arguments.

#### package.json

```
"config": {
  "db-migrator": {
    "directory": "./db-migrations"
   }
}
```

#### .npmrc

Use `db_migrator_` or `db-migrator-` prefix:
```
db_migrator_db_url=postgresql://pavel@localhost
```

#### Command Line Arguments

Use `db_migrator_` or `db-migrator-` prefix:
```
npm run db-status --db_migrator_table_name=version
npm run db-rollback --db-migrator-target=1452156800
```
