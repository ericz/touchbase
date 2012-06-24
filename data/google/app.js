var http = require('http');
var ImapConnection = require('imap').ImapConnection;
var util = require('util');
var xmpp = require('node-xmpp');

console.log("HIERE");

var imap = new ImapConnection({ 
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  username: 'xcalibar000@gmail.com',
  password: 'sharadvikram'
 });

console.log("Down");

function die(err) {
  console.log('Uh oh: ' + err);
  process.exit(1);
}

var box, cmds, next = 0, cb = function(err) {
  if (err)
    die(err);
  else if (next < cmds.length)
    cmds[next++].apply(this, Array.prototype.slice.call(arguments).slice(1));
};

var msgs = {};

cmds = [
  function() { imap.connect(cb); },
  function() { imap.openBox('INBOX', false, cb); },
  function(result) { box = result; imap.search([ 'ALL', ['SINCE', 'May 20, 2012'] ], cb); },
  function(results) {
    console.log(results);
    var fetchHeaders = imap.fetch( results, { request: { headers: ['from', 'to', 'subject', 'date'] } });
    fetchHeaders.on('message', function(msg) {
      msg.on('end', function() {
        msgs[msg.id] = msg;
      });
    });

    fetchHeaders.on('end', function() {
      fetchBody();
    });
  
    var fetchBody = function() {
      var fetch = imap.fetch(results, { request: { headers: false, body: true } });
      fetch.on('message', function(msg) {
        var body = "";
        msg.on('data', function(chunk) {
          body += chunk;
        });
        msg.on('end', function() {
          if (msgs[msg.id]) {
            msgs[msg.id].body = body;
          } else {
            console.log("ERROR: could not find item with id: " + msg.id);
          }

        });
      });
      fetch.on('end', function() {
        console.log('Done fetching all messages!');
        imap.logout(cb);
        printMessages();
      });
    }
  }
];
cb();

var printMessages = function() {
	for( var i in msgs) {
    console.log(msgs[i]);
  }
};

var server = http.createServer(function (request, response) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("HI");
});

server.listen(8000);

console.log("Server started. Control C to stop it");
