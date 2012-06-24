var rest = require('restler');
this.getFromRapportive = function(email, callback) {
  rest.get('https://rapportive.com/login_status?user_email=bousheesnaw%40gmail.com&client_version=ChromeExtension+rapportive+1.2.6&client_stamp=1340520963').on('complete', function(obj) {
    var session_token = obj.session_token;
    rest.get('https://profiles.rapportive.com/contacts/email/'+email+'?session_token='+session_token).on('complete', function(result) {
      var mems = result.contact.memberships;
      for (var i in mems) {
        if (mems[i].site_name == "Facebook") {
          callback(mems[i].profile_id);
          return;
        }
      }
      callback(null);
    });
  });
}
this.getFromGraph = function(email, callback) {
  var token = "AAACEdEose0cBABuG9eqMRbiVC9XZAF8MGLd483NBrbnF7dbofP6HqK6EcOq11z4470CVROyWZA5ZCODdx0t2HoW0737K5D89eTMZCIhxFxegzSoRoihY";
  if (token) {
    rest.get('https://graph.facebook.com/search?q='+email+'&type=user&access_token='+token).on('complete',function(result){
      var obj = JSON.parse(result);
      callback((obj.data)[0].id);
    });
  } else {
    callback(null);
  }
}
this.getFromGraph(process.argv[2], function(id){console.log(id)});
module.exports = this;
