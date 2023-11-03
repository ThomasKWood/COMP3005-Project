/** 
 * COMP3005 Project Server
 * @version 1.0
 * @author Thomas Wood
 * Responsible for handeling and rendering the pages of the fitness app.
**/

var pug = require("pug");
var express = require('express')
var session = require('express-session')
var pgp = require('pg-promise')();
const sqlCreds = require('./!SQLcreds.js');
var db = pgp(sqlCreds);
var pgSession = require('connect-pg-simple')(session);

var app = express()

// //Express Setup
// const app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "pug");

// // Session Setup
const conString = `postgres://${sqlCreds.user}:${sqlCreds.password}@${sqlCreds.host}:${sqlCreds.port}/${sqlCreds.database}`;
const pgStore = new pgSession({
  pgPromise: db, // Use the pg-promise library
  conString: conString,
  tableName: 'user_sessions'
});

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: pgStore,

}))


// app.use(
//     session({
//         name: 'session',
//         keys: ['key1', 'key2'],
//         secret: "secret-key",
//         resave: true,
//         saveUninitialized: false,
//         store: pgStore,
//         cookie: {
//           maxAge: 1800000 // 30 mins
//           //secure: false
//       }
//     })
// );
// app.use(function(req, res, next){
//     next();
// });


function isAuthenticated (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}


// ------------ROUTES------------
// -------GETS
// Home
app.get(['/', '/home'], function (req, res) {
  // for html
  let rawRequest = req.headers.accept;
  let requestSplit = rawRequest.split(",");
  let request = requestSplit[0];
  console.log("get /home ("+request+")");
  console.log(req.session);

  res.status(200);
  res.setHeader("Content-Type", "text/html");
  if (req.session.user) {
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
  if (req.session.user) {
      res.send(pug.renderFile("./views/pages/loginError.pug"));
  } else {
      res.send(pug.renderFile("./views/pages/login.pug", {loggedin: false}));
  }
});




// -------POSTS
// LOGIN RECIEVE
// app.post('/login', express.urlencoded({ extended: false }), function (req, res) {
// // app.post('/login', (req, res) => {
//   console.log("\nrecieving a login...");
//   reqObject = req['headers'];
//   let request = reqObject['content-type'];
//   console.log("    content type: "+request);

//   // is format json?
//   if (request === "application/json") {
//     req.session.regenerate(function (err) {
//       if (err) next(err)
//       // fromat is json
//       let username = req.body.username;
//       let password = req.body.password;

//       try {
//         let user = await db.oneOrNone('SELECT * FROM public.user WHERE email = $1', [username]);
//         // const user = db.oneOrNone('SELECT * FROM public.user WHERE email = $1', [username]);

//         if (!user) {
//           res.status(401).json({ message: 'User not found' });
//           return;
//         }

//         if (user.password !== password) {
//           res.status(401).json({ message: 'Incorrect password' });
//           return;
//         }

//         // Authentication successful
//         res.status(200).json({ message: 'Authentication successful' });
//         req.session.loggedin = true;
//         req.session.user = user.email;
//         req.session.save(function (err) {
//           if (err) return next(err)
//           res.redirect('/')
//         })
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     })

//   // format is not json 
//   } else {
//       res.status(500);
//       res.setHeader("Content-Type", "text/plain");
//       res.send("server only accepts json");
//       console.log("    could not verify user login. incorrect format.\n");
//   }
// });
app.post('/login', express.urlencoded({ extended: false }), async (req, res) => {
  console.log("\nreceiving a login...");
  reqObject = req['headers'];
  let request = reqObject['content-type'];
  console.log("    content type: " + request);

  let response = false;
  // is format json?
  if (request === "application/json") {
    try {
      await new Promise((resolve, reject) => {
        req.session.regenerate(async function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Format is JSON
      let username = req.body.username;
      let password = req.body.password;

      try {
        let user = await db.oneOrNone('SELECT * FROM public.user WHERE email = $1', [username]);

        if (!user) {
          response = true;
          res.status(401).json({ message: 'User not found' });
          return;
        }

        if (user.password !== password) {
          response = true;
          res.status(401).json({ message: 'Incorrect password' });
          return;
        }

        // Authentication successful
        response = true;
        res.status(200).json({ message: 'Authentication successful' });
        req.session.loggedin = true;
        req.session.user = user.email;

        await new Promise((resolve, reject) => {
          req.session.save(async function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });

        res.redirect('/');
      } catch (error) {
        if (!response) {
          res.status(500).json({ message: 'Internal Server Error' });
        }
        console.error(error);
      }
    } catch (error) {
      console.error(error);
      if (!response) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }

  // Format is not JSON 
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Server only accepts JSON");
    console.log("    could not verify user login. Incorrect format.\n");
  }
});




// Test SQL connection
db.one('SELECT $1 AS message', 'Connected to postgres database!').then(data => {console.log(data.message);}).catch(error => {console.error('Error:', error);});

// Start server
app.listen(3000);
console.log("Server listening at http://localhost:3000");