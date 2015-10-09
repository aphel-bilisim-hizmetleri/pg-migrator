"use strict";

var promise = require("bluebird");
var colors = require("colors/safe");

function VersionService(versionRepository, messages) {
    this._versionRepository = versionRepository;
    this._messages = messages;
}

VersionService.prototype.constructor = VersionService;

VersionService.prototype.get = function () {

    var deferred = promise.pending();

    var versionRepository = this._versionRepository;
    var messages = this._messages;

    // check if "version" table exists in db
    versionRepository.checkTable()
        .then(function (exists) {

            if (!exists) {

                // "version" table does not exist, will be created for the first time with version "1"
                console.log(colors.warn(messages.FIRST_INITIALIZE));

                versionRepository.createTable()
                    .then(function () {

                        deferred.fulfill(1);
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });
            }
            else {
                // Get the current version from db
                versionRepository.get()
                    .then(function (currentVersion) {

                        deferred.fulfill(currentVersion);
                    })
                    .catch(function (error) {
                        deferred.reject(error);
                    });
            }
        })
        .catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

VersionService.prototype.update = function (version) {

    // Update current version
    return this._versionRepository.update(version);
};

module.exports = VersionService;
