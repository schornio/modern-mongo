'use strict';

const { MONGODB_CONNECTION } = process.env;

const { MongoClient } = require('mongodb');

let connectionPromise = null;

const connectAsync = async () => {

  const client = await MongoClient.connect(MONGODB_CONNECTION, { useNewUrlParser: true });
  const db = client.db();

  return { client, db };

};

const connect = (newConnection = false) => {

  if (connectionPromise === null || newConnection === true) {

    connectionPromise = connectAsync();

  }

  return connectionPromise;

};

module.exports = connect;
