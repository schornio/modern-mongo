# Modern Mongo

[![Build Status](https://travis-ci.org/JournalOne/modern-mongo.svg?branch=master)](https://travis-ci.org/JournalOne/modern-mongo)

Class interface for MongoDB.

## Installation

```
npm install modern-mongo
```

**Environment**

- `MONGODB_CONNECTION`: mongodb connection string, must be provided

## Example

**1. Create `Document` subclass**
```
class Person extends Document {

  constructor() {
    super(customJsonSchema);
  }

  // Create custom methods

}
```
**2. Create `Collection` subclass**
```

class PersonCollection extends Collection {

  constructor() {
    super(Person);
  }

  // Create custom methods

}
```

**Note**: mongodb collection name is the provided document name to lower case. (In this example 'person')

**3. Use your subclasses**
```
let persons = new PersonCollection();
let person = new Person();

person.name = 'Thomas';
person.hobbies = [ 'programming', 'running', 'gaming' ];

await persons.insertOneSafe(person);
```

## Test

**Environment**

- `MONGODB_CONNECTION`: string, MongoDB-Connection-String

**Command**

    npm test

## API

### `class Document`

- `getCollection ()`
- `setCollection (collection)`
- `getSchema ()`
- `setSchema (schema)`
- `getValidator ()`
- `validate ()`
- `applyBareObject (bareObject)`
- `async setFields (fields, safe)`
- `async setFieldsSafe (fields)`
- `async incrementFields (fields)`
- `async incrementFieldsSafe (fields)`
- `async deleteDocument ()`

### `class Collection`

- `newDocument ()`
- `async findOne (...args)`
- `async findOneById (_id)`
- `async findMany (...args)`
- `async findManyByIds (_ids)`
- `async findOneAndUpdateUnsafe (...args)`
- `async insertOne (doc, options, safe)`
- `async insertOneSafe (doc, options)`
- `async insertMany (docs, options, safe)`
- `async insertManySafe (docs, options)`
- `async updateOneUnsafe (...args)`
- `async updateManyUnsafe (...args)`
- `async deleteOne (...args)`
- `async deleteMany (...args)`
- `async count (...args)`
- `async drop (...args)`
