"use strict";

const router = require('express').Router();
const passport = require('passport');
var User = require('../models/user.js');
var passportConfig = require('../config/passport');

router.get('/signup', function(req, res) {
  res.render('accounts/signup', { errors: req.flash('errors') });
});

router.post('/signup', function(req, res, next) {
  var user = new User();
  user.email = req.body.email;
  user.password = req.body.password;
  user.type = req.body.type;
  user.profile.name = req.body.name;
  user.profile.picture = user.gravatar();

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', "Account already existed")
      return res.redirect('/signup');
    } else {
      user.save(function(err, user) {
        if (err) return next(err);
        req.logIn(user, function(err) {
          if (err) return next(err);
          res.redirect('/profile');
        });
      });
    }
  });
});

router.get('/login', function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('accounts/login', { message: req.flash('loginMessage')});
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/profile', passportConfig.isAuthenticated, function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    if (err) return next(err);
    res.render('accounts/profile', { user: user});
});
});

router.get('/edit-profile', passportConfig.isAuthenticated, function(req, res, next) {
  res.render('accounts/edit-profile', {message: req.flash('message')});
});

router.post('/edit-profile', function(req, res, next) {
  User.findById(req.user._id, function(err, user) {
    if (err) return next(err);
    if (req.body.name) user.profile.name = req.body.name;
    if (req.body.address) user.profile.address = req.body.address;
    if (req.body.picture) user.profile.picture = req.body.picture;
    user.save(function(err) {
      if (err) return next(err);
      req.flash('message', 'Profile successfully edited');
      return res.redirect('/edit-profile');
    });
  });
});

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
