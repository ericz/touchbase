var http = require("http");
var rest = require("restler");
var express = require("express"); 

var access_token = "AAACEdEose0cBAAWVZCTSttY6JcZCBrwrzPyJ483hLn2BejbP37nil2fiotwHdyRZCdpQ8wZBAS7UjPwD3De0F8eabBdLuoy9cxKmAbC3dtjw9UXmW7hz";

var id = "taylor.nebel";
var userId = "something";

// access_token:
// id:
// userId:

var base_url = "https://graph.facebook.com/";

var post_url = "http://writebetterwith.us:9000/:userid/addContact";


//var url = "https://graph.facebook.com/taylor.nebel/friends?access_token=" + token;
//var url2 = "https://graph.facebook.com/taylor.nebel?access_token=" + token;
//var url3 = "https://graph.facebook.com/taylor.nebel/inbox?access_token=" + token;

var app = express.createServer();

var get_email = function(access_token, id, userId, res) {
    var url = base_url + id + "?access_token=" + access_token;
    
    rest.get(url).on('complete', function(result) {
        result = JSON.parse(result);
        console.log(result["email"]);
    });
};

var get_friends = function (access_token, id, userId, res) {
    var url = base_url + id + "/friends?access_token=" + access_token;

    rest.get(url).on('complete', function(result) {
        // this can be changed to something more structured,
        // and less dependent on the format of the text
        result = result.split('"id":');
        result = result.join('"fbid":');
        //console.log(result);
        result = JSON.parse(result);
        rest.postJson(post_url, result.data);
        for ( var i = 0; i < result.data.length; ++i ) {
            console.log(result.data[i].name + " ");
            res.write(result.data[i].name + " ");
        }
    });
}

var get_messages = function(access_token, id, userId, res) {
    var url = base_url + id + "/inbox?access_token=" + access_token;

    rest.get(url).on('complete', function(result) {
        //result = JSON.parse(result);
        console.log(result);
        postToMongo(result, userId);
    });
};



var scrape = function(access_token, id, userId, res) {
    get_friends(access_token, id, userId, res);
    get_email(access_token, id, userId, res);
    get_messages(access_token, id, userId, res);
};

var postToMongo = function (data, id) {
    console.log(data);
    rest.postJson('http://writebetterwith.us:9000/' + id + '/addData', {
        type: "facebook",
        data: data
    }).on('complete', function(e, res) {
        console.log(e, res);
    });
};

app.get("/get/:user/:token", function(req, res) {
    scrape(access_token, id, userId, res);
});
app.listen(8888);
