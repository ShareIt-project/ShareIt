var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

// Fallbacks for vendor-specific variables until the spec is finalized.
var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;


/**
 * @classdesc Manager of the communications with the other peers
 * @constructor
 * @param {String} [stun_server="stun.l.google.com:19302"] URL of the server
 * used for the STUN communications.
 */
module.PeersManager = function(handshake_servers_file, stun_server)
{
  // Set a default STUN server if none is specified
  if(stun_server == undefined)
     stun_server = 'stun.l.google.com:19302';

  EventTarget.call(this);

  var peers = {};

  var self = this;


  /**
   * UUID generator
   */
  var UUIDv4 = function b(a)
  {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  };

  this.uid = UUIDv4();


  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(uid, incomingChannel, cb)
  {
    var pc = peers[uid] = new RTCPeerConnection(
    {
      iceServers: [{url: 'stun:'+stun_server}]
    },
    {
      optional: [{RtpDataChannels: true}]
    });
    pc.onicecandidate = function(event)
    {
      if(event.candidate)
        incomingChannel.sendCandidate(uid, event.candidate);
    }
    pc.onstatechange = function(event)
    {
      console.warn("PeerConnection "+event.target.readyState)
      console.warn("PeerConnection "+event.target.iceConnectionState)

      // Remove the peer from the list of peers when gets closed
      if(event.target.readyState == 'closed')
        delete peers[uid];
    };

    pc.onopen = function(event)
    {
      var event = document.createEvent("Event");
          event.initEvent('peerconnection',true,true);
          event.peerconnection = pc

      self.dispatchEvent(event);
    }

    if(cb)
      pc.onerror = function(event)
      {
        cb({uid: uid, peer:peer});
      };

    return pc;
  }

  /**
   * Initialize a {RTCDataChannel}
   * @param {RTCPeerConnection} pc PeerConnection owner of the DataChannel.
   * @param {RTCDataChannel} channel Communication channel with the other peer.
   */
  function initDataChannel(pc, channel, uid, cb)
  {
    channel.uid = uid;

    pc._channel = channel;

    _priv.Transport_Routing_init(channel, self);

    channel.addEventListener('close', function(event)
    {
      delete pc._channel;

      pc.close();
    });

    var event = document.createEvent("Event");
        event.initEvent('datachannel',true,true);
        event.channel = channel

    self.dispatchEvent(event);

    if(cb)
    {
      channel.addEventListener('open', function(event)
      {
        cb(null, uid);
      });
      channel.onerror = function(event)
      {
        cb({uid: uid, peer:pc, channel:channel});
      };
    }
  }


  /**
   * Process the offer to connect to a new peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  this.onoffer = function(uid, sdp, incomingChannel, cb)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
    {
      peer = createPeerConnection(uid, incomingChannel, cb);
      peer.addEventListener('datachannel', function(event)
      {
        if(event.channel.label == 'webp2p')
          initDataChannel(peer, event.channel, uid);
      });
    }

    // Process offer
    peer.setRemoteDescription(new RTCSessionDescription(
    {
      sdp: sdp,
      type: 'offer'
    }));

    return peer;
  };

  /**
   * Process the answer received while attempting to connect to the other peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @param {Function} onerror Callback called if we don't have previously
   * wanted to connect to the other peer.
   */
  this.onanswer = function(uid, sdp, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.setRemoteDescription(new RTCSessionDescription(
      {
        sdp: sdp,
        type: 'answer'
      }));
    else if(onerror)
      onerror(uid);
  };

  this.oncandidate = function(uid, candidate, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    else if(onerror)
      onerror(uid);
  }


  this.oncandidate = function(uid, candidate, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    else if(onerror)
      onerror(uid);
  }


  // Init handshake manager
  var handshakeManager = new _priv.HandshakeManager(handshake_servers_file, this);
  handshakeManager.onerror = function(error)
  {
    console.error(error);
    alert(error);
  };
  handshakeManager.onopen = function()
  {
    var event = document.createEvent("Event");
        event.initEvent('handshake.open',true,true);
        event.uid = self.uid

    self.dispatchEvent(event);

//    // Restart downloads
//    db.files_getAll(null, function(error, filelist)
//    {
//      if(error)
//        console.error(error)
//
//      else if(filelist.length)
//        policy(function()
//        {
//          for(var i=0, fileentry; fileentry=filelist[i]; i++)
//            if(fileentry.bitmap)
//              self.transfer_query(fileentry)
//        })
//    })
  };

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {MessageChannel} incomingChannel Optional channel where to
   * @param {Function(error, channel)} cb Callback
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, incomingChannel, cb)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
    {
      // Create PeerConnection
      peer = createPeerConnection(uid, incomingChannel, cb);

      var channel = peer.createDataChannel('webp2p');
      initDataChannel(peer, channel, uid, cb);

      var channel = peer.createDataChannel('webp2p');
      initDataChannel(peer, channel, uid);

      if(cb)
      {
        channel.addEventListener('open', function(event)
        {
          cb(null, uid);
        });
        channel.onerror = function(event)
        {
          cb({uid: uid, peer:peer, channel:channel});
        };
      }

      // Send offer to new PeerConnection
      peer.createOffer(function(offer)
      {
        console.log("[createOffer]: "+uid+"\n"+offer.sdp);

        // Send the offer only for the incoming channel
        if(incomingChannel)
           incomingChannel.sendOffer(uid, offer.sdp);

        // Send the offer throught all the peers
        else
        {
          var channels = self.getChannels();

          // Send the connection offer to the other connected peers
          for(var channel_id in channels)
            channels[channel_id].sendOffer(uid, offer.sdp);
        }

        // Set the peer local description
        peer.setLocalDescription(offer);
      });
    }

    // PeerConnection is connected but channel not created
    else if(!peer._channel)
      cb('PeerConnection is connected but channel not created, please wait'+
         'some more seconds')

    // Channel is created and we have defined an 'onsucess' callback
    else if(cb)
    {
      // Channel is open
      if(peer._channel.readyState == 'open')
        cb(null, uid);

      // Channel is not ready, call the callback when it's opened
      else
        peer._channel.addEventListener('open', function(event)
        {
          cb(null, uid);
        })
    }
  };

  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    var channels = {};

    // Peers channels
    for(var uid in peers)
    {
      var channel = peers[uid]._channel;
      if(channel)
        channels[uid] = channel;
    }

    // Handshake servers channels
    var handshakeChannels = handshakeManager.getChannels();

    for(var uid in handshakeChannels)
      if(handshakeChannels.hasOwnProperty(uid))
        channels[uid] = handshakeChannels[uid];

      return channels;
  };


  this.handshakeDisconnected = function()
  {
    if(!Object.keys(peers).length)
    {
      var event = document.createEvent("Event");
          event.initEvent('error.noPeers',true,true);

      this.dispatchEvent(event);
    }
  };
}

return module
})(webp2p || {})
