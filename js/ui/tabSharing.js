var ui = (function(module){
var _priv = module._priv = module._priv || {}

_priv.TabSharing = function(tableId, preferencesDialogOpen)
{
  var self = this;

  var table = document.getElementById(tableId);
  this.tbody = table.getElementsByTagName('tbody')[0];


  function noFilesCaption()
  {
    // Compose no files shared content (fail-back)
    var cell = _priv.spanedCell(table);
    cell.appendChild(document.createTextNode('You are not sharing any file, '+
                                             'please add a shared point on the '));

    var anchor = document.createElement('A');
        anchor.id = 'Preferences';
        anchor.style.cursor = 'pointer';
    cell.appendChild(anchor);

    $(anchor).click(preferencesDialogOpen);

    var span = document.createElement('SPAN');
        span.setAttribute('class', 'preferences');
        span.appendChild(document.createTextNode('preferences'));
    anchor.appendChild(span);

    cell.appendChild(document.createTextNode('.'));

    return cell;
  }
  this.noFilesCaption = noFilesCaption();


  function rowSharedpoint(sharedpoint)
  {
    // Sharedpoint row
    var tr = document.createElement('TR');
        tr.setAttribute('data-tt-id',sharedpoint);

    var td = document.createElement('TD');
        td.colSpan = 3;
    tr.appendChild(td);

    // Name & icon
    var span = document.createElement('SPAN');
//        span.className = fileentry.sharedpoint.type
        span.appendChild(document.createTextNode(sharedpoint));
    td.appendChild(span);

    return tr
  }

  function rowFileentry(fileentry)
  {
    // Fileentry row
    var tr = document.createElement('TR');
        tr.setAttribute('data-tt-id', "");  // Hack for TreeTable

    var td = document.createElement('TD');
    tr.appendChild(td);

    var blob = fileentry.file || fileentry.blob || fileentry;

    var type = blob.type;

    // Name & icon
    var a = document.createElement('A');
        a.href = window.URL.createObjectURL(blob);
        a.target = '_blank';
    td.appendChild(a);

    // [ToDo] ObjectURL should be destroyed somewhere...
    //window.URL.revokeObjectURL(div.firstChild.href);

    var span = document.createElement('SPAN');
        span.className = _priv.filetype2className(type);
        span.appendChild(document.createTextNode(fileentry.name));
    a.appendChild(span);

    // Type
    var td = document.createElement('TD');
        td.appendChild(document.createTextNode(type || '(unknown)'));
    tr.appendChild(td);

    // Size
    var size = blob.size;

    var td = document.createElement('TD');
        td.className = 'filesize';
        td.appendChild(document.createTextNode(humanize.filesize(size)));
    tr.appendChild(td);

    return tr;
  }

  this.updateFiles = function(fileslist)
  {
    var prevSharedpoint;
    var prevPath;

    for(var i = 0, fileentry; fileentry = fileslist[i]; i++)
    {
      // Sharedpoint
      var sharedpoint = fileentry.sharedpoint;

      if(prevSharedpoint != sharedpoint)
      {
        if(sharedpoint)
          this.tbody.appendChild(rowSharedpoint(sharedpoint));

        prevSharedpoint = sharedpoint;
        prevPath = '';
      }

      // Folder
      var path = fileentry.path;

      if(sharedpoint && path)
      {
        path = sharedpoint + '/' + path;

        if(prevPath != path)
        {
          prevPath = path;

          this.tbody.appendChild(_priv.rowFolder(path, 3));
        }
      }

      // Fileentry
      var parent;
      if(sharedpoint)
      {
        if(prevPath)
          parent = prevPath;
        else
          parent = sharedpoint
      }

      var tr_file = rowFileentry(fileentry)
      this.tbody.appendChild(tr_file);

      if(parent)
        tr_file.setAttribute('data-tt-parent-id', parent);

      // Duplicates
      if(fileentry.duplicates)
      {
        var id = parent ? parent+"/"+fileentry.name : fileentry.name

        tr_file.setAttribute('data-tt-id', id);

        tr_file.setAttribute('data-tt-initialState', "collapsed");

        for(var j = 0, duplicate; duplicate = fileentry.duplicates[j]; j++)
        {
          var tr = document.createElement('TR');
              tr.setAttribute('data-tt-id', "");
              tr.setAttribute('data-tt-parent-id', id);

          var td = document.createElement('TD');
          td.colSpan = 3

          var fullpath = ""

          // Sharedpoint
          if(duplicate.sharedpoint)
            fullpath += duplicate.sharedpoint

          // Path
          if(duplicate.path)
          {
            if(fullpath)
               fullpath += '/'
            fullpath += duplicate.path
          }

          // Name
          if(fullpath)
             fullpath += '/'
          fullpath += duplicate.name

          td.appendChild(document.createTextNode(fullpath));

          tr.appendChild(td);
        }

        this.tbody.appendChild(tr);
      }
    }
  };
}
_priv.TabSharing.prototype = _priv.FilesTable;

return module
})(ui || {})