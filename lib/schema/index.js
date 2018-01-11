'use strict';

const AJV = require('ajv');

const _ajv = Symbol;

class Schema {

  constructor () {

    this[_ajv] = new AJV();

  }

  setSchema (schema, id) {

    let schemaId = schema['$id'] || id;

    if (!this.getValidator(schemaId)) {

      this[_ajv].addSchema(schema, schemaId);

    }

  }

  getValidator (schemaId) {

    return this[_ajv].getSchema(schemaId);

  }

}

module.exports = new Schema();
