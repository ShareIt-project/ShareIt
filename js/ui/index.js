/**
 * @fileoverview Magic dependency loading. Taken from JsJaC library.
 * @author Stefan Strigler steve@zeank.in-berlin.de (JsJaC)
 * @author Jesús Leganés Combarro "Piranna" piranna@gmail.com (ShareIt!)
 */

var ui =
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
    for(var i=0; i<scripts.length; i++)
    {
      var src = scripts.item(i).src;
      var regex = /ui\/index\.js$/;
      if(src && src.match(regex))
      {
        path = src.replace(regex, 'ui/');
        break;
      }
    }

    for(var i=0; i<includes.length; i++)
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

ui.load(['dialogAbout',
         'dialogConfig',
         'filesTable',
         'menuTools',
         'promptUID',
         'tabDownloading',
         'tabHash',
         'tabPeer',
         'tabSearch',
         'tabSharing',
         'tabsMain',
         'tableSharedpoints',
         'ui']);