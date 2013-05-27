var shareit = (function(module){
var _priv = module._priv = module._priv || {}


_priv.Transport_Fileslist_init = function(transport, db)
{
  // Host

  function generateFileObject(fileentry)
  {
    var path = '';
    if(fileentry.sharedpoint)
    {
      path += fileentry.sharedpoint;
      if(fileentry.path != '')
        path += '/' + fileentry.path;
    }
    var name = fileentry.file ? fileentry.file.name : fileentry.name
    var blob = fileentry.file || fileentry.blob || fileentry;

    var result =
    {
      path: path,
      name: name,

      hash: fileentry.hash,
      size: blob.size,
      type: blob.type
    };

    // Dropbox plugin start
    if(fileentry.dropbox)
      result.dropbox = fileentry.dropbox;
    // Dropbox plugin end

    return result;
  }

  /**
   * Addapt and send to the other peer our list of shared files
   * @param {Array} fileslist Our list of {Fileentry}s.
   */
  transport._send_files_list = function(fileslist)
  {
    var files_send = [];

    for(var i = 0, fileentry; fileentry = fileslist[i]; i++)
      files_send.push(generateFileObject(fileentry));

    transport.emit('fileslist.send', files_send);
  };


  var send_updates = false;

  /**
   * Notify to the other peer that we have added a new file
   * @param {Fileentry} fileentry {Fileentry} of the new added file.
   */
  transport._send_file_added = function(fileentry)
  {
    if(send_updates)
      transport.emit('fileslist.added', generateFileObject(fileentry));
  };

  /**
     * Notify to the other peer that we have deleted a new file
     * @param {Fileentry} fileentry {Fileentry} of the deleted file.
     */
  transport._send_file_deleted = function(fileentry)
  {
    if(send_updates)
      transport.emit('fileslist.deleted', fileentry.hash);
  };

  var SEND_UPDATES = 1;

  /**
   * Catch request for our files list
   */
  transport.addEventListener('fileslist.query', function(event)
  {
    var flags = event.data[0];

    db.files_getAll(null, function(error, fileslist)
    {
      if(error)
        console.error(error)

      else
        transport._send_files_list(fileslist)
    });

    send_updates = flags & SEND_UPDATES;
  });

  /**
   * Catch request to disable sending our files list updates
   */
  transport.addEventListener('fileslist.disableUpdates', function(event)
  {
    send_updates = false;
  });


  // Peer

  /**
   * Catch new sended data for the other peer fileslist
   */
  transport.addEventListener('fileslist.send', function(event)
  {
    var fileentries = event.data[0];

    // Update the fileslist for this peer
    db.files_getAll_byPeer(transport.uid, function(error, fileslist)
    {
      // Remove old peer fileslist
      for(var i = 0, fileentry; fileentry = fileslist[i]; i++)
      {
        var key = [fileentry.peer,
                   fileentry.sharedpoint,
                   fileentry.path,
                   fileentry.name]
        db.files_delete(key)
      }

      // Set new fileslist for this peer
      for(var i = 0, fileentry; fileentry = fileentries[i]; i++)
      {
        fileentry.peer = transport.uid
        fileentry.sharedpoint = ""

        db.files_put(fileentry)
      }

      // [ToDo] Use parallize
      for(var i = 0, fileentry; fileentry = fileentries[i]; i++)
        if(!fileentry.bitmap)
          db.files_getAll_byHash(fileentry.hash,
          function(error, fileentries)
          {
            if(fileentries.length)
            {
              var duplicates = []

              for(var i=0, entry; entry=fileentries[i]; i++)
                if(fileentry.peer        != entry.peer
                || fileentry.sharedpoint != entry.sharedpoint
                || fileentry.path        != entry.path
                || fileentry.name        != entry.name)
                  duplicates.push(entry)

              if(duplicates.length)
                fileentry.duplicates = duplicates
            }
          })

      // Notify about fileslist update
      var event = document.createEvent("Event");
          event.initEvent('fileslist._send',true,true);
          event.fileslist = fileentries
          event.uid = transport.uid

      transport.dispatchEvent(event);
    })
  });

  /**
   * Request the other peer fileslist
   */
  transport.fileslist_query = function(flags)
  {
    transport.emit('fileslist.query', flags);
  };

  /**
   * Request to the other peer don't send fileslist updates
   */
  transport.fileslist_disableUpdates = function()
  {
    transport.emit('fileslist.disableUpdates');
  };


  // fileslist updates

  /**
   * Catch when the other peer has added a new file
   */
  transport.addEventListener('fileslist.added', function(event)
  {
    var fileentry = event.data[0];
        fileentry.peer = transport.uid
        fileentry.sharedpoint = ""

    db.files_put(fileentry, function(error)
    {
      // [ToDo] Check if we have already the file from this peer in the index so
      // we don't dispatch the event twice


      db.files_getAll_byPeer(transport.uid, function(error, fileslist)
      {
        // Notify about fileslist update
        var event = document.createEvent("Event");
            event.initEvent('fileslist._added',true,true);
            event.fileslist = fileslist
            event.uid = transport.uid

        transport.dispatchEvent(event);
      })
    })
  });

  /**
   * Catch when the other peer has deleted a file
   */
  transport.addEventListener('fileslist.deleted', function(event)
  {
    var fileentry = event.data[0];
        fileentry.peer = transport.uid

    // Remove the fileentry from the fileslist
    db.files_delete(fileentry, function(error)
    {
      db.files_getAll_byPeer(transport.uid, function(error, fileslist)
      {
        // Notify about fileslist update
        var event = document.createEvent("Event");
            event.initEvent('fileslist._deleted',true,true);
            event.fileslist = fileslist
            event.uid = transport.uid

        transport.dispatchEvent(event);
      })
    })
  });
}

return module
})(shareit || {})