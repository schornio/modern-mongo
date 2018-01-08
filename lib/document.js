'use strict';

const {
  ERROR_CONNECTED_COLLECTION,
  ERROR_RESERVED_KEYWORDS,
  ERROR_INVALID_DOCUMENT,
} = require('./errors');

/* istanbul ignore next */
const MODERN_MONGO_VALIDATE = process.env.MODERN_MONGO_VALIDATE === 'false' ? false : true;

const _collection = Symbol();
const _schema = Symbol();
const _validator = Symbol();

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
var Ajv = require('ajv');

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

    return this[_schema];

  }

  setSchema (schema) {

    this[_schema] = schema;

  }

  validate () {

    if (!this[_validator]) {

      let ajv = new Ajv();
      let validator = ajv.compile(this.getSchema());
      this[_validator] = validator;

    }

    return this[_validator](this);

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
