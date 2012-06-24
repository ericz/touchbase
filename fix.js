
var mongo = require('mongoskin');
var db = mongo.db('writebetterwith.us:27017/angelhack');

db.collection('data').find().toArray(function(err, docs){

  docs.forEach(function(val){
  
    db.collection('data').updateById(val._id, {$set: {date: new Date(val.date)}});
    
  });
  
});