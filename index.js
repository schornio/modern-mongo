'use strict';

const mongodb = require('mongodb');

module.exports = {
  Document: require(__dirname + '/lib/document'),
  Collection: require(__dirname + '/lib/collection'),
  connect: mongodb.MongoClient.connect
};
