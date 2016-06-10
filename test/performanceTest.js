"use strict";

const User = require('../models/user.js');
const util = require('util');
const math = require('mathjs');

var totalUsers = 1000;
var messageCount = 0;
var timeStamps = [];
var latencies = [];

exports.generateUser = function(number, type) {
  for (let i = totalUsers; i < number + totalUsers; i++) {
    var user = new User();
    user.email = type + i + "@gmail.com";
    user.password = "123";
    user.type = type;
    user.profile.name = type + i;
    // didn't check if user is already existed in the database
    user.save(function(err, user) {
      if(err) {
        console.log(err);
      } else {
        console.log(type + i + " created!");
      }
    });
  }
};

// ratio = (driver updates) / (driver updates + rider requests)
exports.testBatchPerf = function(number, ratio) {
  for (let i = 0; i < number; i++) {
    var message = generateMessage(ratio);
    if (message.type === "driver") {
      updateDriverLocation(message);
    } else {
      matchRide(message);
    }
  }
};

function generateMessage(ratio) {
  var message = {};
  var randomNum = math.random();
  messageCount += 1;
  message.count = messageCount;
  message.longitude = randomNum;
  message.latitude = 1 - randomNum;
  message.district = Math.round(randomNum / 0.25);
  message.createTime = new Date().getTime();
  if (randomNum < ratio) {
    message.type = "driver";
    message.email = "driver" + Math.round(randomNum * totalUsers) + "@gmail.com";
  } else {
    message.type = "rider";
    message.email = "rider" + Math.round(randomNum * totalUsers) + "@gmail.com";
  }
  return message;
};

function updateDriverLocation(message) {
  User.findOne({type: "driver", email: message.email}, function(err, driver) {
    if (err) return next(err);
    driver.location.longitude = message.longitude;
    driver.location.latitude = message.latitude;
    driver.district = message.district;
    driver.save(function(err) {
      if (err) {
        return next(err);
      } else {
        //util.log("message" + message.count + ": driver location updated!");
        var finishTime = new Date().getTime();
        // timeStamps.push(finishTime);
        latencies.push(finishTime - message.createTime);
        if (message.count === messageCount) {
          // for (let i = 0; i < timeStamps.length; i++) {
          //   console.log(timeStamps[i]);
          // }
          for (let i = 0; i < latencies.length; i++) {
            console.log(latencies[i]);
          }
        }
      }
    });
  });
};

function matchRide(message) {
  User.find({type: 'driver', district: message.district}, function(err, drivers) {
    if (drivers.length == 0) {
      User.find({type: 'driver'}, function(err, drivers) {
        findClosestDriver(message, drivers);
      });
    } else {
      findClosestDriver(message, drivers);
    }
  });
};

function findClosestDriver(message, drivers) {
  var minDist = Number.MAX_VALUE;
  var nearestDriver = null;
  drivers.forEach(function(driver) {
    var dist = math.sqrt(math.pow(message.latitude - driver.location.latitude, 2)
    + math.pow(message.longitude - driver.location.longitude, 2));
    if (dist < minDist) {
      minDist = dist;
      nearestDriver = driver;
      //console.log("message" + message.count + ": nearest Driver updated");
    }
  });
  //util.log("message" + message.count + ": rider request matched!");
  var finishTime = new Date().getTime();
  // timeStamps.push(finishTime);
  latencies.push(finishTime - message.createTime);
  if (message.count === messageCount) {
    // for (let i = 0; i < timeStamps.length; i++) {
    //   console.log(timeStamps[i]);
    // }
    for (let i = 0; i < latencies.length; i++) {
      console.log(latencies[i]);
    }
  }
};

exports.initDriverLocation = function() {
  User.find({type: 'driver'}, function(err, drivers) {
    drivers.forEach(function(driver) {
      var randomNum = math.random();
      driver.location.longitude = randomNum;
      driver.location.latitude = 1 - randomNum;
      driver.save(function(err) {
        if (err) {
          return next(err);
        } else {
          console.log(driver.profile.name + " locations initialied!");
        }
      });
    });
  });
};
