var config = (function(module){
var _priv = module._priv = module._priv || {}

module.handshake_servers =
[
  [
    "PubNub",
    {
      "channel"      : "ShareIt",
      "publish_key"  : "pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b",
      "subscribe_key": "sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a",
      "ssl"          : true,

      "max_connections" : 50
    }
  ],
  [
    "XMPP",
    {
      "httpbase": "https://bind.jappix.com/",

      "domain":   "anonymous.jappix.com",

      "authtype": "saslanon",
      "secure":   true,

      "room": "webp2p@muc.jappix.com"
    }
  ],
  [
    "SimpleSignaling",
    {
      "ws_uri": "wss://simplesignaling-piranna.dotcloud.com"
    }
  ],
  [
    "SIP",
    {
      "outbound_proxy_set": "ws://192.168.1.33:10080"
    }
  ],
  [
    "xRTML",
    {
      "appKey":    "ESqhZz",
      "authToken": "4b29a9591e1d4311bccc69b28c542b60",
      "channels":  [{"name": "ShareIt"}],
      "url":       "http://developers2.realtime.livehtml.net/server/2.1",

      "max_connections": 100
    }
  ],
  [
    "Pusher",
    {
      "appKey":    "",

      "encrypted": true,

      "authToken": "4b29a9591e1d4311bccc69b28c542b60",
      "channels":  [{"name": "presence-ShareIt"}],
      "url":       "http://developers2.realtime.livehtml.net/server/2.1",

      "max_connections": 20
    }
  ]
]

return module
})(config || {})