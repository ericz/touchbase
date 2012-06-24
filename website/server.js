var GOOG_URL = 'http://writebetterwith.us:9001/start';
var FB_URL = 'http://writebetterwith.us:9002/start';

var express = require('express');
var fs = require('fs');
var form = require('express-form'),
    field = form.field;
var hash = require('node_hash');
var restler = require('restler');
var async = require('async');
var qs = require('querystring');

var util = require('./lib/util');

var mongo = require('mongoskin');
var ObjectID = require('mongoskin').ObjectID;
var db = mongo.db('writebetterwith.us:27017/angelhack');
var Users = db.collection('users');
var Contacts = db.collection('contacts');
var Calls = db.collection('call');
var Texts = db.collection('text');

var app =  express.createServer();


// Initialize main server
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'angelhack' }));
app.use(express.static(__dirname + '/public'));

app.dynamicHelpers({
  session: function(req, res){
    return req.session;
  }
});



app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


var loggedIn = function(req, res, next) {
  if(req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};


app.get('/', function(req, res){
  res.render('index', {title: 'Touchbase'});
});

app.get('/login', function(req, res){
  if(req.session.user) {
    res.redirect('/dashboard');
    return;
  }
  res.render('login', {js: 'login', title: 'Touchbase - Login' });
});

app.get('/register', function(req, res){
  res.render('register', {js: 'register', title: 'Touchbase - Sign Up'});
});

app.get('/settings', loggedIn, function(req, res){
  var complete = function(){
    var locals = req.session.user;
    locals.js = 'settings';
    locals.title = 'Touchbase - Settings'
    locals.fb_token = req.session.user.fb_token;
    res.render('settings', locals);
  };
  
  var code = req.query.code;
  if(code) {
    restler.get('https://graph.facebook.com/oauth/access_token?client_id=254026524706355&redirect_uri=http://writebetterwith.us/settings&client_secret=65c4a1c6aa3fd9bc22872f5157244872&code='+code).on('complete', function(result) {
      if (!(result instanceof Error)){
        result = qs.parse(result);
        restler.get('https://graph.facebook.com/me?access_token='+result.access_token).on('complete', function(graphresult) {
          graphresult = JSON.parse(graphresult);
          Users.updateById(req.session.user._id, {$set: {fb_token: result.access_token, fb_id: graphresult.id, name: graphresult.name}});
          req.session.user.fb_token = result.access_token;
          req.session.user.fb_id = graphresult.id;
          req.session.user.name = graphresult.name;
          complete();
        });
      }
    });
  } else {
    complete();
  }
});

app.get('/dashboard', loggedIn, function(req, res){
  var id = req.session.user._id;
  Contacts.find({userid: id}).toArray(function(err, docs){
    async.forEach(docs, function(doc, cb){
      async.parallel({
        call: function(callback) {
          Calls.find({userid: id, phone: {$in: doc.phones}},  {limit:1, sort:[['date', -1]]}).toArray(callback);
        },
        text: function(callback) {
          Texts.find({userid: id, phone: {$in: doc.phones}},  {limit:1, sort:[['date', -1]]}).toArray(callback);
        },
        gmail: function(callback) {
          callback(null);
        },
        fb: function(callback) {
          callback(null);
        }
      }, function(err, result){
        doc.last = result
        cb(null);
      });
    }, function(err){
      docs.sort(function(a, b){
        var alen = a.last.call.length, blen = b.last.call.length;
        if(alen > 0 && blen === 0) {
          return -1;
        } else if (alen == 0 && blen > 0) {
          return 1;
        } else if (alen > 0 && blen > 0) {
          console.log(a.last.call[0].date , b.last.call[0].date,a.last.call[0].date < b.last.call[0].date);
          return (a.last.call[0].date < b.last.call[0].date) ? 1 : -1;
        } else {
          return 0;
        }
      });
      res.render('dashboard', {js: 'dashboard', title: 'Touchbase - Dashboard', docs: docs});
    });
  });
});

app.get('/logout', loggedIn, function(req, res) {
  delete req.session.user;
  res.redirect('/');
});

app.post('/login', 
  form(
    field('email').required('Email', 'Please enter an email').toLower().trim().isEmail('Email address is not valid'), 
    field('password').required('Password', 'Please enter a password')
  ), 
  function(req, res) {
    if (!req.form.isValid) {
      res.render('login', {js: 'login', message: req.form.errors[0], title: 'Touchbase - Login' });
      return;
    }
    Users.findOne({email: req.form.email}, function(err, doc){
      if(!doc || hash.sha256(req.form.password, doc.salt) !== doc.password) {
        res.render('login', {js: 'login', message: 'Incorrect email and password combination', title: 'Touchbase - Login'});
      } else {
        doc._id = doc._id.toString();
        req.session.user = doc;
        res.redirect('/dashboard');
      }
    });
  }
);

app.post('/remoteLogin', 
  form(
    field('email').required('Email', 'Please enter an email').toLower().trim().isEmail('Email address is not valid'), 
    field('password').required('Password', 'Please enter a password')
  ), 
  function(req, res) {
    if (!req.form.isValid) {
      res.send({message: req.form.errors[0]});
      return;
    }
    Users.findOne({email: req.form.email}, function(err, doc){
      if(!doc || hash.sha256(req.form.password, doc.salt) !== doc.password) {
        res.send({message: 'Incorrect email and password combination'});
      } else {
        res.send({userId: doc._id.toString()});
      }
    });
  }
);

app.post('/forgot', 
  form(
    field('email').required('Email', 'Please enter an email to reset your password').toLower().trim().isEmail('Email address is not valid')
  ), 
  function(req, res) {
    if (!req.form.isValid) {
      res.render('login', {js: 'login', message: req.form.errors[0], title: 'Touchbase - Forgot Your Password?'});
      return;
    }
    Users.findOne({email: req.form.email}, function(err, doc){
      if(!doc) {
        res.render('login', {js: 'login', message: req.form.email + ' not associated with an account' , title: 'Touchbase - Failed Password Recovery'});
      } else {
        var salt = util.generateId();
        var newPassword = util.generateId();
        var html = '<p>Your Touchbase password has been reset</p><p>New password: '+newPassword+'</p><p>Sign in to access your account and change your password: <a href="http://localhost/login">http://localhost/login</a>';
        var hashed = hash.sha256(newPassword, salt);
        Users.update({email: req.form.email}, {$set: {password: hashed, salt: salt}});
        res.render('login', {js: 'login', message: 'An email with a new password has been sent' , title: 'Touchbase - Password Reset'});
        util.email(req.form.email, 'Touchbase Password Reset', html);
      }
    });
  }
);

app.post('/register', 
  form(
    field('email').required('Email', 'Please enter an email').toLower().trim().isEmail('Email address is not valid'), 
    field('password').required('Password', 'Please enter a password').minLength(6, 'Passwords must be 6 characters long')
  ),
  function(req, res) {
    if (!req.form.isValid) {
      res.render('register', {js: 'register', message: req.form.errors[0], 'title': 'Touchbase - Signed Up!'});
      return;
    }
    var user = req.form;
    user.salt = util.generateId();
    user.password = hash.sha256(user.password, user.salt);
    Users.insert(user, {safe: true}, function(err, doc){
      if(!doc) {
        res.render('register', {js: 'register', message: 'Email ' + req.form.email + ' already has an account', 'title': 'Touchbase - Duplicate Email'});
      } else {
        doc = doc[0];
        doc._id = doc._id.toString();
        req.session.user = doc;
        res.redirect('/dashboard');
        var html = '<p>Hi,</p><p>Thanks for signing up for Touchbase!</p><p>Your account is all set up and ready to use. <a href="http://localhost/dashboard">Start now</a>.</p><p>The Touchbase team</p>';
        util.email(user.email, 'Thanks for using Touchbase', html);
      }
    });
  }
);


app.post('/settings', 
  form(
    field('email').required('Email', 'Please enter an email').toLower().trim().isEmail('Email address is not valid'), 
    field('password'),
    field('google_email'),
    field('google_password').custom(util.encrypt),
    field('newpassword').minLength(6, 'New password must be 6 characters long'),
    field('confirmpassword').equals('field::newpassword', 'Passwords do not match')
  ),
  loggedIn, 
  function(req, res) {
    if (!req.form.isValid) {
      res.render('settings', {js: 'settings', message: req.form.errors[0], 'title': 'Touchbase - Settings'});
      return;
    }
    var insert = {google_email: req.form.google_email, google_password: req.form.google_password};
    
    if ((req.form.password || req.form.newpassword || req.form.confirmpassword) && req.form.newpassword.length > 0) {
      if (req.session.user.password === hash.sha256(req.form.password, req.session.user.salt)){
        insert['password'] = hash.sha256(req.form.newpassword, req.session.user.salt);
      } else {
        res.render('settings', {js: 'settings', message: 'Old password entered is incorrect', title: 'Touchbase - Settings'});
        return;
      }
    }
    
    if (req.session.user.email !== req.form.email) {
      Users.findOne({email: req.form.email}, function(err, doc){
        if(!doc) {
          insert['email'] = req.form.email;
          Users.updateById(req.session.user._id, {$set: insert});
          for(var key in insert) {
            req.session.user[key] = insert[key];
          }
          res.render('settings', {js: 'settings', message: 'Account settings updated', title: 'Touchbase - Updated Settings'});
        } else {
          res.render('settings', {js: 'settings', message: 'New email is already associated with an account', title: 'Touchbase - Duplicate Email'});
        }
      });
    } else {
      Users.updateById(req.session.user._id, {$set: insert});
      for(var key in insert) {
        req.session.user[key] = insert[key];
      }
      res.render('settings', {js: 'settings', message: 'Account settings updated', title: 'Touchbase - Updated Settings'});
    }
  }
);

app.post('/grab', function(req, res) {
  if(req.session.user.fb_token) {
    restler.postJson(FB_URL, {userId: req.session.user._id, access_token: req.session.user.fb_token, id: req.session.user.fb_id});
    console.log('Grabbing Facebook data');
  }
  if(req.session.user.google_email && req.session.user.google_password) {
  // Start google scraper
    console.log('goog', {userId: req.session.user._id, google_email: req.session.user.google_email, google_password: util.decrypt(req.session.user.google_password)});
    restler.postJson(GOOG_URL, {userId: req.session.user._id, google_email: req.session.user.google_email, google_password: util.decrypt(req.session.user.google_password)});
    console.log('Grabbing Google data');
  }
});

app.get('*', function(req, res){
  res.render('404', {status: 404, title: 'Touchbase - 404'});
});
app.listen(80);




