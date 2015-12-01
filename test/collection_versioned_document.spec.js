'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mm = require('../index');

describe('MongoDB Collection with VersionedDocument', function () {
  let db;
  let testCollection;

  class TestDocument extends mm.VersionedDocument {
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
    return Promise.all([
      db.collection(COLLECTION_NAME).remove({}),
      db.collection(COLLECTION_NAME + '_history').remove({})
    ]);
  });

  it('should find versioned documents in collection', function () {
    let bareTestDocument = { _id: 1, message: 'Hello World' };
    let testDocument = testCollection.new();

    testDocument.apply(bareTestDocument);
    bareTestDocument._v = 1;

    return testDocument.save()
      .then(() => {
        return expect(testCollection.findOne())
          .to.eventually.be.an.instanceOf(TestDocument)
          .and.to.be.deep.equal(bareTestDocument);
      })
      .then(() => {
        bareTestDocument._v = 2;
        return testDocument.save();
      })
      .then(() => {
        return expect(testCollection.findOne())
          .to.eventually.be.an.instanceOf(TestDocument)
          .and.to.be.deep.equal(bareTestDocument);
      });
  });

});
