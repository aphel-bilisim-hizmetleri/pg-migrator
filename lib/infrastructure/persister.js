"use strict";

module.exports = class Persister {

    constructor(pg, connectionString) {

        this._client = new pg.Client(connectionString);
    }

    connect() {

        let that = this;

        return new Promise(function (resolve, reject) {

            that._client.connect(function (error, client) {

                if (error) {

                    reject(error);

                } else {

                    resolve();
                }
            });


        });
    }

    query(sql, params) {

        let that = this;

        return new Promise(function (resolve, reject) {

            that._client.query(sql, params, function (error, result) {

                if (error) {

                    reject(error);

                } else {

                    resolve(result);
                }
            });
        });
    }

    closeConnection() {

        let that = this;

        return new Promise(function (resolve, reject) {

            that._client.end(function (error) {

                if (error) {

                    reject(error);

                } else {

                    resolve();
                }
            });
        });
    }
};