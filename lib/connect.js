'use strict';

const { URL } = require('url');
const { MongoClient } = require('mongodb');

const connect = async (connectionString) => {

  let sanitizedConnectionString = connectionString.replace(/,|:\d+/g, '');
  let connectionURL = new URL(sanitizedConnectionString);

  let client = await MongoClient.connect(connectionString);

  let dbName = connectionURL.pathname.substr(1);
  let db = client.db(dbName);

  return { client, db };

};

module.exports = connect;
