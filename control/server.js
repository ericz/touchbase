var fs = require('fs');
var express = require('express');
var app =  express.createServer();
var mongo = require('mongoskin');
var db = mongo.db('writebetterwith.us:27017/angelhack');
var Contacts = db.collection('contacts');
var async = require('async');
var rapportive = require('./rapportive')
// Initialize main server
app.use(express.bodyParser());
/*

var mergeOrInsert = function (contactInfo) {

  for(var i in contactInfo.phones) {
    contactInfo.phones[i] = stripAlphaChars(contactInfo.phones[i]);
  }

  var queries = [];
  queries.push({phones : {$in : contactInfo.phones} })
  queries.push({emails : {$in : contactInfo.emails} })
  if(contactInfo.fbid) {
   queries.push({fbid : contactInfo.fbid})
  }
  
  if(contactInfo.name) {
    queries.push({name: contactInfo.name});
  }
  
  var query = {$and : [ {userid : contactInfo.userid} , {$or : queries } ] }
  
  Contacts.findOne( query , function (err, result){
    if (err) {
      throw err
    }
    
    if (result){
      //update or merge the user
      var update = { phones : { $each : contactInfo.phones } , emails : { $each : contactInfo.emails } } 
      if (contactInfo.fbid) {
        Contacts.updateById( result['_id'].toString() , { $addToSet : update , $set : {fbid : contactInfo.fbid } }, function(err, result) {
          if (err) {throw err}
        })
      } else {
        Contacts.updateById( result['_id'].toString() , { $addToSet : update }, function(err, result) {
          if (err) {throw err}
        })
      }
    } else{
      Contacts.insert( contactInfo, function(err, result){
        if (err) { throw err }
      })
    }
  })
}
*/
app.post('/:user/addContact', function(req, res){
  req.body.forEach(function(contact){
    db.collection('contacts').update({userid: req.params.user, name: contact.name}, contact, {upsert: true});
  });
  res.send({"status": "ok"})
});

app.post('/:user/addData' , function(req, res){
  var collectionType = req.body.type
  var userid = req.params.user
  var data = req.body.data
  
  var toInsert = [];
  
  async.forEach(data, function(datum, cb){
  
    var setcontact = function(err, doc){
      datum.contactid = doc._id.toString();
      toInsert.push(datum);
      cb();
    };
    if(datum.type === 'gmail') {
      db.collection('contacts').findOne({userid: req.params.user, email: datum.to}, setcontact);
    } else if (datum.type === 'call') {
      db.collection('contacts').findOne({userid: req.params.user, phone: datum.phone}, setcontact);
    } else if (datum.type === 'text') {
      db.collection('contacts').findOne({userid: req.params.user, phone: datum.phone}, setcontact);
    } else if (datum.type === 'fb') {
      db.collection('contacts').findOne({userid: req.params.user, fbid: datum.fbid}, setcontact);
    } 
  }, function(){
    db.collection('data').insert(toInsert);
    res.send({"status": "ok"})
  });
  
  /*
  var toInsert = []
  for (var i = 0 , ii = data.length ; i < ii ; i = i + 1){
    var datum = data[i];
    datum['date'] = new Date(datum['date'])
    datum['userid'] = userid
    toInsert.push(datum)
  }
  db.collection(collectionType).insert(toInsert, function(err, result){
    if (err) { throw err; }
    res.send({"status" : "ok"})
  })*/
});
/*
app.get('/:user/find' , function (req, res) {
  var userid = req.params.user;
  var query = req.body.data;
  Contacts.findOne( {$and : [ {userid : userid} , query]} , function (err , data) {
    if (err) { throw err; } 
    res.send({"status" : "ok" , "contact" : data})     
  })  
})

app.post('/:user/follow', function (req, res) {
  var toInsert = [] 
  var userid = req.params.user
  for ( var i = 0 , ii = req.body.length; i < ii ; i = i + 1) {
    var contact = req.body[i]
    var contactid = contact['_id'].toString()
    toInsert.push(contactid)
  }
  db.collection('following').update({userid : userid}, { $addToSet : {contacts : {$each : toInsert } } } ,{upsert : true} ,function (err, result) {
    if (err) {throw err; }
    res.send({"status" : "ok"})  
  }) 

})
*/
app.listen(9000);


function stripAlphaChars(pstrSource) 
{ 
var m_strOut = new String(pstrSource); 
    m_strOut = m_strOut.replace(/[^0-9]/g, ''); 

    return m_strOut; 
}
