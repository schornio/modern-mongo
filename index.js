'use strict';

const { closeAll } = require('./lib/connect');

module.exports = {

  Document: require('./lib/document'),
  Collection: require('./lib/collection'),
  schema: require('./lib/schema'),
  closeAllConnections: closeAll,

};
