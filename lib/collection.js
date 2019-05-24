'use strict';

const {
  ERROR_INVALID_DOCUMENT,
} = require('./errors');

const connect = require('./connect');
const Document = require('./document');

class Collection {

  constructor(documentClass, collectionName = documentClass.name.toLowerCase()) {

    this.documentClass = documentClass;
    this.collectionName = collectionName;

  }

  newDocument () {

    let doc = new this.documentClass();
    doc.setCollection(this);
    return doc;

  }

  async getNativeCollection () {

    if (!this.nativeCollection) {

      let { db } = await connect();
      this.nativeCollection = db.collection(this.collectionName);

    }

    return this.nativeCollection;

  }

  async findOne (...args) {

    const collection = await this.getNativeCollection();
    let bareObject = await collection.findOne(...args);

    if (bareObject) {

      let doc = this.newDocument();
      doc.applyBareObject(bareObject);
      return doc;

    } else {

      return null;

    }

  }

  async findOneById (_id) {

    return await this.findOne({ _id });

  }

  async findMany (...args) {

    const collection = await this.getNativeCollection();
    let cursor = collection.find(...args);
    let bareObjects = await cursor.toArray();

    let docs = bareObjects.map((bareObject) => {

      let doc = this.newDocument();
      doc.applyBareObject(bareObject);
      return doc;

    });

    return docs;

  }

  async findManyByIds (_ids, options) {

    return await this.findMany({
      _id: {
        '$in': _ids
      }
    }, options);

  }

  async findOneAndUpdateUnsafe (...args) {

    const collection = await this.getNativeCollection();
    let dbResponse = await collection.findOneAndUpdate(...args);

    if (dbResponse.value) {

      let doc = this.newDocument();
      doc.applyBareObject(dbResponse.value);
      return doc;

    } else {

      return null;

    }

  }

  async insertOne (doc, options, safe) {

    if (!(doc instanceof Document)) {

      let wellInstancedDoc = this.newDocument();
      wellInstancedDoc.applyBareObject(doc);
      doc = wellInstancedDoc;

    }

    doc.setCollection(this);

    if (safe) {

      let isValid = doc.validate();

      if (!isValid) {

        throw new Error(ERROR_INVALID_DOCUMENT);

      }

    }

    const collection = await this.getNativeCollection();
    return await collection.insertOne(doc, options);

  }

  async insertOneSafe (doc, options) {

    return await this.insertOne(doc, options, true);

  }

  async insertMany (docs, options, safe) {

    docs = docs.map((doc) => {

      if (!(doc instanceof Document)) {

        let wellInstancedDoc = this.newDocument();
        wellInstancedDoc.applyBareObject(doc);
        return wellInstancedDoc;

      } else {

        doc.setCollection(this);
        return doc;

      }

    });

    if (safe) {

      for (let doc of docs) {

        let isValid = doc.validate();

        if (!isValid) {

          throw new Error(ERROR_INVALID_DOCUMENT);

        }

      }

    }

    const collection = await this.getNativeCollection();
    return await collection.insertMany(docs, options);

  }

  async insertManySafe (docs, options) {

    return await this.insertMany(docs, options, true);

  }

  async updateOneUnsafe (...args) {

    const collection = await this.getNativeCollection();
    return await collection.updateOne(...args);

  }

  async updateManyUnsafe (...args) {

    const collection = await this.getNativeCollection();
    return await collection.updateMany(...args);

  }

  async deleteOne (...args) {

    const collection = await this.getNativeCollection();
    return await collection.deleteOne(...args);

  }

  async deleteMany (...args) {

    const collection = await this.getNativeCollection();
    return await collection.deleteMany(...args);

  }

  async count (...args) {

    const collection = await this.getNativeCollection();
    return await collection.countDocuments(...args);

  }

  async drop (...args) {

    const collection = await this.getNativeCollection();
    return await collection.drop(...args);

  }

}

module.exports = Collection;
