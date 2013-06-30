// Based on code from https://github.com/jaredhanson/jsonrpc-postmessage

importScripts('../webp2p/webp2p.js')

importScripts(
    'bitmap.js',
    'cacheBackup.js',
    'db.js',
    'filesManager.js',
    'utils.js',
    'ShareitLocal.js',

    'hasher/index.js',

    'lib/BoolArray.js',
    'lib/dropbox.min.js',

    'lib/zip.js/deflate.js',
    'lib/zip.js/inflate.js',
    'lib/zip.js/zip.js',
    'lib/zip.js/zip-fs.js',
    'lib/zip.js/mime-types.js',

    'polyfills/FileWriter.js',
    'polyfills/IndexedDB-javascript.js',

    'sharedpoints/index.js',
    'sharedpoints/dropbox.js',
    'sharedpoints/mega.js',

    'transport/host.js',
    'transport/peer.js',
    'transport/search.js');


var methods = {}

function expose(name, service)
{
  if(!service && typeof name == 'object')
  {
    service = name;
    name = null;
  }

  if(typeof service == 'function')
    methods[name] = service;

  else if(typeof service == 'object')
  {
    var module = name ? name + '.' : '';
    for(var method in service)
      if(typeof service[method] === 'function')
        methods[module + method] = service[method];
  }
}

var core = new shareit.Local(null, function(error, core)
{
  if(error)
    alert(error)

  else
    expose(core)
})


self.onmessage = function(event)
{
  function result(err, res)
  {
    // requests without an id are notifications, to which responses are
    // supressed
    if(event.id !== null)
    {
      var response = {id: event.id}

      if(err)
        response.error = err.message

      else
        response.result = res || null

      self.send(response)
    }
  }

  var method = methods[event.method];
  if(typeof method == 'function')
  {
    var params = event.args || [];
    // push result function as the last argument
    params.push(result);

    // invoke the method
    try
    {
      method.apply(shareit, params);
    }
    catch(err)
    {
      result(err);
    }
  }
  else
    result(new Error('Method Not Found'));
};