var shareit = (function(module){
var _priv = module._priv = module._priv || {}

var indexedDB = indexedDB || webkitIndexedDB || mozIndexedDB || msIndexedDB;

/**
 * Initializes the database
 * @param {Function} callback Callback called when database is ready.
 */
_priv.DB_init = function(callback)
{
  var version = 2;

  function upgradedb(db)
  {
    // Create an objectStore to hold information about the share points.
    db.createObjectStore('sharepoints',
    {
      keyPath: 'name'
    });

    // Create an objectStore to hold information about the shared files.
    // We're going to use "hash" as our key path because it's guaranteed to
    // be unique.
    var files = db.createObjectStore('files',
    {
      keyPath: ["peer", "sharedpoint", "path", "name"]
    });
    files.createIndex("byHash", "hash", {unique: false})
    files.createIndex("byPeer", "peer", {unique: false})
  }

  var request = indexedDB.open('ShareIt', version);
  request.onerror = function(event)
  {
    callback("Why didn't you allow my web app to use IndexedDB?!");
  };
  request.onsuccess = function(event)
  {
    var db = request.result;

    // Hack for old versions of Chrome/Chromium
    if(version != db.version)
    {
      var setVrequest = db.setVersion(version);
      setVrequest.onsuccess = function(e)
      {
        upgradedb(db);
      };
    }

    /**
     * Add an object to the specified {IDBObjectStore}
     * @param {String} objectStore Name of the {IDBObjectStore}.
     * @param {Object} data Object to be added to the {IDBObjectStore}.
     * @param {Function} onsuccess Callback called when object was added.
     * @param {Function} onerror Callback called when object was not
     * able to be added.
     */
    db._add = function(objectStore, data, callback)
    {
      var transaction = db.transaction(objectStore, 'readwrite');
      var objectStore = transaction.objectStore(objectStore);

      var request = objectStore.add(data);
      if(callback)
      {
        request.onsuccess = function(event)
        {
          callback(null, request.result);
        };
        request.onerror = function(event)
        {
          callback(event.target.errorCode);
        };
      }
    };

    /**
     * Delete an object from the specified {IDBObjectStore}
     * @param {String} objectStore Name of the {IDBObjectStore}.
     * @param {String} key Name of the key to deleted on the
     * {IDBObjectStore}.
     * @param {Function} onsuccess Callback called when object was
     * deleted.
     * @param {Function} onerror Callback called when key was not able
     * to be deleted.
     */
    db._delete = function(objectStore, key, callback)
    {
      var transaction = db.transaction(objectStore, 'readwrite');
      var objectStore = transaction.objectStore(objectStore);

      var request = objectStore.delete(key);
      if(callback)
      {
        request.onsuccess = function(event)
        {
          callback(null, request.result);
        };
        request.onerror = function(event)
        {
          callback(event.target.errorCode);
        };
      }
    };

    /**
     * Get an object from the specified {IDBObjectStore}
     * @param {String} objectStore Name of the {IDBObjectStore}.
     * @param {String} key Name of the key to be get from the
     * {IDBObjectStore}.
     * @param {Function} onsuccess Callback called when object was
     * gotten.
     * @param {Function} onerror Callback called when object was not
     * able to be gotten.
     */
    db._get = function(objectStore, key, callback)
    {
      var transaction = db.transaction(objectStore);
      var objectStore = transaction.objectStore(objectStore);

      var request = objectStore.get(key);
      if(callback)
      {
        request.onsuccess = function(event)
        {
          callback(null, request.result);
        };
        request.onerror = function(event)
        {
          callback(event.target.errorCode);
        };
      }
    };

    /**
     * Get all objects from the specified {IDBObjectStore}
     * @param {String} objectStore Name of the {IDBObjectStore}.
     * @param {?IDBRange} range Range to delimit keys to be gotten.
     * @param {Function} onsuccess Callback called when objects were
     * gotten.
     * @param {Function} onerror Callback called when object were not
     * able to be gotten.
     */
    db._getAll = function(objectStore, range, callback)
    {
      var result = [];

      var transaction = db.transaction(objectStore);
      var objectStore = transaction.objectStore(objectStore);

      var request = objectStore.openCursor(range);
      request.onsuccess = function(event)
      {
        var cursor = event.target.result;
        if(cursor)
        {
          result.push(cursor.value);
          cursor.continue();
        }
        else
          callback(null, result);
      };
      request.onerror = function(event)
      {
        callback(event.target.errorCode);
      };
    };

    /**
     * Update or add an object on the specified {IDBObjectStore}
     * @param {String} objectStore Name of the {IDBObjectStore}.
     * @param {Object} data Object to be added to the {IDBObjectStore}.
     * @param {Function} onsuccess Callback called when object was
     * updated or added.
     * @param {Function} onerror Callback called when object was not
     * able to be updated or added.
     */
    db._put = function(objectStore, data, callback)
    {
      var transaction = db.transaction(objectStore, 'readwrite');
      var objectStore = transaction.objectStore(objectStore);

      var request = objectStore.put(data);
      if(callback)
      {
        request.onsuccess = function(event)
        {
          callback(null, request.result);
        };
        request.onerror = function(event)
        {
          callback(event.target.errorCode);
        };
      }
    };

    /**
     * Add a {Sharedpoint}
     * @param {Sharedpoint} sharedpoint {Sharedpoint} to be added.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint} was added.
     * @param {Function} onerror Callback called when the {Sharedpoint}
     * was not able to be added.
     */
    db.sharepoints_add = function(sharedpoint, callback)
    {
      db._add('sharepoints', sharedpoint, callback);
    };

    /**
     * Delete a {Sharedpoint}
     * @param {String} key {Sharedpoint} to be deleted.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint} was deleted.
     * @param {Function} onerror Callback called when the {Sharedpoint}
     * was not able to be deleted.
     */
    db.sharepoints_delete = function(key, callback)
    {
      db._delete('sharepoints', key, callback);
    };

    /**
     * Get a {Sharedpoint}
     * @param {String} key {Sharedpoint} to be gotten.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint} was gotten.
     * @param {Function} onerror Callback called when the {Sharedpoint}
     * was not able to be gotten.
     */
    db.sharepoints_get = function(key, callback)
    {
      db._get('sharepoints', key, callback);
    };

    /**
     * Get all the {Sharedpoint}s
     * @param {?IDBRange} range Range of {Sharedpoint}s to be gotten.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint}s were gotten.
     * @param {Function} onerror Callback called when the {Sharedpoint}s
     * were not able to be gotten.
     */
    db.sharepoints_getAll = function(range, callback)
    {
      db._getAll('sharepoints', range, callback);
    };

    /**
     * Update or add a {Sharedpoint}
     * @param {Sharedpoint} sharedpoint {Sharedpoint} to be updated or
     * added.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint} was updated or added.
     * @param {Function} onerror Callback called when the {Sharedpoint}
     * was not able to be updated or added.
     */
    db.sharepoints_put = function(sharedpoint, callback)
    {
      db._put('sharepoints', sharedpoint, callback);
    };

    /**
     * Add a {Fileentry}
     * @param {Fileentry} fileentry {Fileentry} to be added.
     * @param {Function} onsuccess Callback called when the {Fileentry}
     * was added.
     * @param {Function} onerror Callback called when the {Fileentry}
     * was not able to be added.
     */
    db.files_add = function(fileentry, callback)
    {
      db._add('files', fileentry, callback);
    };

    /**
     * Delete a {Fileentry}
     * @param {String} key {Fileentry} to be deleted.
     * @param {Function} onsuccess Callback called when the {Fileentry}
     * was deleted.
     * @param {Function} onerror Callback called when the {Fileentry}
     * was not able to be deleted.
     */
    db.files_delete = function(key, callback)
    {
      db._delete('files', key, callback);
    };

    /**
     * Get a {Sharedpoint}
     * @param {String} key {Sharedpoint} to be gotten.
     * @param {Function} onsuccess Callback called when the
     * {Sharedpoint} was gotten.
     * @param {Function} onerror Callback called when the {Sharedpoint}
     * was not able to be gotten.
     */
    db.files_get = function(key, callback)
    {
      db._get('files', key, callback);
    };

    /**
     * Get all the {Fileentry}s
     * @param {?IDBRange} range Range of {Fileentry}s to be gotten.
     * @param {Function} onsuccess Callback called when the {Fileentry}s
     * were gotten.
     * @param {Function} onerror Callback called when the {Fileentry}
     * was not able to be gotten.
     */
    db.files_getAll = function(range, callback)
    {
      db._getAll('files', range, callback);
    };

    db.files_getAll_byHash = function(uid, callback)
    {
      var result = []

      var transaction = db.transaction('files', 'readonly');
      var objectStore = transaction.objectStore('files');
      var index = objectStore.index("byHash");

      var request = index.openCursor(uid);

      request.onsuccess = function(event)
      {
        var cursor = event.target.result;
        if(cursor)
        {
          result.push(cursor.value);
          cursor.continue();
        }
        else
          callback(null, result);
      };
      request.onerror = function(event)
      {
        callback(event.target.errorCode);
      };
    };

    db.files_getAll_byPeer = function(uid, callback)
    {
      var result = []

      var transaction = db.transaction('files', 'readonly');
      var objectStore = transaction.objectStore('files');
      var index = objectStore.index("byPeer");

      var request = index.openCursor(uid);

      request.onsuccess = function(event)
      {
        var cursor = event.target.result;
        if(cursor)
        {
          result.push(cursor.value);
          cursor.continue();
        }
        else
          callback(null, result);
      };
      request.onerror = function(event)
      {
        callback(event.target.errorCode);
      };
    };

    /**
     * Update or add a {Fileentry}
     * @param {Fileentry} fileentry {Fileentry} to be updated or added.
     * @param {Function} onsuccess Callback called when the {Fileentry}
     * was updated or added.
     * @param {Function} onerror Callback called when the {Fileentry}
     * was not able to be updated or added.
     */
    db.files_put = function(fileentry, callback)
    {
      db._put('files', fileentry, callback);
    };

    callback(null, db);
  };
  request.onupgradeneeded = function(event)
  {
    upgradedb(event.target.result);
  };
}

return module
})(shareit || {})