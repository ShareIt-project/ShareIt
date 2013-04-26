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
    queue.splice(queue.indexOf(fileentry.file));

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
  this.hash = function(files, sharedpoint_name)
  {
    function hash(file)
    {
      // File has zero size
      if(!file.size)
      {
        var fileentry =
        {
            // Precalculated hash for zero sized files
            hash: 'z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==',
            file: file
        }

        fileentry_hashed(fileentry);

        return
      }

      // Ignore files that are already on the queue
      for(var j = 0, q; q = queue[j]; j++)
        if(file == q)
          return;

      queue = queue.push(file);

      // Process the file
      var path = file.webkitRelativePath.split('/').slice(1, -1).join('/');
      var fileentry =
      {
        'sharedpoint': sharedpoint_name,
        'path': path,
        'file': file
      };

      worker.postMessage(['hash', fileentry]);
    }

    if(files typeof Array)
      // Run over all the files on the queue and process them
      for(var i=0, file; file=files[i]; ++i)
        hash(file, sharedpoint_name)

    else
      hash(files, sharedpoint_name)
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
          for(var i = 0; i < sharedpoints.length; i++)
            if(sharedpoints[i].name == name)
              return true;
        }

        // Remove all unaccesible files
        for(var i = 0, fileentry; fileentry = fileentries[i]; i++)
          if(fileentry.sharedpoint)
          {
            // Sharedpoint was removed, remove the file from database
            if(!sharedpoint_exist(fileentry.sharedpoint.name))
              fileentry_delete(fileentry);

          // File is a real filesystem one, rehash it
            else if(fileentry.file)
              worker.postMessage(['refresh', fileentry]);
          }

          // Update timeout for the next refresh walkabout
          if(sharedpoints.length & policy)
            policy(updateTimeout);
          else
            updateTimeout();
      });
    });
  };

  // Start hashing new files from the shared points on load
//  self.refresh()
}

return module
})(shareit || {})