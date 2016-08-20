'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mongodb = require('mongodb');
const mm = require('../index');

describe('MongoDB Factory', () => {
  let db;
  let db_collection;

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

  it('should create a new collection object', () => {
    let testCollection = mm.Factory.create(COLLECTION_NAME, db);
    expect(testCollection instanceof mm.Collection).to.be.equal(true);
    expect(testCollection.new() instanceof mm.Document);
  });

  it('should use the same instance for the same collection name', () => {
    let testCollection = mm.Factory.create(COLLECTION_NAME, db);
    let testCollection2 = mm.Factory.create(COLLECTION_NAME, db);
    expect(testCollection).to.be.equal(testCollection2);
  });

  it('should use different instance for different connections', () => {
    return mm
      .connect(TEST_DB)
      .then((db2) => {
        let testCollection = mm.Factory.create(COLLECTION_NAME, db);
        let testCollection2 = mm.Factory.create(COLLECTION_NAME, db2);
        expect(testCollection).to.not.be.equal(testCollection2);
      });
  });
});
