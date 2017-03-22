var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var index = require('./routes/index');
var inventory = require('./routes/inventory');
var item = require('./routes/item');
var login = require('./routes/login');
var logistics = require('./routes/logistics');
var financing = require('./routes/financing');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ibmApiConnect4me2',
  resave: false,
  saveUninitialized: true
}));

app.use('/', index);
app.use('/inventory', inventory);
app.use('/item', item);
app.use('/login', login);
app.use('/logistics', logistics);
app.use('/financing', financing);



const log4js = require("log4js");
const passport = require("passport");
const WebAppStrategy = require("bluemix-appid").WebAppStrategy;
var cfEnv = require("cfenv");
var AppIDCredentials, bluemixAppRoute;



try {
	AppIDCredentials = cfEnv.getAppEnv().services.AdvancedMobileAccess[0].credentials;
	bluemixAppRoute = cfEnv.getAppEnv().url;
	console.log('AppIDCredentials = ' + JSON.stringify(AppIDCredentials));
	console.log('bluemixAppRoute = ' + JSON.stringify(bluemixAppRoute));
} catch(err) {
	throw ('This sample should not work locally, please push the sample to Bluemix.');
}

var config = {};
config.oauthServerUrl = AppIDCredentials.oauthServerUrl;
config.clientId = AppIDCredentials.clientId;
config.tenantId = AppIDCredentials.tenantId;
config.secret = AppIDCredentials.secret;
config.bluemixAppRoute = bluemixAppRoute;


var path = require('path');

const LOGIN_URL = "/ibm/bluemix/appid/login";
const CALLBACK_URL = "/ibm/bluemix/appid/callback";
var LANDING_PAGE_URL = "/";

// Configure express application to use passportjs
app.use(passport.initialize());
app.use(passport.session());


passport.use(new WebAppStrategy({
	tenantId: config.tenantId,
	clientId: config.clientId,
	secret: config.secret,
	oauthServerUrl: config.oauthServerUrl,
	redirectUri: config.bluemixAppRoute + CALLBACK_URL
}));

// Configure passportjs with user serialization/deserialization. This is required
// for authenticated session persistence accross HTTP requests. See passportjs docs
// for additional information http://passportjs.org/docs
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Explicit login endpoint. Will always redirect browser to login widget due to {forceLogin: true}.
// If forceLogin is set to false redirect to login widget will not occur of already authenticated users.
app.get(LOGIN_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME, {
  forceLogin: true
}));

/ Callback to finish the authorization process. Will retrieve access and identity tokens/
// from AppID service and redirect to either (in below order)
// 1. the original URL of the request that triggered authentication, as persisted in HTTP session under WebAppStrategy.ORIGINAL_URL key.
// 2. successRedirect as specified in passport.authenticate(name, {successRedirect: "...."}) invocation
// 3. application root ("/")
app.get(CALLBACK_URL, passport.authenticate(WebAppStrategy.STRATEGY_NAME));


// Protected area. If current user is not authenticated - redirect to the login widget will be returned.
// In case user is authenticated - a page with current user information will be returned.
app.get("/protected", passport.authenticate(WebAppStrategy.STRATEGY_NAME), function(req, res){
  res.json(req.user);
});




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
