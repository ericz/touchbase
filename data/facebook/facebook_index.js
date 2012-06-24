var http = require("http");
var rest = require("restler");
var express = require("express"); 
var token = "AAACEdEose0cBAAH5j9ZCfpynXvtXBd5F0KkFiMF88A8PCdfZCAsaOENWlLBXZBEoZAsNOEv17k9iZB10dgCqADa1KabZC4DuPZAXGBZAjfgOs8pRZASZArrWt5";

// access_token:
// id:
// userId:

var url = "https://graph.facebook.com/taylor.nebel/friends?access_token=" + token;
var url2 = "https://graph.facebook.com/taylor.nebel?access_token=" + token;
var url3 = "https://graph.facebook.com/taylor.nebel/inbox?access_token=" + token;

var app = express.createServer();

var get_email = function() {
    rest.get(url2).on('complete', function(result) {
        result = JSON.parse(result);
        console.log(result["email"]);
    });
};

app.get("/get/:user/:token", function(req, res) {
    rest.get(url).on('complete', function(result) {
        result = JSON.parse(result);
        for ( var i = 0; i < result.data.length; ++i ) {
            res.write(result.data[i].name + " ");
        }

        get_email();
        var get_messages = function() {
            rest.get(url3).on('complete', function(result) {
                //result = JSON.parse(result);
                //console.log(result);
                res.write(result);
                res.end();
            });
        };
        get_messages();

    });
});

app.listen(8888);
