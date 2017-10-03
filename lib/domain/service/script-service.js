'use strict'

const _ = require('lodash')

class ScriptService {
  constructor (scriptRepository, path) {
    this._scriptRepository = scriptRepository
    this._path = path
  }

  get (path) {
    return this._scriptRepository.get(path)
  }

  getList (currentPath, onlyDirection) {
    let sqlFiles = []

    const files = this._scriptRepository.getList(currentPath)

    if (files) {
      files.sort(function (a, b) {
        if (onlyDirection == -1) {
          return parseInt(b) - parseInt(a)
        } else {
          return parseInt(a) - parseInt(b)
        }
      })
    }

    // Looking for all files in the path directory and all sub directories recursively
    for (const file of files) {
      const fullPath = `${currentPath}/${file}`

      const stats = this._scriptRepository.getStat(fullPath)

      if (stats.isDirectory()) {
        sqlFiles = sqlFiles.concat(this.getList(fullPath))
      } else if (stats.isFile()) {
        // Files must have an extension with ".sql" (case insensitive)
        // with and "ID-[UP|DOWN](-description).sql" format where ID must be a number
        // All other files will be ignored
        if (this._path.extname(fullPath).toUpperCase() == '.SQL') {
          const fileName = this._path.basename(fullPath, '.sql')

          if (fileName.indexOf('-') == -1) {
            continue
          }

          const parts = fileName.split('-')

          if (parts.length < 2) {
            continue
          }

          // "ID-DIRECTION(-description)"
          const version = parseInt(parts[0])
          let direction = parts[1].toUpperCase()
          let description = null

          if (parts.length > 2) {
            description = parts
              .slice(2)
              .reduce((final, part) => `${final}${_.capitalize(part)}  `, '')
          }

          if (
            !version ||
            isNaN(version) ||
            (direction != 'DOWN' && direction != 'UP')
          ) {
            continue
          }

          direction = direction == 'UP' ? 1 : -1

          if (
            typeof onlyDirection !== 'undefined' && direction != onlyDirection
          ) {
            continue
          }

          sqlFiles.push({
            version,
            direction,
            path: fullPath,
            name: fileName,
            description
          })
        }
      }
    }

    return sqlFiles
  }

  getNextVersion (fileList, currentVersion) {
    const versions = _.filter(fileList, function (sqlFile) {
      return sqlFile.version > currentVersion
    })

    return versions.length > 0 ? _.head(versions).version : null
  }

  getPreviousVersion (fileList, currentVersion) {
    const versions = _.filter(
      fileList,
      sqlFile => sqlFile.version < currentVersion
    )

    return versions.length > 0 ? _.head(versions).version : null
  }

  getNewestVersion (fileList) {
    return _.maxBy(fileList, item => item.version).version
  }

  versionExists (fileList, version) {
    return _.findIndex(fileList, 'version', parseInt(version)) > -1
  }

  execute (query) {
    // Execute migration script
    return this._scriptRepository.execute(query)
  }
}

module.exports = ScriptService
