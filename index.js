'use strict';

const mongodb = require('mongodb');

module.exports = {
  Document: require(__dirname + '/lib/document'),
  Collection: require(__dirname + '/lib/collection'),
  Factory: require(__dirname + '/lib/factory'),
  VersionedDocument: require(__dirname + '/lib/versioned_document'),
  connect: mongodb.MongoClient.connect
};
