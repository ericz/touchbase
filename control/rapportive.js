var rest = require('restler');
this.getFbFromEmail = function(email, callback) {
  rest.get('https://rapportive.com/login_status?user_email=bousheesnaw%40gmail.com&client_version=ChromeExtension+rapportive+1.2.6&client_stamp=1340520963').on('complete', function(obj) {
    var session_token = obj.session_token;
    rest.get('https://profiles.rapportive.com/contacts/email/'+email+'?session_token='+session_token).on('complete', function(result) {
      var mems = result.contact.memberships;
      for (var i in mems) {
        if (mems[i].site_name == "Facebook") {
          callback(mems[i].profile_id);
        }
      }

  });
});
}
module.exports = this;
