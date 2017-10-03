'use strict'

class VersionRepository {
  constructor (persister) {
    this._persister = persister
  }

  checkTable () {
    return this._persister.checkTableExists()
  }

  createTable () {
    return this._persister.createTable()
  }

  getLastVersion () {
    return this._persister.getLastVersion()
  }

  getAll () {
    return this._persister.getAll()
  }

  addVersion (version, description) {
    return this._persister.addVersion(version, description)
  }

  removeVersion (version) {
    return this._persister.removeVersion(version)
  }
}

module.exports = VersionRepository
