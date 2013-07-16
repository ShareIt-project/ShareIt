/**
 * Polyfill to add full support for JavaScript objects with an IndexedDB
 * interface. This is primary purpose because a bug storing files on Chromium
 * implementation (http://code.google.com/p/chromium/issues/detail?id=108012).
 * The drawback is that since it's implemented using pure JavaScript objects,
 * well... the data persistence lacks about some functionality... :-P
 * @author piranna
 */
indexedDB = indexedDB || webkitIndexedDB || mozIndexedDB || msIndexedDB;


/**
 * Test if IndexedDB has support for Blob objects
 * @param {Function} callback Callback called when support have been checked
 */
function testIDBBlobSupport(callback)
{
  var dbname = "detect-blob-support";
  var idb = indexedDB;

  idb.deleteDatabase(dbname).onsuccess = function()
  {
    var request = idb.open(dbname, 1);

    request.onupgradeneeded = function()
    {
      request.result.createObjectStore("store");
    };
    request.onsuccess = function()
    {
      var db = request.result;

      try
      {
        db.transaction("store", "readwrite").objectStore("store").put(new Blob(), "key");
        callback(true);
      }
      catch(e)
      {
        callback(false);
      }
      finally
      {
        db.close();
        idb.deleteDatabase(dbname);
      }
    };
  };
}


/**
 * Overwrites and install an only-memory IndexedDB object with support for Blob
 */
