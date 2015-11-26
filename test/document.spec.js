'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mm = require('../index');

describe('MongoDB Document', () => {
  let db_collection;

  class TestDocument extends mm.Document {
    constructor(db_collection) {
      super(db_collection);
    }
  }

  before(() => {
    chai.assert.ok(TEST_DB, 'Environment: TEST_DB');
    return mm
      .connect(TEST_DB)
      .then((connectedDb) => db_collection = connectedDb.collection(COLLECTION_NAME));
  });

  afterEach(() => {
    return db_collection.remove({});
  });

  it('should save new document', () => {
    let newTestDocument = new TestDocument(db_collection);
    newTestDocument.message = 'Hallo Welt!';

    return expect(newTestDocument.save().then(() => db_collection.findOne()))
      .to.eventually.deep.equal(newTestDocument);
  });

  it('should save existing document', () => {
    let bareTestDocument = {
      _id: 1,
      message: 'Hallo Welt'
    };
    let newTestDocument = new TestDocument(db_collection);
    newTestDocument.apply(bareTestDocument);

    return expect(db_collection
      .insert(bareTestDocument)
      .then(() => newTestDocument.save())
      .then(() => db_collection.findOne())
    ).to.eventually.deep.equal(newTestDocument);
  });

  it('should apply properties from bare object', () => {
    let testDocument = new TestDocument(db_collection);

    testDocument.propertyA = 'propA';
    testDocument.propertyB = 'propB';

    testDocument.apply({
      propertyB: 'appliedPropB',
      propertyC: 'propC'
    });

    expect(testDocument)
      .to.deep.equal({
        _id: testDocument._id,
        propertyA: 'propA',
        propertyB: 'appliedPropB',
        propertyC: 'propC'
      });
  });

  it('should validate document', () => {
    let testDocument = new TestDocument(db_collection);

    expect(testDocument.validate()).to.be.equal(true);

    delete testDocument._id;

    expect(testDocument.validate()).to.be.equal(false);
  });

});
