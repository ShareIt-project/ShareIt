var ui = (function(module){
var _priv = module._priv = module._priv || {}

_priv.DialogConfig = function(dialogId, options, shareit)
{
  var self = this;

  var dialog = $('#'+dialogId);

  if(!$.mobile)
    dialog.dialog(options);

  dialog.tabs(
  {
    active: 0
  });


  /**
   * Open the config dialog on the selected tab
   * @param {Number|undefined} tabIndex The index of the tab to be open. If
   * not defined, it open the first one.
   */
  this.open = function(tabIndex)
  {
    dialog.tabs("option", "active", tabIndex)

    if($.mobile)
      $.mobile.changePage(dialog);
    else
      dialog.dialog('open');
  };


  // Sharedpoints tab

  // Sharedpoints table
  var tableSharedpoints = new _priv.TableSharedpoints('Sharedpoints',
  function(fileentry)
  {
    return function()
    {
      tableSharedpoints.delete(fileentry.name, sharedpoints_update);
    }
  });

  function sharedpoints_update()
  {
    // Get shared points and init them with the new ones
    shareit.sharedpointsManager_getSharedpoints(function(error, sharedpoints)
    {
      if(error)
        console.error(error)
      else
        tableSharedpoints.update(sharedpoints);
    });
  }

  $(this).on('sharedpoints.update', sharedpoints_update);

  this.preferencesDialogOpen = function(tabIndex)
  {
    // Get shared points and init them
    sharedpoints_update();

    self.open(tabIndex);
  };

  $('#Preferences').click(this.preferencesDialogOpen);
  $('#Preferences2').click(this.preferencesDialogOpen);


  function sharedpoint_added(error)
  {
    if(error)
      console.warn(error);

    else
      $(self).trigger('sharedpoints.update');
  }

  // Add sharedpoint
  var input = dialog.find('#files');

  input.change(function(event)
  {
    var files = event.target.files;

    policy(function()
    {
      shareit.sharedpointsManager_add('FileList', files, sharedpoint_added);

      // Reset the input after send the files to hash
      input.val('');
    },
    function()
    {
      // Reset the input after NOT accepting the policy
      input.val('');
    });
  });


  var dropzone = document.getElementById('Sharedpoints-tab');

  dropzone.ondrop = function(event)
  {
    console.log("Drop")

    var items = e.dataTransfer.items

    for(var i=0; i<items.length; i++)
    {
      var entry = items[i].webkitGetAsEntry();

      if(entry.isDirectory)
        policy(function()
        {
          shareit.sharedpointsManager_add('Entry', entry, sharedpoint_added);
        });

      else
        console.warn("Entry type (mainly file) for "+entry.name+
                     " unsupported as sharedpoint")
    }
  };

  // Backup tab

  // Export
  dialog.find('#Export').click(function()
  {
    policy(function()
    {
      shareit.cacheBackup_export(function(blob)
      {
        if(blob)
        {
          var date = new Date();
          var name = 'ShareIt-CacheBackup_' + date.toISOString() + '.zip';

          savetodisk(blob, name);
        }
        else
          alert('Cache has no files');
      },
      undefined,
      function()
      {
        console.error('There was an error exporting the cache');
      });
    });
  });

  // Import
  var input = dialog.find('#import-backup');

  input.change(function(event)
  {
    var file = event.target.files[0];

    policy(function()
    {
      shareit.cacheBackup_import(file);

      // Reset the input after got the backup file
      input.val('');
    },
    function()
    {
      // Reset the input after NOT accepting the policy
      input.val('');
    });
  });

  dialog.find('#Import').click(function()
  {
    input.click();
  });
}

return module
})(ui || {})