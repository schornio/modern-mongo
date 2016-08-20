'use strict';

const mmDocument = require('./document');
const mmCollection = require('./collection');

let connections = new Map();

class Factory {

}

Factory.createGenericClasses = () => {
  class GenericDocument extends mmDocument {
    constructor(db, collection_name) {
      super(db, collection_name);
    }
  }

  class GenericCollection extends mmCollection {
    constructor(db, collection_name) {
      super(db, GenericDocument, collection_name);
    }
  }

  return {
    Document: GenericDocument,
    Collection: GenericCollection,
  };
};

Factory.create = (collection_name, db) => {
  let connection = connections.get(db);
  if (!connection) {
    connection = new Map();
    connections.set(db, connection);
  }

  let collection = connection.get(collection_name);
  if (!collection) {
    let { Collection } = Factory.createGenericClasses();
    collection = new Collection(db, collection_name);
    connection.set(collection_name, collection);
  }

  return collection;
};

module.exports = Factory;
