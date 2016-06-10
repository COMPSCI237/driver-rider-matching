"use strict";

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const engine = require('ejs-mate');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const MongoStore = require('connect-mongo/es5')(session);
const passport = require('passport');
const util = require('util');
const http = require("http");
const https = require('https');
const fs = require('fs');

var config = require('./config');
var httpPort = process.env.PORT || 80;
var httpsPort = 443;
var User = require('./models/user.js');
var app = express();

// connect to MongoDB

mongoose.connect(config.getMongoDbConnectionString(), function(err) {
  if (err) console.log(err);
  else console.log("Connected to MongoDB");
});


/*  start MongoDB with command "mongod --dbpath <path to data directory> --port 27017" */
// connect to Local MongoDB
/*
mongoose.connect('mongodb://localhost:27017/COMPSCI237', function(err) {
  if (err) console.log(err);
  else console.log("Connected to Local MongoDB");
});
*/

// set static assets serving folder
app.use('/assets', express.static(__dirname + '/public'));
// add HTTP request logger middleware
app.use(morgan('dev'));
// add body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// add cookie parsing middleware
app.use(cookieParser());
// add session middleware
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secretKey,
  store: new MongoStore({ url: config.getMongoDbConnectionString(), autoReconnect: true})
}));
// add flash messages middleware
app.use(flash());
// add authentication middleware
app.use(passport.initialize());
app.use(passport.session());
// set template engine
app.engine('ejs', engine);
app.set('view engine', 'ejs');
// create a middleware to add user to all routes
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var matchRoutes = require('./routes/match');
app.use(mainRoutes);
app.use(userRoutes);
app.use(matchRoutes);


/******************************************************************************/
// Kafka Proxy, uncomment this section when testing kafka
// When using Samza as backend, make changes on message topic and other logic
/*
var kafka = require('kafka-node');
var HighLevelConsumer = kafka.HighLevelConsumer;
var Client = kafka.Client;
var topic = "match-stream";
var client = new Client('localhost:2181');
var topics = [ { topic: topic }];
var options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024*1024 };
var consumer = new HighLevelConsumer(client, topics, options);

var matchings = []
consumer.on('message', function (message) {
  var messageObj = JSON.parse(message.value);
    util.log("User %s message received on Consumer side", messageObj.riderId);
    matchings.push(messageObj);
});

consumer.on('error', function (err) {
    console.log('error', err);
});

exports.queryMatching = (riderId) => {
  var result = null;
  for (let i = 0; i < matchings.length; i++) {
    var matching = matchings[i];
    if (matching.riderId == riderId) {
      result = matching;
      matchings.splice(i, 1);
      break;
    }
  }
  return result;
}
*/
/******************************************************************************/


const performanceTest = require("./test/performanceTest");
//performanceTest.generateUser(100, "driver");
//performanceTest.generateUser(100, "rider");
//performanceTest.initDriverLocation();

//performanceTest.testBatchPerf(30000, 0);


const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: 'asdf1234'
};

http.createServer(app).listen(httpPort, function(err) {
  if (err) throw err;
  console.log("Server is Running on port " + httpPort);
});

https.createServer(options, app).listen(httpsPort, function(err) {
  if (err) throw err;
  console.log("Server is Running on port " + httpsPort);
});
