'use strict';

const mongodb = require('mongodb');

const _db_collection = Symbol();

class Document {
  constructor(db_collection) {
    this[_db_collection] = db_collection;
    this._id = new mongodb.ObjectID();
  }

  validate() {
    return this._id !== undefined && this._id !== null;
  }

  apply(bareObject) {
    for(let property of Object.getOwnPropertyNames(bareObject)) {
      this[property] = bareObject[property];
    }
  }

  save() {
    return this[_db_collection].update(
      { _id: this._id },
      this,
      { upsert: true }
    );
  }
}

module.exports = Document;
