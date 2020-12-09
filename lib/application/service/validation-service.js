"use strict";

module.exports = class ValidationService {

    constructor(messages) {

        this._messages = messages;
    }

    validate(args) {

        if (args.length === 0) {

            // There is no argument provided but connection string argument is mandatory
            console.log(this._messages.CONNECTION_STRING_MUST_BE_PROVIDED.error);

            return false;
        }

        if (args.length > 1) {

            // Target version provided, check if valid
            if (isNaN(args[1])) {

                console.log(this._messages.INVALID_TARGET_VERSION.error);

                return false;
            }
        }

        return true;
    }
};
