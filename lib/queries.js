var mongo = require('mongoskin');
var db = mongo.db('writebetterwith.us:27017/angelhack');
var async = require('async')

var allMessagesFromSingleContact = function (userid, callback){
   db.collection('data').find({userid: userid}).toArray( function(err, results){
      async.map(results, function(result, cb){
        db.collection('contacts').findById(result.contactid, function (err, result) {
          var retObj = result
          var name = result.name
          var fbid = result.fbid
          retObj['name'] = name
          retObj['fbid'] = fbid
          cb(err, retObj)
        })
      },
      function(err, newresults) {
       callback(newresults)
      })
   })
}



exports.messagesForUser = allMessagesFromSingleContact

