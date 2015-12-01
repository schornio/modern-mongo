'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mm = require('../index');

describe('MongoDB Collection', function () {
  let db;
  let testCollection;

  class TestDocument extends mm.Document {
    constructor(db, collection_name) {
      super(db, collection_name);
    }
  }

  class TestCollection extends mm.Collection {
    constructor(db) {
      super(db, TestDocument, COLLECTION_NAME);
    }
  }

  before(function () {
    chai.assert.ok(TEST_DB, 'Environment: TEST_DB');
    return mm
      .connect(TEST_DB)
      .then((connectedDb) => db = connectedDb)
      .then(() => testCollection = new TestCollection(db));
  });

  afterEach(function () {
    return db.collection(COLLECTION_NAME).remove({});
  });

  it('should create new document instances', function () {

    let newTestDocument = testCollection.new();

    expect(newTestDocument).to.be.an.instanceOf(TestDocument);
  });

  it('should find one document in collection', function () {
    let bareTestDocument = { _id: 1, message: 'Hello World' };
    return db.collection(COLLECTION_NAME)
      .insert(bareTestDocument)
      .then(() => {
        return expect(testCollection.findOne())
          .to.eventually.be.an.instanceOf(TestDocument)
          .and.to.be.deep.equal(bareTestDocument);
      });
  });

  it('should find many documents in collection', function () {
    let bareTestDocuments = [
      { _id: 1, message: 'Hello World 1' },
      { _id: 2, message: 'Hello World 2' },
      { _id: 3, message: 'Hello World 3' }
    ];
    return db.collection(COLLECTION_NAME)
      .insert(bareTestDocuments)
      .then(() => {
        return expect(testCollection.findMany())
          .to.eventually.deep.equal(bareTestDocuments);
      })
      .then((documents) => {
        for (let doc of documents) {
          expect(doc).to.be.an.instanceOf(TestDocument);
        }
      });
  });

  it('should remove many documents in collection', function () {
    let bareTestDocuments = [
      { _id: 1, message: 'Hello World 1' },
      { _id: 2, message: 'Hello World 2' },
      { _id: 3, message: 'Hello World 3' }
    ];
    return db.collection(COLLECTION_NAME)
      .insert(bareTestDocuments)
      .then(() => {
        return expect(testCollection.remove())
          .to.eventually.be.ok;
      })
      .then(() => {
        return expect(db.collection(COLLECTION_NAME).find().toArray())
          .to.eventually.deep.equal([]);
      });
  });

});
