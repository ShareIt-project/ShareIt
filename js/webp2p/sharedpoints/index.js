function SharedpointsManager(db, peersManager) {
  // Init hasher
  var hasher = new Hasher(db, policy);
  hasher.onhashed = function(fileentry) {
    // Notify the other peers about the new hashed file
    peersManager._send_file_added(fileentry);
  };
  hasher.ondeleted = function(fileentry) {
    // Notify the other peers about the deleted file
    peersManager._send_file_deleted(fileentry);
  };

  this.getSharedpoints = function(onsuccess) {
    db.sharepoints_getAll(null, onsuccess);
  };

  //    var sharedpoints = []
  //
  //    this.getSharedpoints(function(sharedpoints)
  //    {
  //        for(var i=0, sharedpoint; sharedpoint= sharedpoints[i]; i++)
  //        {
  //            switch(sharedpoint.type)
  //            {
  //                case 'dropbox':
  //                    break
  //
  //                case 'folder':
  //                    break
  //            }
  //        }
  //    })
  this.addSharedpoint_Folder = function(files, onsuccess, onerror) {
    var sharedpoint_name = files[0].webkitRelativePath.split('/')[0];

    this.getSharedpoints(function(sharedpoints) {
      for (var i = 0, sharedpoint; sharedpoint = sharedpoints[i]; i++)
        if (sharedpoint.name == name) {
          if (onerror) onerror();

          return;
        }

        var sharedpoint = {
          name: sharedpoint_name,
          type: 'folder',
          size: 0
        };

      db.sharepoints_put(sharedpoint);

      hasher.hash(files, sharedpoint_name);

      if (onsuccess) onsuccess();
    });
  };

  this.delete = function(name, onsuccess) {
    db.sharepoints_delete(name, onsuccess);
  };
}
