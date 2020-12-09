"use strict";

module.exports = class MigratorService {

    constructor(scriptService, versionService, messages) {

        this._scriptService = scriptService;
        this._versionService = versionService;
        this._messages = messages;
    }

    migrate(currentPath, targetVersion) {

        let that = this;

        return new Promise(function (resolve, reject) {

            let scriptService = that._scriptService;
            let versionService = that._versionService;
            let messages = that._messages;
            let executeScript = that._executeScript;

            setTimeout(function () {

                // Getting valid migration script files ("x-y.sql")
                let fileList = scriptService.getList(currentPath);

                if (fileList.length === 0) {
                    // There is no migration script file in current folder and subfolders
                    console.log(messages.MIGRATION_SCRIPT_NOT_FOUND.error);

                    reject();

                } else {

                    // Getting current db version
                    versionService.get()
                        .then(function (currentVersion) {

                            if (targetVersion == 0) {

                                // User didn't specify target version
                                // Looking for the file that has the biggest target version number
                                targetVersion = _.max(fileList, function (item) {
                                    return item.targetVersion;
                                }).targetVersion;

                            } else if (targetVersion == "+1") {

                                // One step forward request
                                targetVersion = currentVersion + 1;

                            } else if (targetVersion == -1) {

                                // One step roll back request
                                if (currentVersion == 1) {

                                    // DB in the initial state, can't go back no more
                                    console.log(messages.NO_MORE_ROLLBACK.error);

                                    return reject();
                                }

                                targetVersion = currentVersion - 1;
                            }

                            console.log((messages.CURRENT_VERSION + currentVersion).verbose);
                            console.log((messages.TARGET_VERSION + targetVersion).verbose);

                            if (currentVersion == targetVersion) {

                                // DB is already migrated to the target version
                                console.log(messages.ALREADY_MIGRATED.warn);

                                return resolve(currentVersion);
                            }

                            let direction;

                            if (currentVersion < targetVersion) {

                                // Forward migration
                                direction = 1;
                            } else {

                                // Rollback migration
                                direction = -1;
                            }

                            // Recursively call "executeScript" function until reach to target version
                            executeScript.call(that, direction, fileList, currentVersion, targetVersion)
                                .then(function () {

                                    return versionService.update(targetVersion);
                                })
                                .then(function () {

                                    resolve(targetVersion);
                                })
                                .catch(function (error) {

                                    reject(error);
                                });
                        })
                        .catch(function (error) {

                            reject(error);
                        });
                }
            }, 0);
        });
    }

    _executeScript(direction, fileList, currentVersion, targetVersion) {

        let that = this;

        return new Promise(function (resolve, reject) {

            let scriptService = that._scriptService;
            let messages = that._messages;
            let executeScript = that._executeScript;

            setTimeout(function () {

                // Calculate the version after migration step according to direction
                let nextVersion = currentVersion + direction;

                // Get migration step file
                let file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

                if (!file) {

                    // Migration file is not found. Probably some steps missing, stop migration
                    console.log((messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql").error);

                    reject();

                } else {

                    // Get migration step script file content
                    let fileContent = scriptService.get(file.path);

                    // Execute migration step script file
                    scriptService.execute(fileContent)
                        .then(function () {

                            console.log("--------------------------------------------------".grey);

                            console.log(fileContent.white);

                            console.log((currentVersion + "-" + nextVersion + ".sql executed").info);

                            console.log("--------------------------------------------------".grey);

                            // Update current version
                            currentVersion += direction;

                            if (currentVersion == targetVersion) {

                                // Reached to target version, migration completed
                                resolve(currentVersion);

                            } else {

                                // Recursive call until reach to target version
                                executeScript.call(that, direction, fileList, currentVersion, targetVersion)
                                    .then(function () {

                                        resolve(targetVersion);
                                    })
                                    .catch(function (error) {

                                        reject(error);
                                    });
                            }
                        })
                        .catch(function (error) {

                            reject(error);
                        });
                }
            }, 0);
        });
    }
};