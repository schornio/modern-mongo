'use strict';

const mongodb = require('mongodb');

const _db_collection = Symbol();

class Document {
  constructor(db, collection_name) {
    this[_db_collection] = db.collection(collection_name);
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

  delete() {
    return this[_db_collection].deleteOne(
      { _id: this._id }
    );
  }

  getDBCollection() {
    return this[_db_collection];
  }
}

module.exports = Document;
