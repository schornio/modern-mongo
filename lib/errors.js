'use strict';

module.exports = {

  ERROR_CONNECTED_COLLECTION:
    'Document not connected to a MongoDB collection. ' +
    'Use `Document#setCollection(collection) to connect a collection to a document`.',

  ERROR_RESERVED_KEYWORDS:
    'Can not apply a field which shares the same name with a reserved keyword.',

  ERROR_INVALID_DOCUMENT:
    'Document can not validate against its schema.',

};
