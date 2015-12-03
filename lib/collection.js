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

  findOne() {
    return this[_db_collection]
      .findOne.apply(this[_db_collection], arguments)
      .then((bareObject) => {
        return this.newFromBareObject(bareObject);
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
    return new this[_class](this[_db], this[_db_collection_name]);
  }

  newFromBareObject(bareObject) {
    let doc = this.new();
    doc.apply(bareObject);
    return doc;
  }

  remove() {
    return this[_db_collection].remove.apply(this[_db_collection], arguments);
  }
}

module.exports = Collection;
