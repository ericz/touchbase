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
  var query = {$and : [ {userid : contactInfo.userid} , {$or : [  phoneQuery , emailQuery , urlQuery  ] } ] }
  //var query = {$and : [ {userid : contactInfo.userid} , phoneQuery  ] }
  console.log(query)
  Contacts.findOne( query , function (err, result){
    if (err) {throw err }
    console.log(result)
    if (result){
      //update or merge the user
      var update = { phones : { $each : contactInfo.phones } , emails : { $each : contactInfo.emails }  ,  urls : { $each : contactInfo.urls }  } 
      Contacts.updateById( result['_id'].toString() , { $addToSet : update   } , function(err, result) {
        if (err) {throw err}
      })
    }
    else{
      Contacts.insert( contactInfo, function(err, result){
        if (err) { throw err }
      })
    }
  })
}

app.post('/:user/addContact', function(req, res){
  var contactInfo;
  console.log(req.body)
  if (Array.isArray(req.body)){
    for ( var i = 0 , ii = req.body.length ; i < ii ; i = i + 1){
      contactInfo = req.body[i]
      contactInfo.userid = req.params.user
      if (! contactInfo.phones){
        contactInfo.phones = []
      }
      if (! contactInfo.urls) {
        contactInfo.urls = []
      }
      if (! contactInfo.emails) {
        if (contactInfo.fbid){
          db.collection('fb_emails').findOne({fbid : contactInfo.fbid} , function(err, result){
            if (err) { throw err }
            if (result){
              contactInfo.emails = [result.email]
              mergeOrInsert(contactInfo)
            }
            else {
              contactInfo.emails = []
              mergeOrInsert(contactInfo)
            }
          })
        }
      } 
      else{
        for (var i = 0 , ii = contactInfo.emails.length; i < ii; i = i + 1){
          var email = contactInfo.emails[i]
          rapportive.getFromGraph(email, function (result) {
            if (result) {
              db.collection('fb_emails').update({fbid : result} , {fbid : result , email : email}, {upsert : true}, function (err, result) {
                console.log('cb called')
                if (err) {throw err}
              })
            }
          })
        }
        mergeOrInsert(contactInfo)
      }
    }
  }
  else{
    contactInfo = req.body;
    contactInfo.userid = req.params.user
    mergeOrInsert(contactInfo)
  }
  res.send({"status": "ok"})
});

app.post('/:user/addData' , function(req, res){
  var collectionType = req.body.type
  var userid = req.params.user
  var data = req.body.data
  var toInsert = []
  for (var i = 0 , ii = data.length ; i < ii ; i = i + 1){
    var datum = data[i];
    datum['date'] = new Date(datum['date'])
    datum['userid'] = userid
    toInsert.push(datum)
  }
  db.collection(collectionType).insert(toInsert, function(err, result){
    if (err) { throw err; }
  })
  res.send({"status" : "ok"})
});


app.listen(9000);
