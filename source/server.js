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

// Session Setup
app.use(
    session({
        name: 'fitness user',
        secret: "secret key",
        resave: true,
        saveUninitialized: false,
        // store: store
    })
);
app.use(function(req, res, next){
    next();
});

// ------------ROUTES------------
// -------GETS
// Home
app.get(['/', '/home'], (req, res) => {
  // for html
  let rawRequest = req.headers.accept;
  let requestSplit = rawRequest.split(",");
  let request = requestSplit[0];
  console.log("get /home ("+request+")");

res.status(200);
res.setHeader("Content-Type", "text/html");
  if (req.session.loggedin) {
      res.send(pug.renderFile("./views/pages/home.pug", {loggedin: true}));
  } else {
      res.send(pug.renderFile("./views/pages/home.pug", {loggedin: false}));
  }
});
// LOGIN
app.get('/login', (req, res) => {
  // for html
  let rawRequest = req.headers.accept;
  let requestSplit = rawRequest.split(",");
  let request = requestSplit[0];
  console.log("get /login ("+request+")");

res.status(200);
res.setHeader("Content-Type", "text/html");
  if (req.session.loggedin) {
      res.send(pug.renderFile("./views/pages/loginError.pug"));
  } else {
      res.send(pug.renderFile("./views/pages/login.pug", {loggedin: false}));
  }
});




// -------POSTS
// LOGIN RECIEVE
app.post('/login', async (req, res) => {
  console.log("\nrecieving a login...");
  reqObject = req['headers'];
  let request = reqObject['content-type'];
  console.log("    content type: "+request);

  // is format json?
  if (request === "application/json") {
      // fromat is json
      let found = false; // boolean that stores if we found a user based of client request username
      let username = req.body.username;
      let password = req.body.password;
      
        try {
          const user = await db.oneOrNone('SELECT * FROM public.user WHERE username = $1', [username]);
      
          if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
          }
      
          if (user.password !== password) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
          }
      
          // Authentication successful
          res.status(200).json({ message: 'Authentication successful' });
          req.session.loggedin = true;
          req.session.username = req.body.username;
          req.session.maxAge = 1800000;  
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal Server Error' });
        }
      
  // format is not json 
  } else {
      res.status(500);
      res.setHeader("Content-Type", "text/plain");
      res.send("server only accepts json");
      console.log("    could not verify user login. incorrect format.\n");
  }
});




// Test SQL connection
db.one('SELECT $1 AS message', 'Connected to postgres database!')
  .then(data => {
    console.log(data.message);
    app.listen(3000);
    console.log("Server listening at http://localhost:3000");

    process.stdin.setRawMode(true);
    process.stdin.resume();

    console.log('Press Enter to stop the server.');

    process.stdin.on('data', function (data) {
      const input = data.toString().trim();
      if (input === '') {
        console.log('Server stop.');
        process.exit(0);
      }
    });

  })
  .catch(error => {
    console.error('Error:', error);
  });

