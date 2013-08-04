window.addEventListener('DOMContentLoaded', function()
//window.addEventListener("load", function()
{
  var cm = new CompatibilityManager();

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