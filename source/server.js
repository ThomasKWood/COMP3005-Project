/** 
 * COMP3005 Project Server
 * @version 1.0
 * @author Thomas Wood
 * Responsible for handeling and rendering the pages of the fitness app.
**/

// TODO: Add routine table that is accoiated with some exercises


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
  cookie: { maxAge: 30 * 60 * 1000 }, // 30 minutes
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

// Functions
function isAuthenticated (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}
// SQL Getters
async function getUsers() {
  return await db.any('SELECT id, email, fname, lname, joinDate FROM public.user');
}

async function getTickets() {
  return await db.any('SELECT id, subject, description FROM ticket');
}

async function getTransactions() {
  return await db.any('SELECT t.id AS transaction_id, u.fname AS first_name, u.lname AS last_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM public.transaction t JOIN public.user u ON t.uid = u.id');
}

async function getUserTransactions(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.any('SELECT t.id AS transaction_id, CONCAT(u.fname, \' \', u.lname) AS full_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM public.transaction t JOIN public.user u ON t.uid = u.id WHERE u.id = $1', [userID]);
  } else if (typeof value === 'string') {
    // email lookup
    return await db.any('SELECT t.id AS transaction_id, CONCAT(u.fname, \' \', u.lname) AS full_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM public.transaction t JOIN public.user u ON t.uid = u.id WHERE u.email = \'$1\'', [userID]);
  } else {
    console.log('got a bad parameter for getUserTransactions()');
    return null;
  }
}

// get user by id or email
async function getUser(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.oneOrNone('SELECT * FROM public.user WHERE id = $1', [userID]);
  } else if (typeof value === 'string') {
    // email lookup
    return await db.oneOrNone('SELECT * FROM public.user WHERE email = \'$1\'', [userID]);
  }
}
// get user payment by id or email
async function getUserPayment(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.oneOrNone('SELECT * FROM public.payment WHERE uid = $1', [userID]);
  } else if (typeof value === 'string') {
    // email lookup
    return await db.oneOrNone('SELECT * FROM public.payment WHERE uid = \'$1\'', [userID]);
  }
}

async function getUpcomingEvents() {
  return await db.any('SELECT * FROM public.event WHERE "when" >= NOW() ORDER BY "when" ASC');
}

async function getPastEvents() {
  return await db.any('SELECT * FROM public.event WHERE "when" < NOW() ORDER BY "when" DESC');
}

async function getEventRSVP(eventID) { 
  // SELECT CONCAT(u.fname, ' ', u.lname) AS full_name, u.email
  // FROM rsvpactivities AS ra
  // JOIN public.user AS u ON ra.uid = u.id
  // WHERE ra.aid = 1;
  return await db.any('SELECT CONCAT(u.fname, \' \', u.lname) AS full_name, u.email FROM rsvpactivities AS ra JOIN public.user AS u ON ra.uid = u.id WHERE ra.aid = $1', [eventID]);
}

async function getAllExercises() {
  return await db.any('SELECT * FROM exercise');
}

async function getAddedExercises(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.any('SELECT e.id AS exercise_id, e.name, e.info, e.link FROM exercise AS e JOIN exerciseadded AS ea ON e.id = ea.eid JOIN public.user AS u ON ea.uid = u.id WHERE u.id = $1', [userID]);

    // SELECT e.id AS exercise_id, e.name, e.info, e.link
    // FROM exercise AS e
    // JOIN exerciseadded AS ea ON e.id = ea.eid
    // JOIN public.user AS u ON ea.uid = u.id
    // WHERE u.email = 'user1@example.com';
  } else if (typeof value === 'string') {
    // email lookup
    return await db.any('SELECT e.id AS exercise_id, e.name, e.info, e.link FROM exercise AS e JOIN exerciseadded AS ea ON e.id = ea.eid JOIN public.user AS u ON ea.uid = u.id WHERE u.email = \'$1\'', [userID]);
  } else {
    console.log('got a bad parameter for getAddedExercises()');
    return null;
  }
}

// SQL Setters
async function addEvent(info) {
  // convert info into object
  let event = JSON.parse(info);

  // json format
  // {name: "event1", info: "this event is cool", when: "2020-12-12 12:00:00"}
  
  // insert into db
  let query = 'INSERT INTO public.event(name, info, "when") VALUES($1, $2, CAST(\'$3\' AS DATE))';
}


// ------------ROUTES------------
// -------GETS
// Home
app.get(['/', '/home'], async function (req, res) {
  // for html
  let rawRequest = req.headers.accept;
  let requestSplit = rawRequest.split(",");
  let request = requestSplit[0];
  console.log("get /home ("+request+")");
  console.log(req.session);

  res.status(200);
  res.setHeader("Content-Type", "text/html");
  if (req.session.user && !req.session.admin) {
      res.send(pug.renderFile("./views/pages/home.pug", {loggedin: true}));
  } else if (!req.session.admin) {
      res.send(pug.renderFile("./views/pages/home.pug", {loggedin: false}));
  } else if (req.session.user && req.session.admin) {
      let users = await getUsers();
      res.send(pug.renderFile("./views/pages/adminDashboard.pug", {loggedin: true, admin: true}));
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
// LOGOUT
app.get('/logout', function (req, res, next) {
  // logout logic

  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.user = null
  req.session.admin = false
  req.session.loggedin = false
  req.session.save(function (err) {
    if (err) next(err)

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err)
      res.redirect('/')
    })
  })
})

// process data requests
app.get(['/users', '/tickets', '/billing', '/events', '/exercises'], async function (req, res) {
  if (req.url ===  '/users') {
    let users = await getUsers();
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(users));
  } else if (req.url === '/tickets') {
    let tickets = await getTickets();
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(tickets));
  } else if (req.url === '/billing') {
    let transactions = await getTransactions();
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(transactions));
  } else if (req.url === '/events') {
    let upcomingEvents = await getUpcomingEvents();
    let pastEvents = await getPastEvents();
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({upcoming: upcomingEvents, past: pastEvents}));
  } else if (req.url === '/exercises') {
    let exercises = await getAllExercises();
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exercises));
  }
});

// process data requests with parameter
app.get(['/user/:id', '/payment/:id', '/event/:id', '/userexercises/:id', '/usertransactions/:id'], async function (req, res) {
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
  }

  // Determine the route based on the URL
  if (req.originalUrl.includes('/user/')) {
    let user = await getUser(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(user));
  } else if (req.originalUrl.includes('/payment/')) {
    let payMethod = await getUserPayment(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(payMethod));
  } else if (req.originalUrl.includes('/event/')) {
    let eventAttendes = await getEventRSVP(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(eventAttendes));
  } else if (req.originalUrl.includes('/userexercises/')) {
    let addedExercises = await getAddedExercises(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(addedExercises));
  } else if (req.originalUrl.includes('/usertransactions/')) {
    let usertransactions = await getUserTransactions(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(usertransactions));
  } else {
    console.log("got a bad request for a parameterized route");
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

        if (user.disabled) {
          response = true;
          res.status(402).json({ message: 'User is disabled' });
          return;
        }

        // Authentication successful
        response = true;
        res.status(200).json({ message: 'Authentication successful' });
        req.session.loggedin = true;
        req.session.user = user.email;
        req.session.admin = user.admin;

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