/** 
 * COMP3005 Project Server
 * @version 1.0
 * @author Thomas Wood
 * Responsible for handeling and rendering the pages of the fitness app.
**/

const pug = require("pug");
const express = require('express');
const session = require('express-session');
const pgp = require('pg-promise')();
const sqlCreds = require('./!SQLcreds.js');
const db = pgp(sqlCreds);

//Express Setup
let app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "pug");

// Test SQL connection
db.one('SELECT $1 AS message', 'Hello, pg-promise!')
  .then(data => {
    console.log(data.message); // This should print "Hello, pg-promise!"
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Session Setup
app.use(
    session({
        name: 'fitness user',
        secret: "secret key",
        resave: true,
        saveUninitialized: false,
        store: store
    })
);
app.use(function(req, res, next){
    next();
});

// ------------ROUTES------------
// -------GETS
// Home