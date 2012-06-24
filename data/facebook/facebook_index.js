var http = require("http");
var rest = require("restler");
var express = require("express"); 

var access_token = "AAACEdEose0cBAEPvY9v9qtbG1P8v3ZCpejsxqrBycp2RBVEy1ZA8iPqQ6w3OE5eu0MSti49PZBYFd9MTqwZCykwqdmNZAAa9VcsQt0TAzkdZCZCPDxNqUjU";

var id = "100000786426747";
var userId = "something";

// access_token:
// id:
// userId:

var base_url = "https://graph.facebook.com/";


var app = express.createServer();

var get_friends = function (access_token, id, userId, res) {
    var url = base_url + id + "/friends?access_token=" + access_token;

    var post_url = "http://writebetterwith.us:9000/"+userId+"/addContact";
    rest.get(url).on('complete', function(result) {
        // this can be changed to something more structured,
        // and less dependent on the format of the text
        result = result.split('"id":');
        result = result.join('"fbid":');
        result = JSON.parse(result).data;
        console.log(result);
        rest.postJson(post_url, result);
        /*
        for ( var i = 0; i < result.data.length; ++i ) {
            console.log(result.data[i].name + " ");
            res.write(result.data[i].name + " ");
        }
        */
    });
};

var parse_result = function(id, result, userId) {
    console.log(result);
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
                        "userId": userId,
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

var get_messages = function(access_token, id, userId, res) {
    var url = base_url + id + "/inbox?access_token=" + access_token;

    rest.get(url).on('complete', function(result) {
        //console.log(result);
        parse_result(id, JSON.parse(result), userId);
        result = {type:'fb',data:result};
//        console.log(result);
        //postToMongo(result, userId);
    });
};

var scrape = function(access_token, id, userId, res) {
    get_friends(access_token, id, userId, res);
    get_messages(access_token, id, userId, res);
};

var postToMongo = function (data, id) {
    rest.postJson('http://writebetterwith.us:9000/' + id + '/addData', {
        type: "fb",
        data: data
    }).on('complete', function(e, res) {
        //console.log(e, res);
    });
};

app.get("/get/:access_token/:id/:userId", function(req, res) {
    //scrape(access_token, id, userId, res);
    
    scrape(req.params.access_token, req.params.id, req.params.userId, res);
});
app.listen(8888);
