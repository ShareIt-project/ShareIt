var shareit = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Update the SharedPoints and hash its files
 * @param {IDBDatabase} db ShareIt! database.
 * @param {?Function} policy Function to manage the policy access.
 */
_priv.Hasher = function(db, policy, sharedpointsManager)
{
  var queue = [];
  var timeout;

  var self = this;

  /**
   * Refresh hashes after one hour
   */
  function updateTimeout()
  {
    clearTimeout(timeout);
    timeout = setTimeout(function()
    {
      self.refresh();
//    }, 30*1000)
    }, 60 * 60 * 1000);
  }

  /**
   * Delete a {Fileentry} (mainly because it was removed from the filesystem)
   * @param {Fileentry} fileentry {Fileentry} to be removed from database.
   */
  function fileentry_delete(fileentry)
  {
    // Remove file from the database
    db.files_delete(fileentry.hash, function(error, result)
    {
      if(error)
        console.error(error)

      // Notify that the file have been deleted
      else if(self.ondeleted)
        self.ondeleted(fileentry);
    });
  }

  /**
   * Set a {Fileentry} as hashed and store it on the database
   * @param {Fileentry} fileentry {Fileentry} to be added to the database.
   */
  function fileentry_hashed(fileentry)
  {
    // Remove hashed file from the queue
    queue.splice(queue.indexOf(fileentry));

    /**
     * Add file to the database
     */
    function addFile(fileentry)
    {
      fileentry.peer = ""  // File is shared by us
      fileentry.name = fileentry.file.name

      db.files_put(fileentry, function(error, result)
      {
        if(error)
          console.error(error)

        // Notify that the file have been hashed
        else if(self.onhashed)
          self.onhashed(fileentry);
      });
    }

//    // Dropbox plugin start
//    if(dropboxClient
//    && fileentry.sharedpoint == "Dropbox")
//    {
//      var options = {download: true, downloadHack: true}
//
//      dropboxClient.makeUrl(fileentry.path+'/'+name, options,
//      function(error, publicUrl)
//      {
//        if(publicUrl)
//          fileentry.dropbox = publicUrl.url
//
//        addFile(fileentry)
//      })
//    }
//    else
//    // Dropbox plugin end
      addFile(fileentry);
  }

  var worker = new Worker('js/shareit-core/hasher/worker.js');
  worker.onmessage = function(event)
  {
    var fileentry = event.data[1];

    switch(event.data[0])
    {
      case 'delete':
        fileentry_delete(fileentry);
        break;

      case 'hashed':
        fileentry_hashed(fileentry);
    }

    // Update refresh timeout after each worker message
    updateTimeout();
  };

  /**
   * Hash the files from a {Sharedpoint}.
   * @param {Array} files List of files to be hashed.
   */
  this.hash = function(fileentry)
  {
    // File has zero size
    if(!fileentry.file.size)
    {
      // Precalculated hash for zero sized files
      fileentry.hash = 'z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==',

      fileentry_hashed(fileentry);

      return
    }

    // Ignore files that are already on the queue
    for(var j = 0, q; q = queue[j]; j++)
      if(fileentry.file == q)
        return;

    // Hash the file
    queue.push(fileentry);
    worker.postMessage(['hash', fileentry]);
  };

  /**
   * Refresh the {Sharedpoint}s and {Fileentry}s on the database
   */
  this.refresh = function()
  {
    // Hasher is working, just return
    if(timeout == 'hashing')
      return;

    // Hasher is not working, start hashing files
    console.info('Starting hashing refresh');

    clearTimeout(timeout);
    timeout = 'hashing';

    sharedpointsManager.getSharedpoints(function(error, sharedpoints)
    {
      if(error)
      {
        console.error(error)
        return
      }

      db.files_getAll(null, function(error, fileentries)
      {
        if(error)
        {
          console.error(error)
          return
        }

        /**
         * Check if the sharedpoint of a file exists or have been removed
         */
        function sharedpoint_exist(name)
        {
          for(var i=0; i<sharedpoints.length; i++)
            if(sharedpoints[i].name == name)
              return true;
        }

        // Remove all unaccesible files
        for(var i=0, fileentry; fileentry=fileentries[i]; i++)
          if(fileentry.sharedpoint)
          {
            // Sharedpoint was removed, remove the file from database
            if(!sharedpoint_exist(fileentry.sharedpoint.name))
              fileentry_delete(fileentry);
          }

          // Update timeout for the next refresh walkabout
          if(sharedpoints.length & policy)
            policy(updateTimeout);
          else
            updateTimeout();
      });
    });
  };
}

return module
})(shareit || {})