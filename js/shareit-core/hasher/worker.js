/**
 * Worker to hash and check existence of a file
 */


importScripts('../lib/sha512.js');


/**
 * Hash the data of a file
 * @param {BinaryString} data Data to be hashed.
 * @param {Function} onsuccess Callback called when data was hashed.
 */
function hashData(data, onsuccess)
{
  var shaObj = new jsSHA(data, 'TEXT');
  var hash = shaObj.getHash('SHA-512', 'B64').replace('/', '-');

  onsuccess(hash);
}

/**
 * Hash a {Fileentry}
 * @param {Fileentry} fileentry {Fileentry} to be hashed.
 */
function hashFileentry(fileentry)
{
  var reader = new FileReader();

  reader.onload = function()
  {
    // this.result is the readed file as an ArrayBuffer.
    hashData(this.result, function(hash)
    {
      fileentry.hash = hash;
      self.postMessage(['hashed', fileentry]);
    });
  };

  reader.readAsBinaryString(fileentry.file);
}


/**
 * Receive new petitions to hash or check {Fileentry}s
 * @param {DOMEvent} event
 */
self.onmessage = function(event)
{
  var fileentry = event.data[1];

  switch(event.data[0])
  {
    case 'hash':
      hashFileentry(fileentry);
      break;
  }
}