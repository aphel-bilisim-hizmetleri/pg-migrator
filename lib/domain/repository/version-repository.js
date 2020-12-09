"use strict";

module.exports = class VersionRepository {

    constructor(persister) {

        this._persister = persister;
    }

    checkTable() {

        let that = this;

        return new Promise(function (resolve, reject) {

            that._persister.query("SELECT EXISTS(SELECT * FROM information_schema.tables  WHERE table_name = 'version') as value;")
                .then(function (result) {

                    resolve(result.rows[0].value);
                })
                .catch(function (error) {

                    reject(error);
                });
        });
    }

    createTable() {

        return this._persister.query("CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);");
    }

    get() {

        let that = this;

        return new Promise(function (resolve, reject) {

            that._persister.query("SELECT value FROM version;")
                .then(function (result) {

                    resolve(result.rows[0].value);
                })
                .catch(function (error) {

                    reject(error);
                });
        });
    }

    update(version) {

        return this._persister.query("UPDATE version SET value = $1;", [version]);
    }
};