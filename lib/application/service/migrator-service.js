"use strict";

var promise = require("bluebird");
var _ = require("underscore");
var colors = require("colors/safe");

function MigratorService(scriptService, versionService, messages) {
    this._scriptService = scriptService;
    this._versionService = versionService;
    this._messages = messages;
}

MigratorService.prototype.constructor = MigratorService;

MigratorService.prototype.migrate = function (currentPath, targetVersion) {

    var deferred = promise.pending();

    var scriptService = this._scriptService;
    var versionService = this._versionService;
    var messages = this._messages;
    var executeScript = this._executeScript;
    var that = this;

    setTimeout(function () {

        // Getting valid migration script files ("x-y.sql")
        var fileList = scriptService.getList(currentPath);

        if (fileList.length == 0) {
            // There is no migration script file in current folder and subfolders
            console.log(colors.error(messages.MIGRATION_SCRIPT_NOT_FOUND));

            deferred.reject();
        }
        else {

            // Getting current db version
            versionService.get()
                .then(function (currentVersion) {

                    if (targetVersion == 0) {

                        // User didn't specify target version
                        // Looking for the file that has the biggest target version number
                        targetVersion = _.max(fileList, function (item) {
                            return item.targetVersion;
                        }).targetVersion;
                    }
                    else if (targetVersion == "+1") {

                        // One step forward request
                        targetVersion = currentVersion + 1;
                    }
                    else if (targetVersion == -1) {

                        // One step roll back request
                        if (currentVersion == 1) {
                            // DB in the initial state, can't go back no more
                            console.log(colors.error(messages.NO_MORE_ROLLBACK));

                            return deferred.reject();
                        }

                        targetVersion = currentVersion - 1;
                    }

                    console.log(colors.verbose(messages.CURRENT_VERSION + currentVersion));
                    console.log(colors.verbose(messages.TARGET_VERSION + targetVersion));

                    if (currentVersion == targetVersion) {
                        // DB is already migrated to the target version
                        console.log(colors.warn(messages.ALREADY_MIGRATED));

                        return deferred.fulfill(currentVersion);
                    }

                    var direction;

                    if (currentVersion < targetVersion) {
                        // Forward migration
                        direction = 1;
                    }
                    else {
                        // Rollback migration
                        direction = -1;
                    }

                    // Recursively call "executeScript" function until reach to target version
                    executeScript.call(that, direction, fileList, currentVersion, targetVersion)
                        .then(function () {
                            return versionService.update(targetVersion);
                        })
                        .then(function () {
                            deferred.fulfill(targetVersion);
                        })
                        .catch(function (error) {
                            deferred.reject(error);
                        });
                })
                .catch(function (error) {
                    deferred.reject(error);
                });
        }
    }, 0);

    return deferred.promise;
};

MigratorService.prototype._executeScript = function (direction, fileList, currentVersion, targetVersion) {

    var deferred = promise.pending();

    var scriptService = this._scriptService;
    var messages = this._messages;
    var executeScript = this._executeScript;
    var that = this;

    setTimeout(function () {
        // Calculate the version after migration step according to direction
        var nextVersion = currentVersion + direction;

        // Get migration step file
        var file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

        if (!file) {
            // Migration file is not found. Probably some steps missing, stop migration
            console.log(colors.error(messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql"));

            deferred.reject();
        }
        else {

            // Get migration step script file content
            var fileContent = scriptService.get(file.path);

            // Execute migration step script file
            scriptService.execute(fileContent)
                .then(function () {

                    console.log(colors.grey("--------------------------------------------------"));

                    console.log(colors.white(fileContent));

                    console.log(colors.info(currentVersion + "-" + nextVersion + ".sql executed"));

                    console.log(colors.grey("--------------------------------------------------"));

                    // Update current version
                    currentVersion += direction;

                    if (currentVersion == targetVersion) {

                        // Reached to target version, migration completed
                        deferred.fulfill(currentVersion);
                    }
                    else {
                        // Recursive call until reach to target version
                        executeScript.call(that, direction, fileList, currentVersion, targetVersion)
                            .then(function () {

                                deferred.fulfill(targetVersion);
                            })
                            .catch(function (error) {
                                deferred.reject(error);
                            });
                    }
                })
                .catch(function (error) {
                    deferred.reject(error);
                });
        }
    }, 0);

    return deferred.promise;
};

module.exports = MigratorService;
