'use strict';

const { MONGODB_CONNECTION } = process.env;

const { MongoClient } = require('mongodb');

let connectionPromises = [];

const connectAsync = async () => {

  const client = await MongoClient.connect(MONGODB_CONNECTION, { useNewUrlParser: true });
  const db = client.db();

  return { client, db };

};

const connect = (newConnection = false) => {

  if (connectionPromises.length === 0 || newConnection === true) {

    connectionPromises.push(connectAsync());

  }

  return connectionPromises[connectionPromises.length - 1];

};

const processAllPromises = (promises) => {

  return new Promise((resolve) => {

    const valuesOrErrors = [];

    function processPromise (valueOrError) {
      valuesOrErrors.push(valueOrError);

      if (valuesOrErrors.length === promises.length) {
        resolve(valuesOrErrors);
      }
    }

    for (const promise of promises) {

      Promise.resolve(promise)
        .then(processPromise)
        .catch(processPromise);
    }

  });

};

const closeAll = async () => {

  const connections = await processAllPromises(connectionPromises);

  await Promise.all(
    connections
      .filter((c) => c.client && c.client.isConnected)
      .map((c) => c.client.close())
  );

};



module.exports = { connect, closeAll };
