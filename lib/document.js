'use strict';

const {
  ERROR_CONNECTED_COLLECTION,
  ERROR_RESERVED_KEYWORDS,
  ERROR_INVALID_DOCUMENT,
} = require('./errors');

/* istanbul ignore next */
const MODERN_MONGO_VALIDATE = process.env.MODERN_MONGO_VALIDATE === 'false' ? false : true;

const _collection = Symbol();
const _schemaId = Symbol();

const RESERVED_KEYWORDS = [
  'getCollection',
  'setCollection',
  'getSchema',
  'setSchema',
  'validate',
  'applyBareObject',
  'setFields',
  'setFieldsSafe',
  'deleteDocument'
];
const DOCUMENT_SCHEMA = require('./schema/default.json');

const uuid = require('uuid/v4');
const schemaStore = require('./schema');

const convertToSchemaCompatibleObject = (docObject) => {

  if (docObject instanceof Date) {

    return docObject.toJSON();

  } else if (Array.isArray(docObject)) {

    return docObject.map((item) => convertToSchemaCompatibleObject(item));

  } else if (typeof docObject === 'object') {

    let schemaCompatibleObject = {};

    for (let propertyName of Object.getOwnPropertyNames(docObject)) {

      schemaCompatibleObject[propertyName] =
        convertToSchemaCompatibleObject(docObject[propertyName]);

    }

    return schemaCompatibleObject;

  } else {

    return docObject;

  }

};

class Document {

  constructor () {

    this._id = uuid();
    this.setSchema(DOCUMENT_SCHEMA);

  }

  getCollection () {

    if (!this[_collection]) {

      throw new Error(ERROR_CONNECTED_COLLECTION);

    }

    return this[_collection];

  }

  setCollection (collection) {

    this[_collection] = collection;

  }

  getSchema () {

    let validator = this.getValidator(this[_schemaId]);
    return validator.schema;

  }

  setSchema (schema) {

    let schemaId = schema['$id'];

    if (!schemaId) {

      schemaId = `dynamic/${uuid()}`;

    }

    this[_schemaId] = schemaId;
    schemaStore.setSchema(schema, schemaId);

  }

  getValidator () {

    return schemaStore.getValidator(this[_schemaId]);

  }

  validate () {

    let validator = this.getValidator();
    let schemaCompatibleDocument =
      convertToSchemaCompatibleObject(this);

    return validator(schemaCompatibleDocument);

  }

  applyBareObject (bareObject) {

    for(let property of Object.getOwnPropertyNames(bareObject)) {

      if (RESERVED_KEYWORDS.includes(property)) {

        throw new Error(`${ERROR_RESERVED_KEYWORDS} (${property})`);

      }

      this[property] = bareObject[property];

    }

  }

  async setFields (fields, safe) {

    if (MODERN_MONGO_VALIDATE || safe) {

      let targetDoc = new this.constructor();

      targetDoc.applyBareObject(this);
      targetDoc.applyBareObject(fields);

      let isValid = targetDoc.validate();

      if (!isValid) {

        throw new Error(ERROR_INVALID_DOCUMENT);

      }

    }

    this.applyBareObject(fields);

    return await this.getCollection().updateOneUnsafe(

      { _id: this._id },
      { '$set': fields }

    );

  }

  async setFieldsSafe (fields) {

    return await this.setFields(fields, true);

  }

  async deleteDocument () {

    return await this.getCollection().deleteOne(

      { _id: this._id }

    );

  }

}

module.exports = Document;
