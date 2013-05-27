var webp2p = (function(module){
var _priv = module._priv = module._priv || {}


function Transport_Presence_init(transport, peersManager, max_connections)
{
  _priv.Transport_Routing_init(transport, peersManager);

  // Count the maximum number of pending connections allowed to be
  // done with this handshake server (undefined == unlimited)
  transport.connections = 0
  transport.max_connections = max_connections

  /**
   * Handle the presence of other new peers
   */
  transport.addEventListener('presence', function(event)
  {
    var from = event.from;

    // Check if we should ignore this new peer to increase entropy in
    // the network mesh

    // Do the connection with the new peer
    peersManager.connectTo(from, transport, function(error, uid)
    {
      if(error)
        console.error(from, peer, transport);

      else
        // Increase the number of connections reached throught
        // this handshake server
        transport.connections++;

      // Close connection with handshake server if we got its
      // quota of peers
      if(transport.connections == transport.max_connections)
        transport.close();
    });
  })

  transport.onerror = function(error)
  {
    console.error(error);

    // Close the channel (and try with the next one)
    transport.close();
  };
}


/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
_priv.HandshakeManager = function(json_uri, peersManager)
{
  EventTarget.call(this);

  var self = this;

  var channels = {};
  var status = 'disconnected';


  function nextHandshake(configuration)
  {
    // Remove the configuration from the poll
    configuration.splice(index, 1);

    // If there are more pending configurations, go to the next one
    if(configuration.length)
      getRandomHandshake(configuration);

    // There are no more pending configurations and all channels have been
    // closed, set as disconnected and notify to the PeersManager
    else if(!Object.keys(channels).length)
    {
      status = 'disconnected';

      peersManager.handshakeDisconnected();
    }
  }


  /**
   * Get a random handshake channel or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function getRandomHandshake(configuration)
  {
    var index = Math.floor(Math.random() * configuration.length);
    var index = 0;  // Forced until servers interoperation works

    var type = configuration[index][0];
    var conf = configuration[index][1];

    conf.uid = peersManager.uid;

    var channelConstructor = _priv.HandshakeManager.handshakeServers[type];

    // Check if channel constructor is from a valid handshake server
    if(!channelConstructor)
    {
        console.error("Invalidad handshake server type '" + type + "'");

        // Try to get an alternative handshake channel
        nextHandshake();
    }

    var channel = new channelConstructor(conf);

    Transport_Presence_init(channel, peersManager, conf.max_connections)

    channel.uid = type;
    channels[type] = channel;

    channel.addEventListener('open', function(event)
    {
      status = 'connected';

      var event = document.createEvent("Event");
          event.initEvent('open',true,true);

      self.dispatchEvent(event);
    });
    channel.addEventListener('close', function(event)
    {
      status = 'connecting';

      // Delete the channel from the current ones
      delete channels[channel.uid];

      // Try to get an alternative handshake channel
      nextHandshake(configuration);
    });
  }


  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    return channels;
  };


  // Request the handshake servers configuration file
  var http_request = new XMLHttpRequest();

  http_request.open('GET', json_uri);
  http_request.onload = function()
  {
    if(this.status == 200)
    {
      status = 'connecting';

      var configuration = JSON.parse(http_request.response);

      if(configuration.length)
        getRandomHandshake(configuration);

      else
      {
        status = 'disconnected';

        if(self.onerror)
           self.onerror('Handshake servers configuration is empty');
      }
    }

    else if(self.onerror)
      self.onerror('Unable to fetch handshake servers configuration');
  };
  http_request.onerror = function()
  {
    if(self.onerror)
       self.onerror('Unable to fetch handshake servers configuration');
  };

  http_request.send();
}

_priv.HandshakeManager.handshakeServers = {}
_priv.HandshakeManager.registerConstructor = function(type, constructor)
{
  _priv.HandshakeManager.handshakeServers[type] = constructor
}

return module
})(webp2p || {})