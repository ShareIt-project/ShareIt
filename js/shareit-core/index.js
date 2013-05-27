/**
 * @fileoverview Magic dependency loading. Taken from JsJaC library.
 * @author Stefan Strigler steve@zeank.in-berlin.de (JsJaC)
 * @author Jesús Leganés Combarro "Piranna" piranna@gmail.com (shareit)
 */

var shareit =
{
  require: function(libraryName)
  {
    // inserting via DOM fails in Safari 2.0, so brute force approach
    document.write('<script type="text/javascript" src="' + libraryName + '"></script>');
  },

  load: function(includes)
  {
    var scripts = document.getElementsByTagName('script');
    var path = './',
        i;
    for (i = 0; i < scripts.length; i++) {
      var src = scripts.item(i).src;
      var regex = /shareit-core\/index\.js$/;
      if (src && src.match(regex)) {
        path = src.replace(regex, 'shareit-core/');
        break;
      }
    }

    for (i = 0; i < includes.length; i++)
      this.require(path + includes[i] + '.js');
  },

  bind: function(fn, obj, optArg) {
    return function(arg) {
      return fn.apply(obj, [arg, optArg]);
    };
  }
};

shareit.load(
['bitmap',
 'cacheBackup',
 'db',
 'filesManager',
 'utils',
 'searchEngine',
 'shareitLocal',
 'shareitRemote',

 'hasher/index',

 'lib/BoolArray',
 'lib/dropbox.min',
 'lib/lunr.min',

 'lib/zip.js/deflate',
 'lib/zip.js/inflate',
 'lib/zip.js/zip',
 'lib/zip.js/zip-fs',
 'lib/zip.js/mime-types',

 'polyfills/FileWriter',
 'polyfills/IndexedDB-javascript',

 'sharedpoints/index',
 'sharedpoints/dropbox',
 'sharedpoints/entry',
 'sharedpoints/fileList',
 'sharedpoints/mega',

 'transport/index',
 'transport/fileslist',
 'transport/transfer',
 'transport/search']);