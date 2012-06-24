var mongo = require('mongoskin');
var db = mongo.db('writebetterwith.us:27017/angelhack');
var async = require('async')

var allMessagesFromSingleContact = function (userid, callback){
   db.collection('data').find({userid: userid}).toArray( function(err, results){
      async.map(results, function(result, cb){
        db.collection('contacts').findById(result.contactid, function (err, res) {
          var retObj = result
          var name = res.name
          var fbid = res.fbid
          retObj['name'] = name
          retObj['fbid'] = fbid
          cb(err, retObj)
        })
      },
      function(err, newresults) {
       var analyzedData = {}
       for (var i = 0 in newresults){
        var newresult = newresults[i]
        if(analyzedData[newresult.name]){
          if (newresult.type === 'call') {
            if (analyzedData[newresult.name].call){
              analyzedData[newresult.name].call += newresult.length
            }
            else{
              analyzedData[newresult.name].call = newresult.length
            }
          }
          if (newresult.type == 'gmail') {
              if (analyzedData[newresult.name].call){
                analyzedData[newresult.name].gmail += newresult.length
              }
              else{
                analyzedData[newresult.name].gmail = newresult.length
              }
          }
          if (newresult.type == 'fb') {
              if (analyzedData[newresult.name].fb){
                 analyzedData[newresult.name].fb += newresult.length
              }
              else{
                 analyzedData[newresult.name].fb = newresult.length
              }
          } 
          if (newresult.type == 'text') {
              if (analyzedData[newresult.name].text){
                analyzedData[newresult.name].text += newresult.length
              }
              else{
                analyzedData[newresult.name].text = newresult.length
              }
          }   

        }
        else {
          analyzedData[newresult.name] = {}
          if (newresult.type === 'call'){
            analyzedData[newresult.name].call = newresult.length
          }
          if (newresult.type === 'fb'){
            analyzedData[newresult.name].fb = newresult.length
          }
          if (newresult.type === 'text'){
            analyzedData[newresult.name].call = newresult.length
          }
          if (newresult.type === 'gmail'){
            analyzedData[newresult.name].gmail = newresult.length
          }
        }
       }
       callback(analyzedData)
      })
   })
}

allMessagesFromSingleContact('4fe75efb08f78eed31000001', function (data) { console.log(data)})

exports.messagesForUser = allMessagesFromSingleContact

