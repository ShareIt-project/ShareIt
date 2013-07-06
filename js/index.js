window.addEventListener('DOMContentLoaded', function()
//window.addEventListener("load", function()
{
  var cm = new CompatibilityManager();

  // DataChannel polyfill
  switch(DCPF_install('wss://datachannel-polyfill.nodejitsu.com'))
  {
    case 'old browser':
      cm.addError('DataChannel', "Your browser doesn't support PeerConnection" +
                                 " so ShareIt! can't work.");
      break;

    case 'polyfill':
      cm.addWarning('DataChannel', "Your browser doesn't support DataChannels" +
                                   ' natively, so file transfers performance ' +
                                   'would be affected or not work at all.');
  }

  // Filereader support (be able to host files from the filesystem)
  if(typeof FileReader == 'undefined')
    cm.addWarning('FileReader', "Your browser doesn't support FileReader so" +
                                " it can't work as a host.");

  // Check for IndexedDB support and if it store File objects
  testIDBBlobSupport(function(supported)
  {
    if(!supported)
    {
      cm.addWarning('IndexedDB', "Your browser doesn't support storing File " +
                                 'or Blob objects. Data will not persists ' +
                                 'between each time you run the webapp.');

      IdbJS_install();
    }

    // Show alert if browser requeriments are not meet
    cm.show();

    // Start loading the webapp
    var core = new shareit.Local(config.handshake_servers,
//    var core = new shareit.Remote(new Worker('js/shareit-core/shareit_backend.js',
//                                             'json/handshake.json'),
    function(error, core)
    {
      if(error)
        alert(error)

      else
        ui.UI(core)
    })
  });
});