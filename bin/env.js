'use strict'

module.exports = {
  getConfig: function () {
    const config = {}

    const args = Array.prototype.slice.call(process.argv, 2)

    config.connectionString = args[0] ||
      process.env.npm_package_config_db_migrator_db_url ||
      process.env.npm_config_db_migrator_db_url ||
      process.env.DATABASE_URL ||
      process.env.DB_MIGRATOR_URL ||
      'postgresql://localhost'

    config.scriptsPath = args[1] ||
      process.env.npm_package_config_db_migrator_directory ||
      process.env.npm_config_db_migrator_directory ||
      process.env.DB_MIGRATOR_DIR ||
      './migrations'

    config.tableName = args[2] ||
      process.env.npm_package_config_db_migrator_table_name ||
      process.env.npm_config_db_migrator_table_name ||
      process.env.DB_MIGRATOR_TABLE ||
      'migrations'

    config.targetVersion = args[3] ||
      process.env.npm_config_db_migrator_target ||
      process.env.DB_MIGRATOR_TARGET

    const dbms = config.connectionString.split(':')[0]

    switch (dbms.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        config.dbDriver = 'postgres'
        break
      case 'mysql':
        config.dbDriver = 'mysql'
        break
      default:
        throw new Error(
          'The connection string format is not valid: ' +
            config.connectionString
        )
    }

    return config
  }
}
