var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
_priv.HandshakeManager.registerConstructor('XMPP',
function(configuration)
{
  EventTarget.call(this);

  var self = this

//  configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object


  /**
   * Receive messages
   */
  connection.registerHandler('message', function(message)
  {
    var from = message.getFromJID().getResource()

    // Don't try to connect to ourselves
    if(from == configuration.uid)
      return

    var body = message.getBody()
    if(body == "")
      return

    var event = JSON.parse(body)

    event.from = from

    self.dispatchEvent(event);
  })


  /**
   * Handle the connection to the handshake server
   */
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var presence = new JSJaCPresence();
        presence.setTo(configuration.room+"/"+configuration.uid);

    connection.send(presence);


    // Ugly hack so we can ignore presence messages from previous peers
    setTimeout(function()
    {
      /**
       * Handle the presence of other new peers
       */
      connection.registerHandler('presence', function(presence)
      {
        var from = presence.getFromJID().getResource()

        // Only notify new connections
        if(from != configuration.uid
        && !presence.getType()
        && !presence.getShow())
        {
          var event = document.createEvent("Event");
              event.initEvent('presence',true,true);

              event.from = from

          self.dispatchEvent(event);
        }
      });
    }, 1000)


    // Notify that the connection to this handshake server is open
    var event = document.createEvent("Event");
        event.initEvent('open',true,true);

    self.dispatchEvent(event);
  });


  /**
   * Handle errors on the connection
   */
  connection.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    var oMsg = new JSJaCMessage();
        oMsg.setTo(configuration.room+"/"+uid);
        oMsg.setBody(JSON.stringify(data));

    connection.send(oMsg);
  }


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect()
  }
})

return module
})(webp2p || {})