function IdbJS_install()
{
  /**
   * @constructor
   */
  function IDBRequest(source)
  {
    this.target = {}
  }
  IDBRequest.prototype =
  {
    set onsuccess(func)
    {
      this._onsuccess = func
      var event = {target: this.target}
      func.call(this, event)
    }
  }


  /**
   * @constructor
   */
  function IDBOpenRequest()
  {
    IDBRequest.call(this)

//    this.prototype.__defineSetter__("onupgradeneeded", function(func)
//    {
//      var event = {target: this.target}
//      func.call(this, event)
//    })
  }
  IDBOpenRequest.prototype = new IDBRequest()


  /**
   * @constructor
   */
  function IDBCursor(source, direction)
  {
    this._objects = []

    this._position = 0
//    this._position = undefined
    this._key = undefined
    this._value = undefined

    var gotValue = false

    this.advance = function(count)
    {
      if(count == 0)
        throw TypeError

//    if(!transaction.active)
//      throw DOMException("TransactionInactiveError");

      if(!gotValue)
        throw DOMException("InvalidStateError");

      for(var i=0; i<count; i++)
        steps_for_iterating_a_cursor(this, null)

      gotValue = false
    }

    this.continue = function(key)
    {
//    if(!transaction.active)
//      throw DOMException("TransactionInactiveError");

//      if(!gotValue)
//        throw DOMException("InvalidStateError");
//
//      if(key != undefined
//      &&(key <= this._position && (direction == 'next' || direction == 'nextunique')
//      || key >= this._position && (direction == 'prev' || direction == 'prevunique')))
//        throw DOMException("DataError");
//
//      steps_for_iterating_a_cursor(this, key)
//
//      gotValue = false

      this._position += 1

      var event = {target: {}}
      if(this.value)
        event.target.result = this

      this._request._onsuccess(event)
    }

    this.delete = function()
    {
      
    }

    this.update = function(value)
    {
      
    }

    this.__defineGetter__("source", function()
    {
      return source
    })

    this.__defineGetter__("direction", function()
    {
      return direction
    })

    this.__defineGetter__("primaryKey", function()
    {
    })
  }
  IDBCursor.prototype =
  {
    get key()
    {
      return this._key
    },

    get value()
    {
      return this._objects[this._position]
    }
  }


  function IDBIndex(name, objectStore, keyPath, optionalParameters)
  {
    var records = {}

    this._clear = function()
    {
      records = {}
    }

    this._delete = function(key)
    {
      for(var path in records)
      {
        var key_s = JSON.stringify(key)

        var record = records[path]
        var index = record.length - 1;

        for(; index>=0; index--)
        {
          var ref_s = JSON.stringify(record[index])
          if(ref_s == key_s)
            break
        }
        if(index < 0)
          continue

        records[path].splice(index, 1)

        if(!records[path].length)
          delete records[path]
      }
    }

    this._put = function(value, key)
    {
      function put(path, key)
      {
        if(optionalParameters.unique)
        {
          if(records[path])
            throw DOMException("ConstraintError")

          records[path] = [key]
        }
        else
        {
          records[path] = records[path] || []

          records[path].push(key)
          records[path].sort()
        }
      }

      var path = value[keyPath]

      if(path instanceof Array
      && optionalParameters.multiEntry)
      {
        var keys = []
        for(var i=0, record; record=path[i]; i++)
        {
          var ignore = false

          for(var j=0; j<keys.length; j++)
            if(keys[j] == record)
            {
              ignore = true
              break
            }

          if(!ignore)
          {
            keys.push(record)
            put(record, key)
          }
        }
      }
      else
        put(path, key)
    }

    this.get = function(key)
    {
      var request = this.getKey(key)
          request.result = objectStore.get(request.result).result

      return request
    }

    this.getKey = function(key)
    {
      var request = new IDBRequest()
          request.result = records[key][0]

      return request
    }

    this.openCursor = function(range, direction)
    {
      var request = this.openKeyCursor(range, direction)

      var cursor = request.target.result
      if(cursor)
        for(var i=0, ref; ref=cursor._objects[i]; i++)
          cursor._objects[i] = objectStore.get(ref).result

      return request
    }

    this.openKeyCursor = function(range, direction)
    {
//    if(!transaction.active)
//      throw DOMException("TransactionInactiveError");

//    if()
//      throw DOMException("InvalidStateError");

//    if()
//      throw DOMException("DataError");

      direction = direction || "next"

      var request = new IDBRequest()

      if(Object.keys(records).length)
      {
        // Fill the cursor with the objectstore objects
        var cursor = new IDBCursor(this, direction)

//        function steps_for_iterating_a_cursor(cursor, key)
//        {
//          var source = cursor.source
//          var records = source.records
//          var direction = cursor.direction
//          var position = cursor._position
//          var objectStorePosition = cursor._objectStore._position
//          var range = cursor._range
//
//          var foundRecord
//
//          return cursor
//        }

        function addKeys(key)
        {
          var refs = records[key]

          if(refs)
            for(var i=0, ref; ref=refs[i]; i++)
              cursor._objects.push(ref)
        }

        if(range != undefined)
          addKeys(range)

        else
          for(var key in records)
            addKeys(key)

        // Link the request and the cursor between them
        request.target.result = cursor
        cursor._request = request
      }

      return request
    }

    this.__defineGetter__("keyPath", function()
    {
      return keyPath
    })

    this.__defineGetter__("multiEntry", function()
    {
      return Boolean(optionalParameters.multiEntry)
    })

    this.__defineGetter__("name", function()
    {
      return name
    })

    this.__defineGetter__("objectStore", function()
    {
      return objectStore
    })

    this.__defineGetter__("unique", function()
    {
      return Boolean(optionalParameters.unique)
    })
  }
  IDBIndex.prototype =
  {
    count: function(key)
    {
      var request = new IDBRequest()

      return request
    }
  }


  /**
   * @constructor
   */
  function IDBObjectStore(name, keyPath, transaction, autoIncrement)
  {
    var objects = {}
    var indexes = {}

    function steps_for_extracting_a_key_from_a_value_using_a_key_path(keyPath, value)
    {
      if(keyPath instanceof Array)
      {
        var result = []

        for(var i=0,item; item=keyPath[i]; i++)
        {
          var result2 = steps_for_extracting_a_key_from_a_value_using_a_key_path(item, value)
          if(result2 == undefined)
            return

          result.push(result2)
        }

        return result
      }

      if(keyPath == "")
        return value

      var keyPath = keyPath.split(".")

      for(var i=0, attribute; attribute=keyPath[i]; i++)
      {
        var aux = value[attribute]
        if(aux == undefined)
          return
        value = aux
      }

      return value
    }

    function steps_for_storing_a_record_into_an_object_store(store, value, key, no_overwrite)
    {
      if(keyPath)
        key = steps_for_extracting_a_key_from_a_value_using_a_key_path(keyPath, value)

      if(!key)
        throw DOMException("DataError")

      if(no_overwrite && objects[key])
        throw DOMException(0, "ConstraintError")

      steps_for_deleting_records_from_an_object_store(store, key)

      objects[key] = value

      for(var name in indexes)
        indexes[name]._put(value, key)

      return key
    }

    function steps_for_deleting_records_from_an_object_store(store, key)
    {
//      var range = key

      delete objects[key]
      for(var name in indexes)
        indexes[name]._delete(key)
    }

    this.add = function(value, key)
    {
//      if(transaction.mode == "readonly")
//        throw DOMException("ReadOnlyError");

      if(this.keyPath && key)
        throw DOMException("DataError")

      steps_for_storing_a_record_into_an_object_store(this, value, key, true)

      var request = new IDBRequest()
          request.result = value

      return request
    }

    this.clear = function()
    {
      if(transaction.mode != "readonly")
        throw DOMException("ReadOnlyError");

      var request = new IDBRequest()

      objects = {}
      for(var name in indexes)
        indexes[name]._clear()

      return request
    }

    this.count = function(key)
    {
      var request = new IDBRequest(this)

//       = Object.keys(objects).length

      return request
    }

    this.createIndex = function(name, keyPath, optionalParameters)
    {
//      if(transaction.mode != "versionchange")
//        throw DOMException("InvalidStateError");

      // an index with the same name already exists in the object store
      if(indexes[name])
        throw DOMException("ConstraintError");

      optionalParameters = optionalParameters || {};

      if(keyPath instanceof Array)
      {
        if(optionalParameters.multiEntry)
          throw DOMException("InvalidAccessError")

        for(var i=0; i<keyPath.length; i++)
          keyPath[i] = keyPath[i].toString()
      }
      else
        keyPath = keyPath.toString()

      var index = new IDBIndex(name, this, keyPath, optionalParameters)
      indexes[name] = index

//      if()
//        transaction.abort()

      return index
    }

    this.delete = function(key)
    {
      steps_for_deleting_records_from_an_object_store(this, key)

      return new IDBRequest()
    }

    this.deleteIndex = function(indexName)
    {
      if(transaction.mode != "versionchange")
        throw DOMException("InvalidStateError");

      delete indexes[indexName]

    }

    this.get = function(key)
    {
      var request = new IDBRequest()
          request.result = objects[key]
      return request
    }

    this.index = function(name)
    {
      return indexes[name]
    }

    this.openCursor = function(range, direction)
    {
      direction = direction || "next"

      var request = new IDBRequest()

      if(Object.keys(objects).length)
      {
        // Fill the cursor with the objectstore objects
        var cursor = new IDBCursor(this, direction)
        for(var key in objects)
          cursor._objects.push(objects[key])

        // Link the request and the cursor between them
        request.target.result = cursor
        cursor._request = request
      }

      return request
    }

    this.put = function(value, key)
    {
//      if(transaction.mode == "readonly")
//        throw DOMException("ReadOnlyError");

      if(this.keyPath && key)
        throw DOMException("DataError")

      steps_for_storing_a_record_into_an_object_store(this, value, key, false)

      var request = new IDBRequest()
          request.result = value

      return request
    }

    this.__defineGetter__("indexNames", function()
    {
      return Object.keys(indexes);
    })
    this.__defineGetter__("keyPath", function()
    {
      return keyPath
    })

    this.__defineGetter__("name", function()
    {
      return name
    })

    this.__defineGetter__("transaction", function()
    {
      return transaction
    })

    this.__defineGetter__("autoIncrement", function()
    {
      return autoIncrement
    })
  }


  /**
   * @constructor
   */
  function IDBTransaction(db, mode)
  {
    this.abort = function()
    {
      
    }

    this.objectStore = function(name)
    {
      return db._stores[name]
    }

    this.__defineGetter__("db", function()
    {
      return db
    })

    this.__defineGetter__("error", function()
    {
      return error
    })

    this.__defineGetter__("mode", function()
    {
      return mode
    })
  }


  function IDBDatabase()
  {
    this._stores = {}

    this.createObjectStore = function(name, optionalParameters)
    {
      var keyPath = optionalParameters.keyPath
      var autoIncrement = optionalParameters.autoIncrement

      if(autoIncrement && (keyPath == "" || keyPath instanceof Array))
        throw InvalidAccessError

      if(keyPath instanceof Array)
        for(var i=0; i<keyPath.length; i++)
          keyPath[i] = keyPath[i].toString()
      else
        keyPath = keyPath.toString()

      var objectStore = new IDBObjectStore(name, keyPath)

      this._stores[name] = objectStore

      return objectStore
    }

    this.setVersion = function(version)
    {
      this.version = version

      return new IDBRequest()
    }

    this.transaction = function(storeNames, mode)
    {
      return new IDBTransaction(this, mode)
    }
  }


  indexedDB._dbs = {}
  indexedDB.open = function(name, version)
  {
    this._dbs[name] = this._dbs[name] || new IDBDatabase()

    var request = new IDBOpenRequest()
      request.result = this._dbs[name]

    return request
  }
}