# Modern Mongo

[![Build Status](https://travis-ci.org/JournalOne/modern-mongo.svg?branch=master)](https://travis-ci.org/JournalOne/modern-mongo)

Modern interface for MongoDB. Written in ES8.

## Installation

```
npm install modern-mongo
```

**Environment**

- `MODERN_MONGO_VALIDATE`: string, if `false` it turns off Json-Schema validation

## Example

**0. Initialisation**

```
const { connect, Document, Collection } = require('modern-mongo');

...

let db = await connect('connectionString');
```

**1. Create `Document` subclass**
```
class Person extends Document {

  constructor() {
    super();
    this.setSchema(customJsonSchema);
  }

  // Create custom methods

}
```
**2. Create `Collection` subclass**
```
const collectionName = 'persons';

class PersonCollection extends Collection {

  constructor(db) {
    super(db, PersonDocument, collectionName);
  }

  // Create custom methods

}
```

**3. Use your subclasses**
```
let persons = new PersonCollection(db);
let person = new Person();

person.name = 'Thomas';
person.hobbies = [ 'programming', 'running', 'gaming' ];

await persons.insertOneSafe(person);
```

## Test

**Environment**

- `TEST_DB`: string, MongoDB-Connection-String

**Command**

    npm test
