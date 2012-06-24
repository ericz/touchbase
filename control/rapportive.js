var rest = require('restler');
this.getFbFromEmail = function(email, callback) {
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
this.getFromGraph = function(email,token, callback) {
  if (token) {
    rest.get('https://graph.facebook.com/search?q='+email+'&type=user&access_token='+token).on('complete',function(result){
      var obj = JSON.parse(result);
      callback((obj.data)[0].id);
    });
  } else {
    callback(null);
  }
}
this.getFromGraph(process.argv[2],"AAAAAAITEghMBAKZBvaFxPrYPURGFTMIo2NcXOf6S3f1SYXd8pfbHcPIWOPIxGWT9j8D55mkZCs6WqTeuMpVdZB6kZBNZB2l0QNu2BoEMmxCIH2RwFu5Xo", function(id){console.log(id)});
module.exports = this;
