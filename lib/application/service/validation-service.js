"use strict";

var colors = require("colors/safe");

function ValidationService(messages) {
    this._messages = messages;
}

ValidationService.prototype.constructor = ValidationService;

ValidationService.prototype.validate = function (args) {

    if (args.length == 0) {

        // There is no argument provided but connection string argument is mandatory
        console.log(colors.error(this._messages.CONNECTION_STRING_MUST_BE_PROVIDED));

        return false;
    }

    if (args.length > 1) {

        // Target version provided, check if valid
        if (isNaN(args[1])) {

            console.log(colors.error(this._messages.INVALID_TARGET_VERSION));

            return false;
        }
    }

    return true;
};

module.exports = ValidationService;
