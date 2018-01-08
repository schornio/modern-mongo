'use strict';

const {
  ERROR_INVALID_DOCUMENT,
} = require('./errors');

/* istanbul ignore next */
const MODERN_MONGO_VALIDATE = process.env.MODERN_MONGO_VALIDATE === 'false' ? false : true;

const Document = require('./document');

class Collection {

  constructor(db, documentClass, collection_name) {

    this.documentClass = documentClass;
    this.collection = db.collection(collection_name);

  }

  newDocument () {

    let doc = new this.documentClass();
    doc.setCollection(this);
    return doc;

  }

  async findOne (...args) {

    let bareObject = await this.collection.findOne(...args);

    if (bareObject) {

      let doc = this.newDocument();
      doc.applyBareObject(bareObject);
      return doc;

    } else {

      return null;

    }

  }

  async findMany (...args) {

    let cursor = this.collection.find(...args);
    let bareObjects = await cursor.toArray();

    let docs = bareObjects.map((bareObject) => {

      let doc = this.newDocument();
      doc.applyBareObject(bareObject);
      return doc;

    });

    return docs;

  }

  async findOneAndUpdateUnsafe (...args) {

    let dbResponse = await this.collection.findOneAndUpdate(...args);

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

    if (MODERN_MONGO_VALIDATE || safe) {

      let isValid = doc.validate();

      if (!isValid) {

        throw new Error(ERROR_INVALID_DOCUMENT);

      }

    }

    return await this.collection.insertOne(doc, options);

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

    if (MODERN_MONGO_VALIDATE || safe) {

      for (let doc of docs) {

        let isValid = doc.validate();

        if (!isValid) {

          throw new Error(ERROR_INVALID_DOCUMENT);

        }

      }

    }

    return await this.collection.insertMany(docs, options);

  }

  async insertManySafe (docs, options) {

    return await this.insertMany(docs, options, true);

  }

  async updateOneUnsafe (...args) {

    return await this.collection.updateOne(...args);

  }

  async updateManyUnsafe (...args) {

    return await this.collection.updateMany(...args);

  }

  async deleteOne (...args) {

    return await this.collection.deleteOne(...args);

  }

  async count (...args) {

    return await this.collection.count(...args);

  }

}

module.exports = Collection;
