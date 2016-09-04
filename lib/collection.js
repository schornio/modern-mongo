'use strict';

const _db = Symbol();
const _db_collection = Symbol();
const _db_collection_name = Symbol();
const _class = Symbol();

class Collection {
  constructor(db, documentClass, collection_name) {
    this[_class] = documentClass;
    this[_db] = db;
    this[_db_collection] = db.collection(collection_name);
    this[_db_collection_name] = collection_name;
  }

  getDB () {
    return this[_db];
  }

  getName () {
    return this[_db_collection_name];
  }

  getBare () {
    return this[_db_collection];
  }

  findOne() {
    return this[_db_collection]
      .findOne.apply(this[_db_collection], arguments)
      .then((bareObject) => {
        if(bareObject) {
          return this.newFromBareObject(bareObject);
        } else {
          return null;
        }
      });
  }

  findMany() {
    return this[_db_collection]
      .find.apply(this[_db_collection], arguments)
      .toArray()
      .then((bareObjects) => {
        return bareObjects.map((bareObject) => this.newFromBareObject(bareObject));
      });
  }

  findOneAndUpdate() {
    return this[_db_collection]
      .findOneAndUpdate.apply(this[_db_collection], arguments)
      .then((dbResponse) => {
        if(dbResponse.value) {
          return this.newFromBareObject(dbResponse.value);
        } else {
          return null;
        }
      });
  }

  new() {
    return new this[_class](this);
  }

  newFromBareObject(bareObject) {
    let doc = this.new();
    doc.apply(bareObject);
    return doc;
  }

  insertOne () {
    let doc = this.newFromBareObject(arguments[0]);
    Array.prototype.splice.call(arguments, 0, 1, doc);

    return this[_db_collection].insertOne.apply(this[_db_collection], arguments);
  }

  insertMany () {
    if (Array.isArray(arguments[0])) {
      let docs = arguments[0].map((doc) => this.newFromBareObject(doc));
      Array.prototype.splice.call(arguments, 0, 1, docs);

      return this[_db_collection].insertMany.apply(this[_db_collection], arguments);
    } else {
      return Promise.reject(new Error('Invalid argument: must be an array'));
    }
  }

  updateOne () {
    return this[_db_collection].updateOne.apply(this[_db_collection], arguments);
  }

  updateMany () {
    return this[_db_collection].updateMany.apply(this[_db_collection], arguments);
  }

  remove() {
    return this[_db_collection].remove.apply(this[_db_collection], arguments);
  }

  getDBCollection() {
    return this[_db_collection];
  }
}

module.exports = Collection;
