# Modern Mongo

## Installation

    npm install modern-mongo

## Example

**0. Initialisation**

    const mm = require('mm');

**1. Create `Document` subclass**

    // Hide meta data with symbols
    const collection_symbol = Symbol();

    class PersonDocument extends mm.Document {

      // Constructor have to be like this
      constructor(collection) {
        super(collection);
        this[collection_symbol] = collection;
      }

      // Create custom methods
      // Override existing functions like save or validate
    }

**2. Create `Collection` subclass**

    // Hide meta data with symbols
    const collection_symbol = Symbol();

    class PersonCollection extends mm.Collection {

      // Constructor have to be like this
      constructor(db, collection_name) {
        super(collection, PersonDocument, collection_name);
        this[collection_symbol] = collection;
      }

      // Create custom methods
      // Override existing functions like findOne or findMany
    }


**3. Use your subclasses**

    let promisedConnection = mm.connect('mongodb_connection_string');

    promisedConnection.then((db) => {
      let persons = new PersonCollection(db, 'persons');
      let person = persons.new();

      person.name = 'Thomas';
      person.hobbies = [ 'programming', 'running', 'gaming' ];

      person.save()
        .then(() => persons.findOne())
        .then(console.log); // PersonDocument { name: 'Thomas', ... }
    })



## Test

**Environment**

- `TEST_DB`: string, MongoDB-Connection-String

**Command**

    npm test
