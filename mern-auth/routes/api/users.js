const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");
const path = require("path");
const fs = require("fs");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const User = require("../../models/User");
const { session } = require("passport");

router.get("/me", (req, res) => {
  console.log(req.user)
  if (req.user) {
    res.status(200).json(req.user)
  } else {
    res.status(204).send('User not found')
  }
})

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation

  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        walletKey: req.body.walletKey,
        walletSecret: req.body.walletSecret
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  console.log('Logging in', req.body.email)
  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name,
          // walletKey: user.walletKey,
          // walletSecret: user.walletSecret
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );

        const fileName = `${user.id}.json`
        const filePath = './creds'
        const fileContents = {
          key: user.walletKey,
          secret: user.walletSecret
        }

        try {
          fs.mkdirSync(filePath, { recursive: true })
          console.log('Testing')
        } catch (err) {
          console.error('Cannot create directory', err)
        }

        const pathy = `./${path.join(filePath, fileName)}`
        fs.writeFile(pathy, JSON.stringify(fileContents), err => {
          if (err) {
            console.log('It broke', err)
          } else {
            console.log('File write success at ', pathy)
          }
        })

        res.cookie('_id', user.id)
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

module.exports = router;
