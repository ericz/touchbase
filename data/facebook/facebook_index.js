var http = require("http");
var rest = require("restler");
var express = require("express"); 

var base_url = "https://graph.facebook.com/";


var app = express.createServer();

app.use(express.bodyParser());

var get_friends = function (access_token, id, userId) {
    var url = base_url + id + "/friends?access_token=" + access_token;

    var post_url = "http://writebetterwith.us:9000/"+userId+"/addContact";
    rest.get(url).on('complete', function(result) {
      // this can be changed to something more structured,
      // and less dependent on the format of the text
      result = result.split('"id":');
      result = result.join('"fbid":');
      result = JSON.parse(result).data;
      rest.postJson(post_url, result);
      
    });
};

var parse_result = function(id, result, userId) {
  var data = [];
  for ( var i = 0; i < result.data.length; ++i ) {
    var conv = result.data[i];
    var people = conv.to.data;
    // check for case where the next data element doesn't have comments element
    if (!conv.comments) {
      //console.log(conv.to.data);
      continue;
    }
    for ( var j = 0; j < conv.comments.data.length; ++j ) {
      var comment = conv.comments.data[j];
      for ( var k = 0; k < people.length; ++k ) {
        if (people[k].id != id) {
          data.push({
            "fbid": people[k].id,
            "message": comment.message,
            "date": comment.created_time,
            "people":people
          });
        }
      }
    }        
  }
  //post the data 
    postToMongo(data, id);
};

var get_messages = function(access_token, id, userId) {
  var url = base_url + id + "/inbox?access_token=" + access_token;

  rest.get(url).on('complete', function(result) {
    parse_result(id, JSON.parse(result), userId);
  });
};

var scrape = function(access_token, id, userId) {
  get_friends(access_token, id, userId);
  get_messages(access_token, id, userId);
};

var postToMongo = function (data, id) {
  rest.postJson('http://writebetterwith.us:9000/' + id + '/addData', {
    type: "fb",
    data: data
  }).on('complete', function(e, res) {
    console.log('Completed posting to mongo');
  });
};

app.post("/start", function(req, res) {
  scrape(req.body.access_token, req.body.id, req.body.userId);
  res.send({status: 'ok'});
});
app.listen(9002);
