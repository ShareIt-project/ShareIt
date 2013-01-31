function UI(cacheBackup, sharedpointsManager, peersManager) {
  EventTarget.call(this);

  var self = this;


  var dialog_options = {
    autoOpen: false,
    resizable: false,
    width: 800,
    height: 600,
    modal: true,

    /* This effects would fail on Firefox */
    show: 'fold',
    hide: 'fold',

    buttons: {
      Accept: function() {
        $(this).dialog('close');
      }
    }
  };


  // Config dialog
  var dialogConfig = new DialogConfig('dialog-config', dialog_options, cacheBackup, sharedpointsManager);

  peersManager.addEventListener('sharedpoints.update', function() {
    dialogConfig.dispatchEvent({
      type: 'sharedpoints.update'
    });
  });


  // About dialog
  var dialogAbout = new DialogAbout('dialog-about', dialog_options);

  $('#About').click(function() {
    dialogAbout.open();
  });


  peersManager.addEventListener('error.noPeers', function() {
    console.error('Not connected to any peer');

    // Allow backup of cache if there are items
    dialogConfig.preferencesDialogOpen(1);
  });


  // Tabs
  var tabsMain = new TabsMain('tabs', peersManager, dialogConfig.preferencesDialogOpen);

  // Set UID on user interface
  peersManager.addEventListener('uid', function(event) {
    var uid = event.data[0];

    $('#UID-home, #UID-about').val(uid);


    /**
     * User initiated process to connect to a remote peer asking for the UID
     */

    function ConnectUser() {
      var uid = prompt('UID to connect');
      if (uid != null && uid != '') {
        // Create connection with the other peer
        peersManager.connectTo(uid, function(channel) {
          tabsMain.openOrCreatePeer(uid, dialogConfig.preferencesDialogOpen, peersManager, channel);
        }, function(uid, peer, channel) {
          console.error(uid, peer, channel);
        });
      }
    }

    $('#ConnectUser').unbind('click');
    $('#ConnectUser').click(ConnectUser);

    $('#ConnectUser2').unbind('click');
    $('#ConnectUser2').click(ConnectUser);
  });


  /**
   * User initiated process to connect to a remote peer asking for the UID
   */

  function ConnectUser() {
    alert("There's no routing available, wait some more seconds");
  }

  $('#ConnectUser').click(ConnectUser);
  $('#ConnectUser2').click(ConnectUser);


  /**
   * Prevent to close the webapp by accident
   */
  window.onbeforeunload = function() {
    // Allow to exit the application normally if we are not connected
    var peers = Object.keys(peersManager.getChannels()).length;
    if (!peers) return;

    // Downloading
    if (self.isDownloading) return 'You are currently downloading files.';

    // Sharing
    if (self.isSharing) return 'You are currently sharing files.';

    // Routing (connected to at least two peers or handshake servers)
    if (peers >= 2) return 'You are currently routing between ' + peers + ' peers.';
  };
}
