"use strict";

const router = require('express').Router();
const util = require('util');
const async = require('async');
const math = require('mathjs');
var User = require('../models/user.js');
var passportConfig = require('../config/passport');


router.get('/ride', passportConfig.isAuthenticated, function(req, res) {
  res.render('match/ride');
});

router.get('/drive', passportConfig.isAuthenticated, function(req, res) {
  res.render('match/drive');
});

/******************************************************************************/
// Kafka Proxy, uncomment this section when testing kafka
// When using Samza as backend, make changes on message topic and other routes
/*
var kafka = require('kafka-node');
var HighLevelProducer = kafka.HighLevelProducer;
var Client = kafka.Client;
var client1 = new Client();
var topicRider = "events"
var topicDriver = "topic2"

var producer = new HighLevelProducer(client1);

const server = require("../server.js");

producer.on('ready', function () {
    console.log("Producer ready!");

    router.post('/ride', function(req, res, next) {
      util.log("Rider " + req.user.profile.name + " requested a ride");
      async.waterfall([
        function(callback) {
          var messageObj = {}
          messageObj.blockId = req.body.district;
          messageObj.riderId = req.user._id;
          messageObj.latitude = req.body.latitude;
          messageObj.longitude = req.body.longitude;
          messageObj.type = "RIDE_REQUEST";
          var message = JSON.stringify(messageObj);
          producer.send([
            {topic: topicRider, messages: [message] }
          ], function (err, data) {
              if (err) util.log(err);
              else util.log('User %s message sent on Producer side', req.user._id);
          });
          callback(null, req.user._id);
        },
        function(riderId, callback) {
          var interval = 1000;
          var intervalId = setInterval(setTime, interval);
          var matching = null;
          function setTime() {
            matching = server.queryMatching(riderId);
            if (matching != null) {
              clearInterval(intervalId);
              callback(null, matching);
            }
          }
        },
        function(matching, callback) {
          res.end("Nearest Driver is: " + matching.riderId + " \n");
        }
      ]);
    });


    router.post('/drive', passportConfig.isAuthenticated, function(req, res, next) {

      var messageObj = {};
      messageObj.blockId = req.body.district;
      messageObj.driverId = req.user._id;
      messageObj.latitude = req.body.latitude;
      messageObj.longitude = req.body.longitude;
      messageObj.type = "DRIVER_LOCATION";

      // console.log("### message: ");
      // console.log(messageObj);
      var message = JSON.stringify(messageObj);
      producer.send([
        {topic: 'topicDriver', messages: [message] }
      ], function (err, data) {
        if (err) console.log(err);
        else console.log('user %s message sent', req.user._id);
      });



});
*/
/******************************************************************************/



router.post('/ride', function(req, res, next) {
  util.log("Rider " + req.user.profile.name + " requested a ride");
  async.waterfall([
    function(callback) {
      User.find({type: 'driver', district: req.body.district}, function(err, drivers) {
        if (drivers.length == 0) {
          User.find({type: 'driver'}, function(err, drivers) {
            callback(null, drivers);
          });
        } else {
          callback(null, drivers);
        }
      });
    },
    function(drivers, callback) {
      if (drivers.length == 0) {
        callback(null, null);
      }
      var minDist = Number.MAX_VALUE;
      var nearestDriver = null;
      var count = 0;
      drivers.forEach(function(driver) {
        var dist = math.sqrt(math.pow(req.body.latitude - driver.location.latitude, 2)
        + math.pow(req.body.longitude - driver.location.longitude, 2));
        if (dist < minDist) {
          minDist = dist;
          nearestDriver = driver;
        }
        count += 1;
        if (count === drivers.length) {
          callback(null, nearestDriver);
        }
      });
    },
    function(nearestDriver, callback) {
      res.write("You location is received by the server!\n");
      res.write("   Latitude: " + req.body.latitude + "\n");
      res.write("   Longitude: " + req.body.longitude + "\n");
      if (nearestDriver) {
        res.end("Nearest Driver is: " + nearestDriver.profile.name + " \n");
      } else {
        res.end("No Driver has been found \n")
      }
    }
  ]);
});

router.post('/drive', passportConfig.isAuthenticated, function(req, res, next) {
  User.findById(req.user._id, function(err, driver) {
    if (err) return next(err);
    driver.location.longitude = req.body.longitude;
    driver.location.latitude = req.body.latitude;
    driver.district = req.body.district;
    driver.save(function(err) {
      if (err) return next(err);
    });
    util.log("Driver " + driver.profile.name + " sent in location update");
    util.log("    " + req.body.longitude);
    util.log("    " + req.body.latitude);
    util.log("    " + req.body.district);
  });
});



module.exports = router;
