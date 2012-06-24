var rest = require('restler');

this.getFromGraph = function(token, email, callback) {
  rest.get('https://graph.facebook.com/search?q='+email+'&type=user&access_token='+token).on('complete',function(result){
    try {
      var obj = JSON.parse(result);
      if (obj.data && obj.data.length > 0) {
        callback((obj.data)[0].id);
      } else {
        callback(null);
      }
    } catch (e){
      callback(null);
    }
  });
}
module.exports = this;
