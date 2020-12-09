"use strict";

module.exports = class ScriptService {

    constructor(scriptRepository, path) {

        this._scriptRepository = scriptRepository;
        this._path = path;
    }

    get(path) {

        return this._scriptRepository.get(path);
    }

    getList(currentPath) {

        let sqlFiles = [];

        let files = this._scriptRepository.getList(currentPath);

        // Looking for all files in the path directory and all sub directories recursively
        for (let i in files) {

            if (!files.hasOwnProperty(i)) {
                continue;
            }

            let fullPath = currentPath + "/" + files[i];

            let stats = this._scriptRepository.getStat(fullPath);

            if (stats.isDirectory()) {

                sqlFiles = sqlFiles.concat(this.getList(fullPath));

            } else if (stats.isFile()) {

                // Files must have an extension with ".sql" (case insensitive)
                // with and "x-y.sql" format that x and y must be valid numbers
                // Both numbers also must be sequential
                // All other files will be ignored
                if (this._path.extname(fullPath).toUpperCase() === ".SQL") {

                    let fileName = this._path.basename(fullPath, ".sql");

                    // There is no "-" sign, ignore the file
                    if (fileName.indexOf("-") === -1) {
                        continue;
                    }

                    // "x-y.sql"
                    // x: base version
                    // y: target version
                    let baseVersion = fileName.substr(0, fileName.indexOf("-"));
                    let targetVersion = fileName.substr(fileName.indexOf("-") + 1);

                    // x or y is not a valid number, ignore the file
                    if (!baseVersion || !targetVersion || isNaN(baseVersion) || isNaN(targetVersion)) {

                        continue;
                    }

                    // Make sure we use integers
                    baseVersion = parseInt(baseVersion);
                    targetVersion = parseInt(targetVersion);

                    // x and y are not sequential, ignore the file
                    if (Math.abs(baseVersion - targetVersion) !== 1) {

                        continue;
                    }

                    sqlFiles.push({baseVersion: baseVersion, targetVersion: targetVersion, path: fullPath});
                }
            }
        }

        return sqlFiles;
    }

    execute(query) {

        // Execute migration script
        return this._scriptRepository.execute(query);
    }
};
