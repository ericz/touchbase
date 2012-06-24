var http = require('http');
var ImapConnection = require('imap').ImapConnection;
var util = require('util');
var rest = require('restler');
var express = require('express');
var sys = require('sys'); 

var login = function(username, password) {
  return new ImapConnection({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    username: username,
    password: password
  });
};

function die(err) {
  console.log('Uh oh: ' + err);
  process.exit(1);
}

var scrapeEmails = function (email, pw, userId){
  var imap = login(email, pw, userId);

  var box, cmds, next = 0, cb = function(err) {
    if (err)
      die(err);
    else if (next < cmds.length)
      cmds[next++].apply(this, Array.prototype.slice.call(arguments).slice(1));
  };

  var msgs = {};

  cmds = [
    function() { imap.connect(cb); },
    function() { imap.openBox("\[Gmail\]/Sent\ Mail", false, cb); },
    function(result) { box = result; imap.search([ 'ALL', ['SINCE', 'June 20, 2012'] ], cb); },
    function(results) {
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
          processSentMail(msgs, email, userId);
        });
      };
    }
  ];

  cb();
};

var trimName = function(to) {
  var openIndex = to.indexOf("<");
  if( openIndex != -1) {
    var closeIndex = to.indexOf(">");
    return to.substring(openIndex + 1, closeIndex);
  }
  return to;
}

var processSentMail = function(data, email, userId) {
  var processedData = [];
  var datum, curData;
  for (var i in data) {
    curData = data[i];
    var people = curData.headers.to[0].split(", ");
    for ( var j in people ) {
      datum = {
        fetchSeqNum: curData.seqno,
        date: curData.date,
        gmailId: curData.id,
        flags: curData.flags,
        from: curData.headers.from,
        subject: curData.headers.subject,
        to: trimName(people[j]),
        people: people,
        body: curData.body,
        email: email
      }
      processedData.push(datum);
    }
  }
  postToMongo(processedData, userId);
};

var postToMongo = function (data, userId) {
  rest.postJson( 'http://writebetterwith.us:9000/' + userId + '/addData', {
    type: "gmail",
    data: data
  }).on('complete', function(e, res) {
    console.log('Done posting to mongo');
  });
}

var app = express.createServer();
app.use(express.bodyParser());

// GET used for testing
app.get('/start', function (req, res) {
var email = req.query.google_email;
var pw = req.query.google_password;
var userId = req.query.userId;
scrapeEmails(email, pw, userId);

res.send({status: 'ok'});
});


/*
app.post('/start', function (req, res) {
  var email = req.body.google_email;
  var pw = req.body.google_password;
  var userId = req.body.userId;
  scrapeEmails(email, pw, userId);

  res.send({status: 'ok'});
});*/
app.listen(9001);

console.log("Server started. Control C to stop it");
