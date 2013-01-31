function DialogConfig(dialogId, options, cacheBackup, sharedpointsManager) {
  EventTarget.call(this);

  var self = this;

  var dialog = $('#' + dialogId);

  if (!$.mobile) dialog.dialog(options);

  dialog.tabs({
    active: 0
  });


  /**
   * Open the config dialog on the selected tab
   * @param {Number|undefined} tabIndex The index of the tab to be open. If
   * not defined, it open the first one.
   */
  this.open = function(tabIndex) {
    dialog.tabs('option', 'active', tabIndex);

    if ($.mobile) $.mobile.changePage(dialog);
    else dialog.dialog('open');
  };


  // Sharedpoints tab
  // Sharedpoints table
  var tableSharedpoints = new TableSharedpoints('Sharedpoints', function(fileentry) {
    return function() {
      tableSharedpoints.delete(fileentry.name, sharedpoints_update);
    }
  });

  function sharedpoints_update() {
    // Get shared points and init them with the new ones
    sharedpointsManager.getSharedpoints(function(sharedpoints) {
      tableSharedpoints.update(sharedpoints);
    });
  }

  this.addEventListener('sharedpoints.update', sharedpoints_update);

  this.preferencesDialogOpen = function(tabIndex) {
    // Get shared points and init them
    sharedpoints_update();

    self.open(tabIndex);
  };

  $('#Preferences').click(this.preferencesDialogOpen);
  $('#Preferences2').click(this.preferencesDialogOpen);


  // Add sharedpoint
  var input = dialog.find('#files');

  input.change(function(event) {
    var files = event.target.files;

    policy(function() {
      sharedpointsManager.addSharedpoint_Folder(files, function() {
        self.dispatchEvent({
          type: 'sharedpoints.update'
        });
      }, function() {
        console.warn('Sharedpoint already defined');
      });

      // Reset the input after send the files to hash
      input.val('');
    }, function() {
      // Reset the input after NOT accepting the policy
      input.val('');
    });
  });


  // Backup tab
  // Export
  dialog.find('#Export').click(function() {
    policy(function() {
      cacheBackup.export(function(blob) {
        if (blob) {
          var date = new Date();
          var name = 'WebP2P-CacheBackup_' + date.toISOString() + '.zip';

          savetodisk(blob, name);
        } else alert('Cache has no files');
      }, undefined, function() {
        console.error('There was an error exporting the cache');
      });
    });
  });

  // Import
  var input = dialog.find('#import-backup');

  input.change(function(event) {
    var file = event.target.files[0];

    policy(function() {
      cacheBackup.import(file);

      // Reset the input after got the backup file
      input.val('');
    }, function() {
      // Reset the input after NOT accepting the policy
      input.val('');
    });
  });

  dialog.find('#Import').click(function() {
    input.click();
  });
}
