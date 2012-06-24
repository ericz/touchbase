var fs = require('fs');
var express = require('express');
var app =  express.createServer();
var mongo = require('mongoskin');
var db = mongo.db('localhost:27017/angelhack');
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

app.post('/:user/addContact', function(req, res){
  var contactInfo;
  contactInfo.userid = req.params.user
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
  res.send(" ");
});

app.post('/:user/addData' , function(req, res){
  var collectionType = req.body.type
  var userid = req.params.user
  var data = req.body.data
  for (var i = 0 , ii = data.length ; i < ii ; i = i + 1){
    var datum = req.body.data[i];
    datum['userid'] = userid
  }
  db.collection(collectionType).insert(data, function(err, result){
    if (err) { throw err; }
  })
});


app.listen(9000);
