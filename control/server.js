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

app.post('/:user/addContact', function(req, res){
  db.collection('users').findById(req.params.user, function(err, user) {
    if(err || !user) {
      res.send({error: "Invalid userid"});
      return;
    }
    req.body.forEach(function(contactInfo){
      contactInfo.userid = req.params.user
      
      if (! contactInfo.phones){
        contactInfo.phones = []
      }
      
      if (! contactInfo.emails){
        contactInfo.emails = []
      }
      
      if (contactInfo.emails.length === 0 && contactInfo.fbid) {
        db.collection('fb_emails').findOne({fbid : contactInfo.fbid} , function(err, result){
          if (result){
            contactInfo.emails = [result.email]          
          } else {
            contactInfo.emails = []
          }
          mergeOrInsert(contactInfo)
        })
      } else {
        async.forEach(contactInfo.emails, function(email, callback){
          rapportive.getFromGraph(user.fb_token, email, function (result) {  
            if (result) {
              contactInfo.fbid = result;
              db.collection('fb_emails').update({fbid : result} , {fbid : result , email : email}, {upsert : true}, function (err, result) {
                if (err) {throw err}
                callback(null);
              })
            } else {
              callback(null);
            }
          });
        }, function(){
          mergeOrInsert(contactInfo)
        }) 
      }
    });
    res.send({"status": "ok"})
  });
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
    res.send({"status" : "ok"})
  })
});

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

app.listen(9000);


function stripAlphaChars(pstrSource) 
{ 
var m_strOut = new String(pstrSource); 
    m_strOut = m_strOut.replace(/[^0-9]/g, ''); 

    return m_strOut; 
}
