function DialogAbout(dialogId, options) {
  var dialog = $('#' + dialogId);

  if (!$.mobile) dialog.dialog(options);

  this.open = function() {
    if ($.mobile) $.mobile.changePage('#' + dialogId);
    else dialog.dialog('open');
  };
}
