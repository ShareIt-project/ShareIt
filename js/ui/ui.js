var ui = (function(module){
var _priv = module._priv = module._priv || {}

module.UI = function(shareit)
{
  var isDownloading = false
  var isSharing = false

  var dialog_options =
  {
    autoOpen: false,
    resizable: false,
    width: 800,
    height: 600,
    modal: true,

    /* This effects would fail on Firefox */
    show: 'fold',
    hide: 'fold',

    buttons:
    {
      Accept: function()
      {
        $(this).dialog('close');
      }
    }
  };


  // Config dialog
  var dialogConfig = new _priv.DialogConfig("dialog-config", dialog_options, shareit);

  shareit.addEventListener('sharedpoints.update', function()
  {
    $(dialogConfig).trigger('sharedpoints.update');
  });


  // About dialog
  var dialogAbout = new _priv.DialogAbout('dialog-about', dialog_options);

  $('#About').click(function()
  {
    dialogAbout.open();
  });


  shareit.addEventListener('disconnected', function(event)
  {
    console.warning('Disconnected from WebP2P network');

    // Allow backup of cache if there are items
    dialogConfig.preferencesDialogOpen(1);
  });


  shareit.addEventListener('error', function(event)
  {
    console.error(event.error);

    // Allow backup of cache if there are items
    dialogConfig.preferencesDialogOpen(1);
  });


  // Tabs
  var tabsMain = new _priv.TabsMain('tabs', shareit,
                                    dialogConfig.preferencesDialogOpen);

  // Set UID on user interface
  shareit.addEventListener('connected', function(event)
  {
    var uid = event.uid;

    $('#UID-home, #UID-about').val(uid);


    // Prompt UID
    var promptUID = new _priv.PromptUID('dialog-prompt', function(uid)
    {
      // Create connection with the other peer
      shareit.connectTo(uid, null, null, function(error)
      {
        if(error)
        {
          alert(error);
          console.error(uid, error);
        }

        else
          tabsMain.openOrCreate('peer', uid);
      });
    })


    /**
     * User initiated process to connect to a remote peer asking for the UID
     */
    function ConnectUser()
    {
//      // Close the menu pop-up on the mobile platform
//      if($.mobile)
//        $('tools-menu-submenu').popup('close');

      // Ask for the peer UID and connect to it
      promptUID.open();
    }

    $('#ConnectUser').unbind('click');
    $('#ConnectUser').click(ConnectUser);

    $('#ConnectUser2').unbind('click');
    $('#ConnectUser2').click(ConnectUser);
  });


  /**
   * User initiated process to connect to a remote peer asking for the UID
   */
  function ConnectUser()
  {
    alert("There's no routing available, wait some more seconds");
  }

  $('#ConnectUser').click(ConnectUser);
  $('#ConnectUser2').click(ConnectUser);


  $('#search input').keypress(function(event)
  {
    if(event.keyCode == 13)
    {
      var query = $(this).val()
      if(query)
      {
        function isUUID(str)
        {
          var rgx = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          return rgx.test(str)
        }

        if(isUUID(query))
          tabsMain.openOrCreate('hash', query);
        else
          tabsMain.openOrCreate('search', query);

        $(this).val("")
      }
    }
  });


  /**
   * Prevent to close the webapp by accident
   */
  window.onbeforeunload = function()
  {
    // Allow to exit the application normally if we are not connected
    shareit.numPeers(function(error, peers)
    {
      if(error)
      {
        console.error(error)
        return
      }

      if(!peers)
        return;

      // Downloading
      if(isDownloading)
        return 'You are currently downloading files.';

      // Sharing
      if(isSharing)
        return 'You are currently sharing files.';

      // Routing (connected to at least two peers or handshake servers)
      if(peers >= 2)
        return 'You are currently routing between ' + peers + ' peers.';
    })
  };
}

return module
})(ui || {})