"use strict";

module.exports = class VersionService {

    constructor(versionRepository, messages) {

        this._versionRepository = versionRepository;
        this._messages = messages;
    }

    get() {

        let that = this;

        return new Promise(function (resolve, reject) {

            let versionRepository = that._versionRepository;
            let messages = that._messages;

            // check if "version" table exists in db
            versionRepository.checkTable()
                .then(function (exists) {

                    if (!exists) {

                        // "version" table does not exist, will be created for the first time with version "1"
                        console.log(messages.FIRST_INITIALIZE.warn);

                        versionRepository.createTable()
                            .then(function () {

                                resolve(1);
                            })
                            .catch(function (error) {

                                reject(error);
                            });
                    } else {

                        // Get the current version from db
                        versionRepository.get()
                            .then(function (currentVersion) {

                                resolve(currentVersion);
                            })
                            .catch(function (error) {

                                reject(error);
                            });
                    }
                })
                .catch(function (error) {

                    reject(error);
                });
        });
    }

    update(version) {

        // Update current version
        return this._versionRepository.update(version);
    }
};