var shareit = (function(module){
var _priv = module._priv = module._priv || {}

_priv.Transport_Search_init = function(transport, db, peersManager)
{
  EventTarget.call(this);

  transport.search = function(text)
  {

  };

  transport.search_hash = function(hashes)
  {
    if(transport.isPubsub)
      route.push(peersManager.uid);

    console.debug('search.hash', hashes, route);
    transport.emit('search.hash', hashes, route);
  };


  transport.addEventListener('search', function(event)
  {

  });

  transport.addEventListener('search.hash', function(event)
  {
    var hashes = event.data[0];
    var route = event.data[1];

    // Check if we have answered this request
    for(var i = 0, uid; uid = route[i]; i++)
      if(uid == peersManager.uid)
        return;

      // Search hashes on own files
      db.files_getAll_byHash(hashes, function(error, fileslist)
      {

      });

    // Re-send the search over all the connected peers
    route.push(transport.uid);

    var channels = peersManager.getChannels();
    for(var uid in channels)
    {
      // Ignore peers already on the route path
      var routed = false;
      for(var i = 0, peer; peer = route[i]; i++)
        if(peer == uid)
        {
          routed = true;
          break;
        }

        // Send the search request to the other connected peers
        if(!routed)
          channels[uid].search_hash(hashes, route);
    }
  });
}

return module
})(shareit || {})