var shareit = (function(module){
var _priv = module._priv = module._priv || {}

_priv.SearchEngine = function(db, filesManager)
{
  var self = this

  // Init the search index
  var searchIndex = lunr(function()
  {
    this.field('sharedpoint')
    this.field('path', {boost: 10})
    this.field('name', {boost: 100})
  })

  // Add all files on IndexedDB to the index
  db.files_getAll(null, function(error, fileentries)
  {
    if(error)
      console.error("Error loading files from IndexedDB, search index couldn't be initialized")

    else
      for(var i=0, fileentry; fileentry=fileentries[i]; i++)
        self.add(fileentry)
  })

  this.add = function(fileentry)
  {
    var id = JSON.stringify([fileentry.peer, fileentry.sharedpoint,
                             fileentry.path, fileentry.name])

    searchIndex.add({id:          id,
                     sharedpoint: fileentry.sharedpoint,
                     path:        fileentry.path,
                     name:        fileentry.name})
  }

  this.remove = function(fileentry)
  {
    var id = JSON.stringify([fileentry.peer, fileentry.sharedpoint,
                             fileentry.path, fileentry.name])

    searchIndex.remove({id: id})
  }

  function update(fileentry)
  {
    var id = JSON.stringify([fileentry.peer, fileentry.sharedpoint,
                             fileentry.path, fileentry.name])

    searchIndex.update({id:          id,
                        sharedpoint: fileentry.sharedpoint,
                        path:        fileentry.path,
                        name:        fileentry.name})
  }

  this.search = function(query, callback)
  {
    var results = searchIndex.search(query)

    var entries = {}
    var index = 0

    function data()
    {
      var result = results[index]

      // There are (more) results, look for the real object and add the duplicates
      if(result)
        db.files_get(JSON.parse(result.ref), function(error, fileentry)
        {
          // There was an error getting the fileentry for this result, ignore it
          if(error)
            results.splice(index, 1)

          else
          {
            var entry = entries[fileentry.hash]

            // Hashed file was not checked previously, add it
            if(entry == undefined)
            {
              fileentry.score = result.score
              entries[fileentry.hash] = fileentry

              // Duplicates
              db.files_getAll_byHash(fileentry.hash, function(error, fileentries)
              {
                if(fileentries.length > 1)
                {
                  // Count copies
                  var copies = {}

                  for(var i=0, entry; entry=fileentries[i]; i++)
                  {
                    copies[entry.name] = copies[entry.name] || 0
                    copies[entry.name] += 1

                    // Check if some of the duplicates is being shared
                    if(entry.file)
                      fileentry.file = entry.file

                    else if(entry.blob)
                    {
                      fileentry.blob = entry.blob

                      if(entry.bitmap)
                        fileentry.bitmap = entry.bitmap
                    }
                  }

                  // Convert copies in a duplicates array
                  var duplicates = []

                  for(var name in copies)
                    duplicates.push({name: name, copies: copies[name]})

                  // Sort the duplicates by number of copies
                  duplicates.sort(function(a,b)
                  {
                    return b.copies - a.copies
                  })

                  // Set the fileentry as the most popular duplicate and remove it
                  var duplicate = duplicates.shift()
                  fileentry.name = duplicate.name
                  fileentry.copies = duplicate.copies

                  // Set the duplicates
                  fileentry.duplicates = duplicates
                }

                results[index] = fileentry
                index++

                data()
              })
              return
            }

            // Hashed file was checked previously, increase the score of the
            // first one and remove this duplicate
            else
            {
              entry.score += result.score

              results.splice(index, 1)
            }
          }

          data()
        })

      // There are no (more) results, sort the results array and return it
      else
      {
//        // Sort the results on score descending relevance
//        results.sort(function(a,b)
//        {
//          return b.score - a.score
//        })

        callback(null, results)
      }
    }

    data()
  }

  filesManager.addEventListener('file.added', function(event)
  {
    var fileentry = event.fileentry

    self.add(fileentry)
  })

  filesManager.addEventListener('file.deleted', function(event)
  {
    var fileentry = event.fileentry

    self.remove(fileentry)
  })

  filesManager.addEventListener('fileslist.updated', function(event)
  {
    var fileentries = event.fileslist

    // [ToDo] Use individiual events for add and remove
    for(var i=0, fileentry; fileentry=fileentries[i]; i++)
      update(fileentry)
  })
}

return module
})(shareit || {})