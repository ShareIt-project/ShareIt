var shareit = (function(module){
var _priv = module._priv = module._priv || {}

_priv.CacheBackup = function(db, filesManager)
{
  zip.workerScriptsPath = 'js/shareit-core/lib/zip.js/';

  this.export = function(onfinish, onprogress, onerror)
  {
    db.files_getAll(null, function(error, fileslist)
    {
      if(error)
      {
        console.error(error)
        return
      }

      // Create a new filesystem inside the Zip file
      var fs = new zip.fs.FS();

      // Create folder to store the blobs
      var blobs = fs.root.addDirectory('blobs');

      // Run over all the cache-stored files and add them to the
      // corresponding folder and generate the JSON metadata file
      var files = [];

      for(var i=0, fileentry; fileentry=fileslist[i]; i++)
        if(fileentry.blob)
        {
          // Store blob on Zip file
          blobs.addBlob(fileentry.hash, fileentry.blob);

          // Generate file path
          var path = '';
          if(fileentry.sharedpoint)
          {
            path += fileentry.sharedpoint;
            if(fileentry.path != '')
              path += '/' + fileentry.path;
          }

          // Generate file metadata
          var file =
          {
            hash: fileentry.hash,
            path: path,
            name: fileentry.name
          };

          if(fileentry.bitmap)
            file.bitmap = bitmap;

          // Add file to files metadata list
          files.push(file);
        }

        // Export the cache if it has items
        if(files.length)
        {
          // Store the JSON metadata file inside the Zip file
          fs.root.addText('files.json', JSON.stringify(files));

          // Generate and export the cache backup in the Zip file
          fs.exportBlob(onfinish, onprogress, onerror);
        }

        // Cache has no files
        else if(onfinish)
          onfinish();
    });
  };

  this.import = function(blob, cb)
  {
    var fs = new zip.fs.FS();
    fs.importBlob(blob, function()
    {
      // Check blobs metadata
      var files = fs.root.getChildByName('files.json');

      files.getText(function(text)
      {
        // Get blobs folder from the zip file
        var blobs = fs.root.getChildByName('blobs');

        // Extract blobs data and add it to cache
        var files = JSON.parse(text);
        for(var i = 0, file; file = files[i]; i++)
          db.files_getAll_byHash(file.hash, function(error, fileentries)
          {
            if(error)
            {
              console.error(error)
              return
            }

            var blob = blobs.getChildByName(file.hash);

            function fileentry_update(file, fileentry)
            {
              // Fileentry is completed, do nothing
              if(fileentry.bitmap == undefined)
                return;

              // Fileentry is not completed, update it
              var chunks = fileentry.bitmap.indexes();

              for(var i = 0, chunk; chunk = chunks[i]; i++)
                if(blob.bitmap == undefined || blob.bitmap.get(chunk))
                {
                  var reader = new FileReader();
                  reader.onerror = function(evt)
                  {
                    console.error('CacheBackup.import('+file.hash+', '+chunk+
                                  ") = '" + evt.target.result + "'");
                  };
                  reader.onload = function(event)
                  {
                    var data = event.target.result;

                    filesManager.updateFile(fileentry, chunk, data);
                  };

                  var start = chunk * module.chunksize;
                  var stop = start + module.chunksize;

                  blob.getBlob(zip.getMimeType(file.name), function(blob)
                  {
                    var filesize = parseInt(blob.size);
                    if(stop > filesize)
                       stop = filesize;

                    reader.readAsBinaryString(blob.slice(start, stop));
                  });
                }
            }

            function fileentry_add(file)
            {
              blob.getBlob(zip.getMimeType(file.name), function(blob)
              {
                var fileentry =
                {
                  hash: file.hash,
                  path: file.path,
                  name: file.name,
                  blob: blob
                };
                if(file.bitmap)
                  fileentry.bitmap = file.bitmap;

                db.files_add(fileentry, function(error, fileentry)
                {
                  if(error)
                    console.error(error)

                  // File was not completed, notify update
                  else if(file.bitmap)
                  {
                    var pending_chunks = fileentry.bitmap.indexes(false).length;

                    filesManager.transfer_update(fileentry, pending_chunks);
                  }

                  // File was completed, notify finished
                  else
                    filesManager.transfer_end(fileentry);
                });
              });
            }

            // Fileentry exists on cache
            if(fileentries.length)
            {
              for(var i=0, fileentry; fileentry=fileentries[i]; i++)
                if(fileentry.blob)
                  fileentry_update(file, fileentry);
            }

            // Fileentry don't exists on cache, add it
            else
              fileentry_add(file);
          });
      });
    }, cb);
  };
}

return module
})(shareit || {})