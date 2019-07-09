'use strict';

const { expect } = require('chai');
const uuid = require('uuid/v4');

const errors = require('../lib/errors');
const { connect } = require('../lib/connect');
const { Document, Collection, closeAllConnections } = require('../index');

describe('MongoDB Document', () => {

  let nativeCollection = null;

  class TestDocument extends Document {

    constructor () {
      super({
        definitions: {
        },
        properties: {
          _id: {
            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            type: "string"
          },
          testProp: {
            type: "string",
            enum: [ "valid" ]
          }
        },
        required: [
          "_id"
        ],
        type: "object"
      });

    }

  }

  class TestCollection extends Collection {

    constructor () {

      super(TestDocument);

    }

  }

  before( async () => {

    const { db } = await connect(true);
    nativeCollection = db.collection(TestDocument.name.toLowerCase());

  });

  beforeEach( async () => {

    await nativeCollection.deleteMany({});

  });

  after( async () => {

    await closeAllConnections();

  });

  it('should throw error if document is not associated with a collection', () => {

    let testDocument = new TestDocument();

    let thrownError = null;

    try {

      testDocument.getCollection();

    } catch (error) {

      thrownError = error;

    }

    expect(thrownError.message).to.be.equal(errors.ERROR_CONNECTED_COLLECTION);

  });

  it('should get document schema', () => {

    let testDocument = new TestDocument();
    let schema = testDocument.getSchema();

    expect(schema).to.deep.equal({
      definitions: {
      },
      properties: {
        _id: {
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
          type: "string"
        },
        testProp: {
          type: "string",
          enum: [ "valid" ]
        }
      },
      required: [
        "_id"
      ],
      type: "object"
    });

  });

  it('should validate document', () => {

    let testDocument = new TestDocument();

    expect(testDocument.validate()).to.be.equal(true);

    delete testDocument._id;

    expect(testDocument.validate()).to.be.equal(false);

  });

  it('should apply all fields from a JavaScript object', () => {

    let testDocument = new TestDocument();

    testDocument.applyBareObject({

      appliedField1: true,
      appliedField2: 200,
      appliedField3: "okay"

    });

    let properties = Object.getOwnPropertyNames(testDocument);

    expect(properties).to.include('_id');
    expect(properties).to.include('appliedField1');
    expect(properties).to.include('appliedField2');
    expect(properties).to.include('appliedField3');

    expect(properties).to.have.lengthOf(4);

  });

  it('should throw an error if a reserved keyword would be applied', () => {

    let testDocument = new TestDocument();

    let thrownError = null;

    try {

      testDocument.applyBareObject({

        getCollection: true,

      });

    } catch (error) {

      thrownError = error;

    }

    expect(thrownError.message).to.be.equal(`${errors.ERROR_RESERVED_KEYWORDS} (getCollection)`);

  });

  it('should set fields on document', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.setFields({ newProp: true });

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should set fields on document safe', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.setFieldsSafe({ newProp: true });

    let thrownError = null;

    try {

      await doc.setFieldsSafe({ testProp: 'invalid' });

    } catch (error) {

      thrownError = error;

    }

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);
    expect(thrownError.message).to.be.equal(errors.ERROR_INVALID_DOCUMENT);

  });

  it('should set fields on document deep', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    doc.arrProp = [];

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.setFields({
      'newProp.level1_1': true,
      'newProp.level1_2': true,
      'newProp.level1.level2': true,
      'arrProp.0': true,
      'notArrProp.1': true,
    });

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should validate fields on document deep', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    doc.setSchema({
      additionalProperties: false,
      definitions: {
      },
      properties: {
        _id: {
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
          type: "string"
        },
        testProp: {
          type: "object",
          properties: {
            deep: {
              type: "boolean"
            }
          }
        }
      },
      required: [
        "_id"
      ],
      type: "object"
    });

    await collection.insertOne(doc);

    await doc.setFieldsSafe({
      'testProp.deep': true
    });

    let docsAfter = await collection.findMany();

    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should increment fields on document', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    doc.incProp = 2;

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.incrementFields({ incProp: 3 });

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.incProp).to.be.equal(5);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should increment fields on document safe', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    doc.setSchema({
      definitions: {
      },
      properties: {
        _id: {
          pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
          type: "string"
        },
        incProp: {
          type: "integer",
          maximum: 5
        }
      },
      required: [
        "_id"
      ],
      type: "object"
    });

    doc.incProp = 2;

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.incrementFieldsSafe({ incProp: 3 });

    let thrownError = null;

    try {

      await doc.incrementFieldsSafe({ incProp: 1 });

    } catch (error) {

      thrownError = error;

    }

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.incProp).to.be.equal(5);
    expect(doc.getCollection()).to.be.equal(collection);
    expect(thrownError.message).to.be.equal(errors.ERROR_INVALID_DOCUMENT);

  });

  it('should delete itself', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = new TestDocument();
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    await doc2.deleteDocument();

    let docsAfter = await collection.findMany({}, { sort: { sort: 1 } });

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc1, doc3 ]);

  });

  it('should verify _id is a uuid', async () => {

    let doc = new Document();

    doc._id = "012345678-0123-0123-0123-01234567890AB";

    expect(doc.validate()).to.be.equal(false);

    doc._id = uuid();

    expect(doc.validate()).to.be.equal(true);

  });

  it('should verify arrays', async () => {

    class TestDocument extends Document {

      constructor () {
        super();

        this.setSchema({
          definitions: {
          },
          properties: {
            _id: {
              pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              type: "string"
            },
            testProp: {
              type: "string",
              enum: [ "valid" ]
            },
            testArray: {
              type: "array",
              items: {
                type: "string",
                format: "date-time"
              }
            }
          },
          required: [
            "_id"
          ],
          type: "object"
        });

      }

    }

    let doc = new TestDocument();

    doc.testArray = [ new Date() ];

    expect(doc.validate()).to.be.equal(true);

  });

  it('should verify a date field valid date', async () => {

    class TestDocument extends Document {

      constructor () {
        super();

        this.setSchema({
          definitions: {
          },
          properties: {
            _id: {
              pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              type: "string"
            },
            testProp: {
              type: "string",
              enum: [ "valid" ]
            },
            testDateProp: {
              type: "string",
              format: "date-time"
            }
          },
          required: [
            "_id"
          ],
          type: "object"
        });

      }

    }

    let doc = new TestDocument();

    doc.testDateProp = new Date();

    expect(doc.validate()).to.be.equal(true);

  });

  it('should verify a nullable field', async () => {

    class TestDocument extends Document {

      constructor () {
        super();

        this.setSchema({
          definitions: {
          },
          properties: {
            _id: {
              pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              type: "string"
            },
            testNullableProp: {
              type: "null"
            }
          },
          required: [
            "_id"
          ],
          type: "object"
        });

      }

    }

    let doc = new TestDocument();

    doc.testNullableProp = null;

    expect(doc.validate()).to.be.equal(true);

  });

});
