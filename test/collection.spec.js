'use strict';

const { expect } = require('chai');
const uuid = require('uuid/v4');

const errors = require('../lib/errors');
const connect = require('../lib/connect');
const { Document, Collection } = require('../index');

describe('MongoDB Collection', () => {

  let db = null;
  let nativeCollection = null;

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

    constructor () {

      super(TestDocument);

    }

  }

  before( async () => {

    const connection = await connect(true);
    db = connection.db;
    nativeCollection = db.collection(TestDocument.name.toLowerCase());

  });

  beforeEach( async () => {

    await nativeCollection.deleteMany({});

  });

  after( async () => {

    const { client } = await connect();
    await client.close();

  });

  it('should create a new document which is connected to it self', () => {

    let collection = new TestCollection();

    let doc = collection.newDocument();

    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should find one document or return `null`', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    let doc = await collection.findOne({ _id: doc2._id });
    let noDoc = await collection.findOne({ _id: uuid() });

    expect(docsBefore).to.deep.equal([]);
    expect(doc).to.deep.equal(doc2);
    expect(noDoc).to.be.equal(null);

  });

  it('should find one and update document or return `null`', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    await collection.findOneAndUpdateUnsafe({ _id: doc2._id }, { '$set': { newProp: true } });

    let doc = await collection.findOne({ _id: doc2._id });
    let noDoc = await collection.findOneAndUpdateUnsafe({ _id: uuid() }, { '$set': { newProp: true } });

    doc2.newProp = true;

    expect(docsBefore).to.deep.equal([]);
    expect(doc).to.deep.equal(doc2);
    expect(noDoc).to.be.equal(null);

  });

  it('should find one by id', async () => {

    let collection = new TestCollection();

    let doc = new TestDocument();

    let docBefore = await collection.findOneById(doc._id);
    expect(docBefore).to.be.equal(null);

    await collection.insertOne(doc);

    let after = await collection.findOneById(doc._id);
    expect(after).to.deep.equal(doc);

  });

  it('should find many by ids', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];
    let docIds = docs.map((doc) => doc._id);

    let docsBefore = await collection.findManyByIds(docIds);
    expect(docsBefore).to.deep.equal([]);

    await collection.insertMany(docs);

    let docsAfter = await collection.findManyByIds(docIds, { sort: { sort: -1 } });
    docs.reverse();
    expect(docsAfter).to.deep.equal(docs);

  });

  it('should insert one modern-mongo document', async () => {

    let collection = new TestCollection();
    let doc = new TestDocument();

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);
    expect(doc.getCollection()).to.be.equal(collection);

  });

  it('should insert one bare document', async () => {

    let collection = new TestCollection();
    let doc = { _id: uuid() };

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);

  });

  it('should insert one bare document', async () => {

    let collection = new TestCollection();
    let doc = { _id: uuid() };

    let docsBefore = await collection.findMany();

    await collection.insertOne(doc);

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ doc ]);

  });

  it('should insert one document safe', async () => {

    let collection = new TestCollection();

    let validDoc = { _id: uuid(), testProp: 'valid' };
    let invalidDoc = { _id: uuid(), testProp: 'invalid' };

    let thrownError = null;
    let docsBefore = await collection.findMany();

    await collection.insertOneSafe(validDoc);

    try {

      await collection.insertOneSafe(invalidDoc);

    } catch (error) {

      thrownError = error;

    }

    let docsAfter = await collection.findMany();

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal([ validDoc ]);
    expect(thrownError.message).to.be.equal(errors.ERROR_INVALID_DOCUMENT);

  });

  it('should insert many documents', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    let docsAfter = await collection.findMany({}, { sort: { sort: 1 } });

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal(docs);

  });

  it('should insert many documents safe', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let doc4 = { _id: uuid() };
    doc4.sort = 4;
    let invalidDoc = { _id: uuid(), testProp: 'invalid' };
    let docs = [ doc1, doc2, doc3 ];

    let thrownError = null;
    let docsBefore = await collection.findMany();

    await collection.insertManySafe(docs);

    try {

      await collection.insertManySafe([ doc4, invalidDoc ]);

    } catch (error) {

      thrownError = error;

    }

    let docsAfter = await collection.findMany({}, { sort: { sort: 1 } });

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal(docs);
    expect(thrownError.message).to.be.equal(errors.ERROR_INVALID_DOCUMENT);

  });

  it('should update one', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    await collection.updateOneUnsafe({ }, { '$set': { newProp: true } }, { sort: { sort: 1 } });

    let docsAfter = await collection.findMany({}, { sort: { sort: 1 } });

    docs[0].newProp = true;

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal(docs);

  });

  it('should update many', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    let docsBefore = await collection.findMany();

    await collection.insertMany(docs);

    await collection.updateManyUnsafe({ }, { '$set': { newProp: true } }, { sort: { sort: 1 } });

    let docsAfter = await collection.findMany({}, { sort: { sort: 1 } });

    for (let doc of docs) {

      doc.newProp = true;

    }

    expect(docsBefore).to.deep.equal([]);
    expect(docsAfter).to.deep.equal(docs);

  });

  it('should count documents', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    await collection.insertMany(docs);

    let count = await collection.count();

    expect(count).to.be.equal(docs.length);

  });

  it('should delete one document', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    await collection.insertMany(docs);

    let countBeforeDelte = await collection.count();

    expect(countBeforeDelte).to.be.equal(docs.length);

    await collection.deleteOne({ _id: doc2._id });

    let countAfterDelete = await collection.count();

    expect(countAfterDelete).to.be.equal(2);

  });

  it('should delete many documents', async () => {

    let collection = new TestCollection();

    let doc1 = new TestDocument();
    doc1.sort = 1;
    let doc2 = new TestDocument();
    doc2.sort = 2;
    let doc3 = { _id: uuid() };
    doc3.sort = 3;
    let docs = [ doc1, doc2, doc3 ];

    await collection.insertMany(docs);

    let countBeforeDelte = await collection.count();

    expect(countBeforeDelte).to.be.equal(docs.length);

    await collection.deleteMany({});

    let countAfterDelete = await collection.count();

    expect(countAfterDelete).to.be.equal(0);

  });

  it('should drop its collection', async () => {

    const collectionName = uuid();

    class TestDroppableCollection extends Collection {

      constructor () {

        super(TestDocument, collectionName);

      }

    }

    let collection = new TestDroppableCollection();
    await collection.insertOne(new TestDocument());

    const collectionsBeforeDrop = await db.collections();
    expect(collectionsBeforeDrop.map((collection) => collection.collectionName))
      .to.include(collectionName);

    await collection.drop();

    const collectionsAfterDrop = await db.collections();
    expect(collectionsAfterDrop.map((collection) => collection.collectionName))
      .not.include(collectionName);

  });

});
