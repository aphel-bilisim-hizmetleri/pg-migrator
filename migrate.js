"use strict";

var fs = require("fs");
var path = require("path");
var colors = require("colors/safe");
var Pgb = require("pg-bluebird");
var messages = require("./lib/infrastructure/messages");

colors.setTheme({
    verbose: 'cyan',
    info: 'green',
    warn: 'yellow',
    error: 'red'
});

function migrate (options) {
    var connectionString = options.connectionString;
    var targetVersion = options.targetVersion || 0;
    var currentPath = options.path || '.';

    var connection;
    var currentPersister;
    var currentVersion;

    var persisterProvider = new Pgb();

    // Connecting to PostgreSQL
    return persisterProvider.connect(connectionString)
        .then(function (persister) {

            connection = persister;
            currentPersister = persister.client;

            // Starting transaction
            return currentPersister.query("BEGIN TRANSACTION");
        })
        .then(function () {
            return getMigrationService(currentPersister).migrate(currentPath, targetVersion);
        })
        .then(function (curVer) {

            currentVersion = curVer;

            // Migration has been completed successfully, committing the transaction
            return currentPersister.query("COMMIT");
        })
        .then(function () {

            connection.done();

            console.log(colors.info("--------------------------------------------------"));
            console.log(colors.info(messages.MIGRATION_COMPLETED + currentVersion));

            // process.exit(0);
        })
        .catch(function (error) {
            // Migration failed

            if (error) {
                console.error(colors.error(messages.MIGRATION_ERROR + error));
            }

            if (connection) {
                connection.done();
            }

            // Rethrow error
            throw error;
        });
}

var getMigrationService = function (persister) {

    var MigratiorService = require("./lib/application/service/migrator-service");
    var ScriptService = require("./lib/domain/service/script-service");
    var VersionService = require("./lib/domain/service/version-service");
    var ScriptRepository = require("./lib/domain/repository/script-repository");
    var VersionRepository = require("./lib/domain/repository/version-repository");

    // Service definition with dependency injection
    return new MigratiorService(
        new ScriptService(new ScriptRepository(fs, persister), path),
        new VersionService(new VersionRepository(persister), messages),
        messages);
};

module.exports = migrate;
