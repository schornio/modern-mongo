'use strict';

const mongodb = require('mongodb');

const _db_collection = Symbol();

class Document {
  constructor(collection) {
    this[_db_collection] = collection.getBare();
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

  updateField(field, value) {
    let updateObject = {};

    updateObject[field] = value;

    return this[_db_collection].update(
      { _id: this._id },
      { '$set': updateObject }
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
