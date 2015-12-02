'use strict';

const TEST_DB = process.env.TEST_DB;
const COLLECTION_NAME = 'test';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const mm = require('../index');

describe('Versioned MongoDB Document', () => {
  let db;
  let db_collection;
  let db_collection_history;

  class TestDocument extends mm.VersionedDocument {
    constructor(db) {
      super(db, COLLECTION_NAME);
    }
  }

  before(() => {
    chai.assert.ok(TEST_DB, 'Environment: TEST_DB');
    return mm
      .connect(TEST_DB)
      .then((connectedDb) => {
        db = connectedDb;
        db_collection = connectedDb.collection(COLLECTION_NAME);
        db_collection_history = connectedDb.collection(COLLECTION_NAME + '_history');
       });
  });

  beforeEach(() => {
    return Promise.all([
      db_collection.deleteMany({}),
      db_collection_history.deleteMany({})
    ]);
  });

  it('should save new document', () => {
    let newTestDocument = new TestDocument(db);
    newTestDocument.message = 'Hallo Welt!';

    return expect(newTestDocument.save().then(() => db_collection.findOne()))
      .to.eventually.deep.equal(newTestDocument)
      .and.to.have.property('_v', 1)
      .then(() => {
        return expect(db_collection_history.find({}, { _id: 0 }).toArray())
          .to.eventually.be.deep.equal([{ doc_id: newTestDocument._id, _v: 0 }]);
      })
      .then(() => {
        newTestDocument.message = 'Hallo schoene Welt!';
        return expect(newTestDocument.save().then(() => db_collection.findOne()))
          .to.eventually.deep.equal(newTestDocument)
          .and.to.have.property('_v', 2);
      })
      .then(() => {
        return expect(db_collection_history.find({ _v: { $gt: 0 } }).toArray())
          .to.eventually.satisfy((docs) => {
            let doc = docs[0];

            expect(docs.length).to.be.equal(1);
            expect(doc.doc_id.equals(newTestDocument._id)).to.be.equal(true);
            expect(doc._v).to.be.equal(1);
            expect(doc.message).to.be.equal('Hallo Welt!');

            return true;
          });
      });
  });

  it('should save existing document', () => {
    let bareTestDocument = {
      _id: 1,
      _v: 1,
      message: 'Hallo Welt'
    };
    let newTestDocument = new TestDocument(db);
    newTestDocument.apply(bareTestDocument);

    return expect(db_collection
      .insert(bareTestDocument)
      .then(() => newTestDocument.save())
      .then(() => newTestDocument.save())
      .then(() => newTestDocument.save())
      .then(() => db_collection.find().toArray())
    ).to.eventually.deep.equal([newTestDocument])
    .then(() => {
      return expect(db_collection_history.find().toArray())
        .to.eventually.have.property('length', 3);
    });
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

  it('should reject on same version is inserted twice', function () {
    let bareTestDocument = {
      _id: 1,
      _v: 1,
      message: 'Hallo Welt'
    };
    let newTestDocument = new TestDocument(db);
    newTestDocument.apply(bareTestDocument);

    return expect(db_collection
      .insert(bareTestDocument)
      .then(() => newTestDocument.save())
      .then(() => newTestDocument.save())
      .then(() => db_collection.update({ _id: 1 }, { $set: { _v: 1 } }))
      .then(() => newTestDocument.save())
    ).to.be.rejectedWith(/Cannot save new version/);
  });

  it('should handle multible saves at once', () => {
    let bareTestDocument = {
      _id: 1,
      _v: 1,
      message: 'Hallo Welt'
    };
    let newTestDocument = new TestDocument(db);
    newTestDocument.apply(bareTestDocument);

    return expect(Promise.all([
        newTestDocument.save(),
        newTestDocument.save(),
        newTestDocument.save(),
        newTestDocument.save(),
        newTestDocument.save(),
      ])
    ).to.be.rejectedWith(/Cannot save new version/);
  });

});
