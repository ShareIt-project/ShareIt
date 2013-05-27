var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
_priv.HandshakeManager.registerConstructor('SimpleSignaling',
function(configuration)
{
  EventTarget.call(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the SimpleSignaling server
  var connection = new SimpleSignaling(configuration);


  /**
   * Receive messages
   */
  connection.onmessage = function(message)
  {
    var event = JSON.parse(message.data);

    // Don't try to connect to ourselves
    if(event.from == configuration.uid)
      return

    this.dispatchEvent(event);
  };


  /**
   * Handle the connection to the handshake server
   */
  connection.onopen = function()
  {
    // Notify our presence
    send({type: 'presence', from: configuration.uid});

    // Notify that the connection to this handshake server is open
    var event = document.createEvent("Event");
        event.initEvent('open',true,true);

    self.dispatchEvent(event);
  };


  /**
   * Handle errors on the connection
   */
  connection.onerror = function(error)
  {
    if(self.onerror)
       self.onerror(error);
  };


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    connection.send(JSON.stringify(data));
  }


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.close()
  }
})

return module
})(webp2p || {})