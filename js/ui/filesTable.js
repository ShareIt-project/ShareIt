var ui = (function(module){
var _priv = module._priv = module._priv || {}

_priv.buttonFactory = function(self, fileentry, onclickFactory)
{
  var div = document.createElement('DIV');
  div.id = fileentry.hash;

  div.transfer = function()
  {
    var transfer = document.createElement('A');
    transfer.onclick = onclickFactory(fileentry);
    transfer.appendChild(document.createTextNode('Transfer'));

    while(div.firstChild)
      div.removeChild(div.firstChild);
    div.appendChild(transfer);
  };

  div.progressbar = function(value)
  {
    if(value == undefined)
       value = 0;

    var progress = document.createTextNode(Math.floor(value * 100) + '%');

    while(div.firstChild)
      div.removeChild(div.firstChild);
    div.appendChild(progress);
  };

  div.open = function(blob)
  {
    var open = document.createElement('A');
    open.href = window.URL.createObjectURL(blob);
    open.target = '_blank';
    open.appendChild(document.createTextNode('Open'));

    while(div.firstChild)
    {
      window.URL.revokeObjectURL(div.firstChild.href);
      div.removeChild(div.firstChild);
    }
    div.appendChild(open);
  };

  var blob = fileentry.file || fileentry.blob

  // Show if file have been downloaded previously or if we can transfer it
  if(fileentry.bitmap)
  {
    var chunks = fileentry.size / shareit.chunksize;
    if(chunks % 1 != 0)
       chunks = Math.floor(chunks) + 1;

    div.progressbar(fileentry.bitmap.indexes(true).length / chunks);
  }
  else if(blob)
    div.open(blob);
  else
    div.transfer();

  $(self).on(fileentry.hash + '.begin', function(event)
  {
    div.progressbar();
  });
  $(self).on(fileentry.hash + '.update', function(event, value)
  {
    div.progressbar(value);
  });
  $(self).on(fileentry.hash + '.end', function(event, blob)
  {
    div.open(blob);
  });

  return div;
}

_priv.filetype2className = function(filetype)
{
  filetype = filetype.split('/');

  switch(filetype[0])
  {
    case 'image': return 'image';
    case 'video': return 'video';
  }

  // Unknown file type, return generic file
  return 'file';
}

_priv.spanedCell = function(table)
//Creates a cell that span over all the columns of a table
{
  var td = document.createElement('TD');
      td.colSpan = table.getElementsByTagName('thead')[0].rows[0].cells.length;
      td.align = 'center';

  return td;
}

_priv.rowFolder = function(path, colSpan)
{
  // Folder row
  var tr = document.createElement('TR');
      tr.setAttribute('data-tt-id',path);

  // Split full path in path and name
  var path = path.split('/');
  var name = path.slice(-1)
  path = path.slice(0, -1).join('/');

  // Set the parent of the folder
  if(path)
    tr.setAttribute('data-tt-parent-id',path);

  var td = document.createElement('TD');
      td.colSpan = colSpan
  tr.appendChild(td);

  // Name & icon
  var span = document.createElement('SPAN');
      span.className = 'folder';
      span.appendChild(document.createTextNode(name));
  td.appendChild(span);

  return tr;
}


_priv.FilesTable =
{
  dirty: true,

  update: function(fileslist)
  {
    // Remove old table and add new empty one
    while(this.tbody.firstChild)
      this.tbody.removeChild(this.tbody.firstChild);

    if(fileslist.length)
    {
      fileslist.sort(function(a, b)
      {
        function strcmp(str1, str2)
        {
          return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
        }

        var result = strcmp(a.sharedpoint, b.sharedpoint);
        if(result)
          return result;

        var result = strcmp(a.path, b.path);
        if(result)
          return result;

        var result = strcmp(a.file ? a.file.name : a.name, b.file ? b.file.name : b.name);
        if(result)
          return result;
      });

      this.updateFiles(fileslist);

      $(this.tbody.parentNode).treetable("destroy")
      $(this.tbody.parentNode).treetable(
      {
        expandable: true,
        initialState: 'expanded'
      });
      $(this.tbody).find("tr").mouseover(function()
      {
        $("tr.mouseover").removeClass("mouseover");
        $(this).addClass("mouseover");
      })
      $(this.tbody).find("tr").mousedown(function()
      {
        $("tr.selected").removeClass("selected");
        $(this).addClass("selected");
      })
    }
    else
    {
      var tr = document.createElement('TR');
          tr.appendChild(this.noFilesCaption);

      this.tbody.appendChild(tr);
    }
  }
}

return module
})(ui || {})