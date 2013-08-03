/**
 * Show a dialog with the usage policy of the webapp and checks if it's accepted
 * @param {Function} onaccept Callback if policy was previously accepted.
 */
function policy(onaccept, oncancel)
{
  function check()
  {
    // Exec 'onaccept' callback automatically if policy was accepted
    // previously and it's currently valid
    if(localStorage.policy_acepted != undefined
    && localStorage.policy_acepted >= policy.lastModified
    && onaccept)
    {
      onaccept();
      return;
    }

    function cancel()
    {
      policy.dialog.dialog('close');

      // Policy not acepted, remove it
      localStorage.removeItem('policy_acepted');

      console.warn('Policy was NOT accepted');

      if(oncancel)
         oncancel();
    }

    function accept()
    {
      policy.dialog.dialog('close');

      // Policy acepted, set date and exec 'onaccept'
      localStorage.policy_acepted = (new Date()).getTime();

      console.warn('Policy was accepted');

      if(onaccept)
         onaccept();
    }

    // Policy was not accepted previously or was outdated
    // or we are showing it ('onaccept' callback was not defined)
    if($.mobile)
    {
      policy.dialog.find('#Accept').unbind('click');
      policy.dialog.find('#Accept').click(accept);

      policy.dialog.find('#Cancel').unbind('click');
      policy.dialog.find('#Cancel').click(cancel);

      $.mobile.changePage(policy.dialog);
    }
    else
      policy.dialog.dialog(
      {
        modal: true,
        resizable: false,
        width: 800,

        buttons:
        {
          Cancel: cancel,
          Accept: accept
        }
      });
  }

  // Policy text was loaded previously, check if it's accepted
  if(policy.dialog)
    check();

  // Checking the policy the first time on this session, load the policy text
  else
  {
    function fillPolicy(http_request)
    {
      // Get policy modification date
//      var lastModified = http_request.getResponseHeader('Last-Modified') || 0; // January 1, 1970
      var lastModified = 0; // January 1, 1970
      policy.lastModified = (new Date(lastModified)).getTime();

      // Set the policy text on the dialog
      policy.dialog = $('#dialog-policy');
//      policy.dialog.find('#msg').html(http_request.response);

      // Check if policy was accepted
      check();
    }

    fillPolicy();
/*    var http_request = new XMLHttpRequest();
    http_request.open('GET', 'policy.html');
    http_request.onload = function()
    {
      // Policy text loaded successfully, fill the dialog and check it
      switch(this.status)
      {
        case 200:  // Ok
          fillPolicy(http_request);
          break;

        default:  // Error
          console.error('There was an error loading the Usage Policy');
      }
    };
    http_request.onerror = function()
    {
      console.error('There was an error loading the Usage Policy');
    };
    http_request.send();
*/  }
}
