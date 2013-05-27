var ui = (function(module){
var _priv = module._priv = module._priv || {}

_priv.PromptUID = function(dialogId, onsuccess)
{
  var dialog = $('#' + dialogId);
  var input = dialog.find('input')

  function accept()
  {
    var uid = input.val()
    if(uid && onsuccess)
      onsuccess(uid)

    input.val("")
    dialog.dialog('close')
  }

  function cancel()
  {
    dialog.dialog('close')
  }

  input.keypress(function(event)
  {
    if(event.keyCode == 13)
      accept()
  });

  if($.mobile)
  {
    dialog.find('#Accept').click(accept);
    dialog.find('#Cancel').click(cancel);
  }
  else
    dialog.dialog(
    {
      autoOpen: false,
      resizable: false,
      modal: true,

      buttons:
      {
        Accept: accept,
        Cancel: cancel
      }
    });

  this.open = function()
  {
    if($.mobile)
      $.mobile.changePage('#' + dialogId);
    else
      dialog.dialog('open');
  };
}

return module
})(ui || {})