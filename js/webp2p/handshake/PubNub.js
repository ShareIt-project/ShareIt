var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
_priv.HandshakeManager.registerConstructor('PubNub',
function(configuration)
{
  EventTarget.call(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB(configuration);


  pubnub.subscribe(
  {
    channel: configuration.channel,


    /**
     * Receive messages
     */
    callback: function(message)
    {
      var event = JSON.parse(message)

      // Don't try to connect to ourselves
      if(event.from == configuration.uid)
        return

      self.dispatchEvent(event);
    },

    /**
     * Handle the connection to the handshake server
     */
    connect: function()
    {
      // Notify our presence
      self.send({type: 'presence', from: configuration.uid});

      // Notify that the connection to this handshake server is open
      var event = document.createEvent("Event");
          event.initEvent('open',true,true);

      self.dispatchEvent(event);
    },


    /**
     * Handle errors on the connection
     */
    error: function(error)
    {
      if(self.onerror)
         self.onerror(error)
    }
  });


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    pubnub.publish(
    {
      channel: configuration.channel,
      message: JSON.stringify(data)
    });
  };


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: configuration.channel
    });
  }
})

return module
})(webp2p || {})