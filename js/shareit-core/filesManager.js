var shareit = (function(module){
var _priv = module._priv = module._priv || {}

module.chunksize = 65536;


/**
 *
 * @param {IDBDatabase} db ShareIt! database.
 */
_priv.FilesManager = function(db, webp2p)
{
  EventTarget.call(this);

  var self = this;

  // Init hasher
  var hasher = new _priv.Hasher(db, policy, this);
  hasher.onhashed = function(fileentry)
  {
    // Notify the other peers about the new hashed file
    self._send_file_added(fileentry);
  };
  hasher.ondeleted = function(fileentry)
  {
    // Notify the other peers about the deleted file
    self._send_file_deleted(fileentry);
  };


  /**
   * Get the channel of one of the peers that have the file from its hash.
   *
   * @param {Fileentry} Fileentry of the file to be downloaded.
   * @return {RTCDataChannel} Channel where we can ask for data of the file.
   */
  function getChannel(hash, cb)
  {
    db.files_getAll_byHash(hash, function(error, fileentries)
    {
      for(var i=0, fileentry; fileentry=fileentries[i]; i++)
        if(fileentry.peer != "")
        {
          var peers = webp2p.getPeers()
          var peer = peers[fileentry.peer]
          var channel = peer.channels['transfer']

          cb(null, channel);
          return
        }

      cb("No available peers to finish downloading the file");
    })
  }

  /**
   * Request (more) data for a file
   * @param {Fileentry} Fileentry of the file to be requested.
   */
  function transfer_query(fileentry)
  {
    getChannel(fileentry.hash, function(error, channel)
    {
      if(error)
        console.error(error)

      else
      {
        var chunk = fileentry.bitmap.getRandom(false);

        channel.transfer_query(fileentry, chunk);
      }
    });
  }


  webp2p.addEventListener('peerconnection', function(event)
  {
    var peer = event.peerconnection
    var uid  = event.uid

    console.log('Created peerconnection: ' + uid);

    peer.addEventListener('datachannel', function(event)
    {
      var channel = event.channel
      console.log(channel.readyState)

      console.log('Created datachannel "' + uid + ':' + channel.label + '"');

      switch(channel.label)
      {
        case 'fileslist':
          _priv.Transport_Fileslist_init(channel, db, self, uid)
          break

//        case 'search':
//          initDataChannel_search(channel, uid)
//          break

        case 'transfer':
          _priv.Transport_Transfer_init(channel, db, self)
          break

        default:
          console.warn("Unknown channel: "+channel.label)
      }
    })
  })


  /**
   * Start the download of a file
   * @param {Fileentry} Fileentry of the file to be downloaded.
   */
  this.transfer_begin = function(fileentry)
  {
    function onerror(errorCode)
    {
      console.error("Transfer begin: '" + fileentry.name + "' is already in database.");
    }

    // Create a new fileentry
    var new_fileentry =
    {
      peer: "",
      sharedpoint: "",
      path: fileentry.path,
      name: fileentry.name,

      hash: fileentry.hash
    }

    // Add a blob container to our file stub
    new_fileentry.blob = new Blob([''],
    {
      type: fileentry.type
    });

    // File size is zero, generate the file instead of request it
    if(!fileentry.size)
    {
      // Insert new empty "file" inside IndexedDB
      db.files_add(new_fileentry, function(error, fileentry)
      {
        if(error)
          onerror(error)

        else
          self.transfer_end(fileentry);
      });

      return;
    }

    // Calc number of necesary chunks to download
    // and add a bitmap to our file stub
    var chunks = fileentry.size / module.chunksize;
    if(chunks % 1 != 0)
       chunks = Math.floor(chunks) + 1;

    new_fileentry.bitmap = new Bitmap(chunks);

    // Insert new "file" inside IndexedDB
    db.files_add(new_fileentry, function(error, fileentry)
    {
      if(error)
        onerror(error)

      else
      {
        var event = document.createEvent("Event");
            event.initEvent('transfer.begin',true,true);
            event.fileentry = fileentry

        self.dispatchEvent(event);

        // Demand data from the begining of the file
        transfer_query(fileentry);
      }
    });
  };

  this.transfer_update = function(fileentry, pending_chunks)
  {
    var chunks = fileentry.blob.size / module.chunksize;
    if(chunks % 1 != 0)
       chunks = Math.floor(chunks) + 1;

    // Notify about transfer update
    var event = document.createEvent("Event");
        event.initEvent('transfer.update',true,true);
        event.fileentry = fileentry
        event.value = 1 - pending_chunks / chunks

    this.dispatchEvent(event);
  };

  this.transfer_end = function(fileentry)
  {
    // Auto-save downloaded file
    savetodisk(fileentry.blob, fileentry.name);

    // Notify about transfer end
    var event = document.createEvent("Event");
        event.initEvent('transfer.end',true,true);
        event.fileentry = fileentry

    this.dispatchEvent(event);

    console.log('Transfer of ' + fileentry.name + ' finished!');
  };


  /**
   * Update the data content of a {Fileentry}
   * @param {Fileentry} fileentry {Fileentry} to be updated.
   * @param {Number} chunk Chunk position to be updated.
   * @param data Data to be set.
   */
  this.updateFile = function(fileentry, chunk, data)
  {
    fileentry.bitmap.set(chunk, true);

    // Create new FileWriter
    var fw = new FileWriter(fileentry.blob);

    // Calc and set pos, and increase blob size if necessary
    var pos = chunk * module.chunksize;
    if(fw.length < pos)
       fw.truncate(pos);
    fw.seek(pos);

    // Write data to the blob
    var blob = fw.write(data);

    // This is not standard, but it's the only way to get out the
    // created blob
    if(blob != undefined)
      fileentry.blob = blob;

    // Check for pending chunks and require them or save the file
    var pending_chunks = fileentry.bitmap.indexes(false).length;

    if(pending_chunks)
    {
      // Demand more data from one of the pending chunks after update
      // the fileentry status on the database
      db.files_put(fileentry, function(error, fileentry)
      {
        if(error)
          onerror(error)

        else
        {
          self.transfer_update(fileentry, pending_chunks);

          transfer_query(fileentry);
        }
      });
    }
    else
    {
      // There are no more chunks, set file as fully downloaded
      delete fileentry.bitmap;

      db.files_put(fileentry, function(error, fileentry)
      {
        if(error)
          onerror(error)

        else
          self.transfer_end(fileentry);
      });
    }
  };

  /**
   * Notify to all peers that I have added a new file (both by the user or
   * downloaded)
   * @param {Fileentry} Fileentry of the file that have been added.
   */
  this._send_file_added = function(fileentry)
  {
    var event = document.createEvent("Event");
        event.initEvent('file.added',true,true);
        event.fileentry = fileentry

    this.dispatchEvent(event);
  };

  /**
   * Notify to all peers that I have deleted a file (so it's not accesible)
   * @param {Fileentry} Fileentry of the file that have been deleted.
   */
  this._send_file_deleted = function(fileentry)
  {
    var event = document.createEvent("Event");
        event.initEvent('file.deleted',true,true);
        event.fileentry = fileentry

    this.dispatchEvent(event);
  };


  this.files_downloading = function(cb)
  {
    db.files_getAll(null, function(error, filelist)
    {
      if(error)
        console(error)

      else
      {
        var downloading = [];

        for(var i = 0, fileentry; fileentry = filelist[i]; i++)
          if(fileentry.bitmap)
            downloading.push(fileentry);

        // Update Downloading files list
        cb(null, downloading);
      }
    });
  };

  this.files_sharing = function(cb)
  {
    db.files_getAll_byPeer("", function(error, fileslist)
    {
      if(error)
        console(error)

      else
      {
        var sharing = []

        // [ToDo] Use parallice
        for(var i=0, fileentry; fileentry=fileslist[i]; i++)
          if(!fileentry.bitmap)
            db.files_getAll_byHash(fileentry.hash, function(error, fileentries)
            {
              var duplicates = []

              // Only add local (shared) duplicates
              for(var i=0, entry; entry=fileentries[i]; i++)
                if(fileentry.peer        == entry.peer
                &&(fileentry.sharedpoint != entry.sharedpoint
                || fileentry.path        != entry.path
                || fileentry.name        != entry.name))
                  duplicates.push(entry)

              if(duplicates.length)
                fileentry.duplicates = duplicates

              sharing.push(fileentry)
            })

        // Update Sharing files list
        cb(null, sharing)
      }
    })
  }

  this.add = function(fileentry)
  {
    hasher.hash(fileentry)
  }

  this.delete = function(fileentry)
  {
    db.files_delete(fileentry)
    this._send_file_deleted(fileentry)
  }
}

return module
})(shareit || {})