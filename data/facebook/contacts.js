var http = require("http");
var rest = require("restler");
var express = require("express"); 

var base_url = "https://graph.facebook.com/";


var app = express.createServer();

app.use(express.bodyParser());

var get_friends = function (access_token, id, userId) {
    var url = base_url + id + "/friends?access_token=" + access_token;

    var post_url = "http://writebetterwith.us:9000/"+userId+"/addFbContact";
    rest.get(url).on('complete', function(result) {
      // this can be changed to something more structured,
      // and less dependent on the format of the text
      result = result.split('"id":');
      result = result.join('"fbid":');
      result = JSON.parse(result).data;
      rest.postJson(post_url, result);
    });
};

app.post("/start", function(req, res) {
  get_friends(req.body.access_token, req.body.id, req.body.userId);
  res.send({status: 'ok'});
});
app.listen(9005);
