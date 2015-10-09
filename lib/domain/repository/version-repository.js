"use strict";

var promise = require("bluebird");

function VersionRepository(persister) {
    this._persister = persister;
}

VersionRepository.prototype.constructor = VersionRepository;

VersionRepository.prototype.checkTable = function () {

    var deferred = promise.pending();

    this._persister.query("SELECT EXISTS(SELECT * FROM information_schema.tables  WHERE table_name = 'version') as value;")
        .then(function (result) {

            deferred.fulfill(result.rows[0].value);
        })
        .catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

VersionRepository.prototype.createTable = function () {

    return this._persister.query("CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);");
};

VersionRepository.prototype.get = function () {

    var deferred = promise.pending();

    this._persister.query("SELECT value FROM version;")
        .then(function (result) {

            deferred.fulfill(result.rows[0].value);
        })
        .catch(function (error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

VersionRepository.prototype.update = function (version) {

    return this._persister.query("UPDATE version SET value = $1;", [version]);
};

module.exports = VersionRepository;
