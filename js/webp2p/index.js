/**
 * @fileoverview Magic dependency loading. Taken from JsJaC library.
 * @author Stefan Strigler steve@zeank.in-berlin.de (JsJaC)
 * @author Jesús Leganés Combarro "Piranna" piranna@gmail.com (webp2p)
 */

var webp2p =
{
  require: function(libraryName)
  {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="' + libraryName + '"></script>');
  },

  load: function(includes)
  {
    var scripts = document.getElementsByTagName('script');
    var path = './';

    for(var i = 0; i < scripts.length; i++)
    {
      var src = scripts.item(i).src;
      var regex = /webp2p\/index\.js$/;
      if(src && src.match(regex))
      {
        path = src.replace(regex, 'webp2p/');
        break;
      }
    }

    for(var i = 0; i < includes.length; i++)
      this.require(path + includes[i] + '.js');
  },

  bind: function(fn, obj, optArg)
  {
    return function(arg)
    {
      return fn.apply(obj, [arg, optArg]);
    };
  }
};

webp2p.load(
['peersManager',

 'handshake/index',
 'handshake/PubNub',
 'handshake/simpleSignaling',
 'handshake/XMPP',

 'lib/reliable.min',
 'lib/datachannel',
 'lib/EventTarget',
 'lib/jsjac',
 'lib/pubnub-3.3.min',
 'lib/simpleSignaling',

 'transport/routing']);