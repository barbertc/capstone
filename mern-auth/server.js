const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const ffi = require("ffi-napi");

const users = require("./routes/api/users");

const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

// Routes
app.use("/api/users", users);

const rust = ffi.Library('./rust-app/target/release/librust_app', {
  'test_fun': ['int', ['int', 'int']],
  'test_fun_jr': ['string', ['int']],
  'account_balance': ['string', ['string']],
  'ticker': ['string', ['string']],
  'mk_buy': ['string', ['string', 'string', 'string']],
  'mk_sell': ['string', ['string', 'string', 'string']],
  'limit_sell': ['string', ['string', 'string', 'string', 'string']]
})

app.get('/api/rust-functions/account-balance', (req, res) => {
  const accBalance = rust.account_balance('./creds-caleb.json')
  res.send(JSON.parse(accBalance))
})

app.get('/api/rust-functions/ticker', (req, res) => {
  const ticky = rust.ticker('BTCUSD')
  res.send(JSON.parse(ticky))
})

app.get('/api/rust-functions/buy', (req, res) => {
  const buy = rust.mk_buy('./creds-zaddydaddy.json', '0.001', 'ETHUSD')
  console.log(buy)
  res.send(JSON.parse(buy))
})

app.get('/api/rust-functions/sell', (req, res) => {
  const sell = rust.mk_sell('./creds-zaddydaddy.json', '0.001', 'ETHUSD')
  console.log(sell)
  res.send(JSON.parse(sell))
})

// app.get('/api/rust-functions/limit-sell', (req, res) => {
//   const limitSell = rust.limit_sell('creds', 'vol', 'par', 'coin')
// })

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server up and running on port ${port} !`));
