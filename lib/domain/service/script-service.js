"use strict";

function ScriptService(scriptRepository, path) {
  this._scriptRepository = scriptRepository;
  this._path = path;
}

ScriptService.prototype.constructor = ScriptService;

ScriptService.prototype.get = function(path) {
  return this._scriptRepository.get(path);
};

ScriptService.prototype.getList = function(currentPath) {
  var sqlFiles = [];

  var files = this._scriptRepository.getList(currentPath);

  // Looking for all files in the path directory and all sub directories recursively
  for (var i in files) {
    if (!files.hasOwnProperty(i)) {
      continue;
    }

    var fullPath = currentPath + "/" + files[i];

    if (fullPath.includes("node_modules") || fullPath.includes("pg-migrator")) {
      continue;
    }

    var stats = this._scriptRepository.getStat(fullPath);

    if (stats.isDirectory()) {
      sqlFiles = sqlFiles.concat(this.getList(fullPath));
    } else if (stats.isFile()) {
      // Files must have an extension with ".sql" (case insensitive)
      // with and "x-y.sql" format that x and y must be valid numbers
      // Both numbers also must be sequential
      // All other files will be ignored
      if (this._path.extname(fullPath).toUpperCase() == ".SQL") {
        var fileName = this._path.basename(fullPath, ".sql");

        // There is no "-" sign, ignore the file
        if (fileName.indexOf("-") == -1) {
          continue;
        }

        // "x-y.sql"
        // x: base version
        // y: target version
        var baseVersion = fileName.substr(0, fileName.indexOf("-"));
        var targetVersion = fileName.substr(fileName.indexOf("-") + 1);

        // x or y is not a valid number, ignore the file
        if (
          !baseVersion ||
          !targetVersion ||
          isNaN(baseVersion) ||
          isNaN(targetVersion)
        ) {
          continue;
        }

        // Make sure we use integers
        baseVersion = parseInt(baseVersion);
        targetVersion = parseInt(targetVersion);

        // x and y are not sequential, ignore the file
        if (Math.abs(baseVersion - targetVersion) != 1) {
          continue;
        }

        sqlFiles.push({
          baseVersion: baseVersion,
          targetVersion: targetVersion,
          path: fullPath
        });
      }
    }
  }

  return sqlFiles;
};

ScriptService.prototype.execute = function(query) {
  // Execute migration script
  return this._scriptRepository.execute(query);
};

module.exports = ScriptService;
