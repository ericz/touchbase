var nodemailer = require('nodemailer');
var email = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
      user: "support@academyready.com",
      pass: "7EPaZ&dW"
    }
});

var mongo = require('mongoskin');
var ObjectID = require('mongoskin').ObjectID;
var db = mongo.db('localhost:27017/angelhack');

var crypto = require('crypto');

var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
var key = 'lkdsajf;lkj32lkf;lksadlkjdsajf;lsafd332oururg98*&$(*#';

module.exports = {

  generateId: function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 8; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  email: function(to, subject, message){
    email.sendMail({
      to: to,
      from : 'Touchbase <mom@touchbase.ericzhang.com>',
      subject : subject,
      html : message
    }, function(err, result){
      if(err){ console.log(err); }
      else { console.log(result); }
    });
  },
  
  stripNonNumeric: function(value) {
    var m_strOut = new String(value); 
    m_strOut = m_strOut.replace(/[^0-9]/g, ''); 
    return m_strOut; 
  },
  
  isPhone: function(value) {
    if(value.length !== 10) {
      throw new Error("Please enter a valid 10-digit US phone number");
    }
  },
  encrypt: function(text) {
    var cipher = crypto.createCipher(algorithm, key);  
    var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    return encrypted;
  },
  
  decrypt: function(text) {
    var decipher = crypto.createDecipher(algorithm, key);
    var decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
    return decrypted;
  }
}
