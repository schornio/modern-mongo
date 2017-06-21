'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mongodb = require('mongodb');
const mm = require('../index');

describe('MongoDB Document', () => {
  let db;
  let db_collection;

  const dbWrapper = (db) => {
    return {
      getBare: () => db.collection(COLLECTION_NAME)
    };
  };

  class TestDocument extends mm.Document {
    constructor(db) {
      super(dbWrapper(db));
    }
  }

  before(() => {
    chai.assert.ok(TEST_DB, 'Environment: TEST_DB');
    return mm
      .connect(TEST_DB)
      .then((connectedDb) => {
        db = connectedDb;
        db_collection = connectedDb.collection(COLLECTION_NAME);
      });
  });

  beforeEach(() => {
    return db_collection.remove({});
  });

  it('should save new document', () => {
    let newTestDocument = new TestDocument(db);
    newTestDocument.message = 'Hallo Welt!';

    return expect(newTestDocument.save().then(() => db_collection.findOne()))
      .to.eventually.deep.equal(newTestDocument);
  });

  it('should save existing document', () => {
    let bareTestDocument = {
      _id: 1,
      message: 'Hallo Welt'
    };
    let newTestDocument = new TestDocument(db);
    newTestDocument.apply(bareTestDocument);

    return expect(db_collection
      .insert(bareTestDocument)
      .then(() => newTestDocument.save())
      .then(() => db_collection.findOne())
    ).to.eventually.deep.equal(newTestDocument);
  });

  it('should apply properties from bare object', () => {
    let testDocument = new TestDocument(db);

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
    let testDocument = new TestDocument(db);

    expect(testDocument.validate()).to.be.equal(true);

    delete testDocument._id;

    expect(testDocument.validate()).to.be.equal(false);
  });

  it('should update document field', () => {
    let newTestDocument = new TestDocument(db);

    return expect(
      newTestDocument.save()
      .then(() => newTestDocument.updateField('testField.field1', 'value1'))
      .then(() => db_collection.find().toArray())
    ).to.eventually.deep.equal([ { _id: newTestDocument._id, testField: { field1: 'value1' } } ]);
  });

  it('should delete document', () => {
    let newTestDocument = new TestDocument(db);
    newTestDocument.message = 'Hallo Welt!';

    return expect(
      newTestDocument.save()
      .then(() => newTestDocument.delete())
      .then(() => db_collection.find().toArray())
    ).to.eventually.deep.equal([]);
  });

  it('should expose db collection', () => {
    let testDocument = new TestDocument(db);

    expect(testDocument.getDBCollection())
      .to.be.instanceOf(mongodb.Collection);
  });

});
