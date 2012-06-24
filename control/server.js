var fs = require('fs');
var express = require('express');
var app =  express.createServer();
var mongo = require('mongoskin');
var db = mongo.db('10.66.225.38:27017/angelhack?auto_reconnect');
var Contacts = db.collection('contacts');
// Initialize main server
app.use(express.bodyParser());


var mergeOrInsert = function (contactInfo) {
  console.log(contactInfo.phones)
  if (! (contactInfo.phones)){
    contactInfo.phones = []
  }
  if (! (contactInfo.emails)){
    contactInfo.emails = []
  }
  if (! (contactInfo.urls)){
    contactInfo.urls = []
  }
  var phoneQuery = {phones : {$in : contactInfo.phones} }
  var emailQuery = {emails : {$in: contactInfo.emails} } 
  var urlQuery = {urls: {$in: contactInfo.urls} }
  console.log(contactInfo.userid)
  var query = {$and : [ {userid : contactInfo.userid} , {$or : [  phoneQuery , emailQuery , urlQuery  ] } ] };
  //var query = {$and : [ {userid : contactInfo.userid} , phoneQuery  ] };
  console.log(query)
  Contacts.findOne( query , function (err, result){
    if (err) {throw err; }
    console.log(result)
    if (result){
      //update or merge the user
      var update = { phones : { $each : contactInfo.phones } , emails : { $each : contactInfo.emails }  ,  urls : { $each : contactInfo.urls }  } 
      Contacts.updateById( result['_id'].toString() , { $addToSet : update   } , function(err, result) {
        if (err) {throw err;}
      })
    }
    else{
      Contacts.insert( contactInfo, function(err, result){
        if (err) { throw err; }
      });
    }
  });
}

app.post('/', function(req, res){
  var contactInfo;
  console.log(req.body)
  if (Array.isArray(req.body)){
    for ( var i = 0 , ii = req.body.length ; i < ii ; i = i + 1){
      contactInfo = req.body[i];
      mergeOrInsert(contactInfo);
    }
  }
  else{
    contactInfo = req.body;
    mergeOrInsert(contactInfo);
  }
});

app.listen(9000);