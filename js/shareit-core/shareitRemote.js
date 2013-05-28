// Based on code from https://github.com/jaredhanson/jsonrpc-postmessage

var shareit = (function(module){
var _priv = module._priv = module._priv || {}

module.Remote = function(channel, onsuccess)
{
  EventTarget.call(this);

  var self = this


  function forwardEvent(event)
  {
    self.dispatchEvent(event);
  }


  var timeout = 5000
  var handlers = {}
  var requestID = 1


  channel.onmessage = function(event)
  {
    var id = event.id
    if(id === null || id === undefined)
    {
      forwardEvent(event)
      return
    }

    var handler = handlers[id];
    if(handler)
      handler.call(self, event.error, event.result);

    delete handlers[id];
  }


  function call(method)
  {
    var args = Array.prototype.slice.call(arguments, 1)
    var cb = (args.length && typeof args[args.length - 1] == 'function') ? args.pop() : null;

    var request =
    {
      id: requestID++,
      method: method,
      args: args
    }

    handlers[request.id] = cb

    setTimeout(function()
    {
      var handler = handlers[request.id];
      if(handler)
        handler.call(self, new Error('Timed Out'));

      delete handlers[request.id];
    }, timeout);

    channel.send(request);
  }


  this.cacheBackup_export = function(onfinish, onprogress, onerror)
  {
  }

  this.cacheBackup_import = function(blob, callback)
  {
    call('cacheBackup_import', blob, callback)
  }

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {MessageChannel} incomingChannel Optional channel where to
     * @param {Function} cb Callback.
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, incomingChannel, callback)
  {
    call('connectTo', uid, incomingChannel, callback)
  }

  this.files_downloading = function(callback)
  {
    call('files_downloading', incomingChannel, callback)
  }

  this.files_getAll_byHash = function(hash, callback)
  {
    call('files_getAll_byHash', hash, callback)
  }

  this.files_sharing = function(callback)
  {
    call('files_sharing', callback)
  }

  this.fileslist_disableUpdates = function(uid, callback)
  {
    call('fileslist_disableUpdates', uid, callback)
  }

  this.fileslist_query = function(uid, callback)
  {
    call('fileslist_query', uid, callback)
  }

  this.numPeers = function(callback)
  {
    call('numPeers', callback)
  }

  this.searchEngine_search = function(query, callback)
  {
    call('searchEngine_search', query, callback)
  }

  this.sharedpointsManager_add = function(type, root, callback)
  {
    call('sharedpointsManager_add', type, root, callback)
  }

  this.sharedpointsManager_getSharedpoints = function(callback)
  {
    call('sharedpointsManager_getSharedpoints', callback)
  }

  /**
   * Start the download of a file
   * @param {Fileentry} Fileentry of the file to be downloaded.
   */
  this.transfer_begin = function(fileentry)
  {
    call('transfer_begin', fileentry)
  }

  if(onsuccess)
    onsuccess(this)
}

return module
})(shareit || {})