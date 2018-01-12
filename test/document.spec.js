'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const { expect } = require('chai');
const uuid = require('uuid/v4');

const errors = require('../lib/errors');
const { connect, Document, Collection } = require('../index');

describe('MongoDB Document', () => {

  let client = null;
  let db = null;
  let collection = null;

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

    constructor (db) {

      super(db, TestDocument, COLLECTION_NAME);

    }

  }

  before( async () => {

    expect(TEST_DB).to.be.a('string').
      that.has.lengthOf.above(0);

    let connection = await connect(TEST_DB);

    db = connection.db;
    client = connection.client;

    collection = db.collection(COLLECTION_NAME);

  });

  beforeEach( async () => {

    await collection.remove({});

  });

  after( async () => {

    await client.close();

  });

  it('should throw error if document is not associated with a collection', () => {

    let testDocument = new TestDocument(db);

    let thrownError = null;

    try {

      testDocument.getCollection();

    } catch (error) {

      thrownError = error;

    }

    expect(thrownError.message).to.be.equal(errors.ERROR_CONNECTED_COLLECTION);

  });

  it('should get document schema', () => {

    let testDocument = new TestDocument(db);
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

    let testDocument = new TestDocument(db);

    expect(testDocument.validate()).to.be.equal(true);

    delete testDocument._id;

    expect(testDocument.validate()).to.be.equal(false);

  });

  it('should apply all fields from a JavaScript object', () => {

    let testDocument = new TestDocument(db);

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

    let testDocument = new TestDocument(db);

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

    let collection = new TestCollection(db);
    let doc = new TestDocument(db);

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);
    await doc.setFields({ newProp: true });

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should set fields on document safe', async () => {

    let collection = new TestCollection(db);
    let doc = new TestDocument(db);

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

  it('should delete itself', async () => {

    let collection = new TestCollection(db);

    let doc1 = new TestDocument(db);
    doc1.sort = 1;
    let doc2 = new TestDocument(db);
    doc2.sort = 2;
    let doc3 = new TestDocument(db);
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

    let doc = new Document(db);
    
    doc._id = "012345678-0123-0123-0123-01234567890AB";

    expect(doc.validate()).to.be.equal(false);

    doc._id = uuid();

    expect(doc.validate()).to.be.equal(true);

  });

});
