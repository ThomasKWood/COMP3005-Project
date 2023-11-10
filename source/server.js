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
const { as } = require("pg-promise");
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
  return await db.any('SELECT id, email, fname, lname, admin, joinDate, points, disabled FROM public.user');
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
    return await db.any('SELECT t.id AS transaction_id, CONCAT(u.fname, \' \', u.lname) AS full_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM public.transaction t JOIN public.user u ON t.uid = u.id WHERE u.email = $1', [userID]);
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
    return await db.oneOrNone('SELECT * FROM public.user WHERE email = $1', [userID]);
  }
}
// get user payment by id or email
async function getUserPayment(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.oneOrNone('SELECT * FROM public.payment WHERE uid = $1', [userID]);
  } else if (typeof value === 'string') {
    // email lookup
    return await db.oneOrNone('SELECT * FROM public.payment WHERE uid = $1', [userID]);
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

async function getRSVPevents(userID) {
  // SELECT aid
  // FROM rsvpactivities
  // WHERE uid = $1
  return await db.any('SELECT aid FROM rsvpactivities WHERE uid = $1', [userID]);
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
    return await db.any('SELECT e.id AS exercise_id, e.name, e.info, e.link FROM exercise AS e JOIN exerciseadded AS ea ON e.id = ea.eid JOIN public.user AS u ON ea.uid = u.id WHERE u.email = $1', [userID]);
  } else {
    console.log('got a bad parameter for getAddedExercises()');
    return null;
  }
}

async function getEmailExists(email) {
  // check if email exists
  let result = await db.oneOrNone('SELECT * FROM public.user WHERE email = $1', [email]);

  if (result) {
    return true;
  } else {
    return false;
  }
}

// SQL Setters
async function addEvent(info) {
  // convert info into object
  let event = JSON.parse(info);

  // json format
  // {name: "event1", info: "this event is cool", when: "2020-12-12 12:00:00"}
  
  // insert into db
  let query = 'INSERT INTO public.event(name, info, \"when\") VALUES($1, $2, CAST($3 AS DATE))';
  await db.none(query, [event.name, event.info, event.when]).then(() => {
    console.log('Data inserted successfully');
    return true;
  })
  .catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addNewExercise(info) {
  // convert info into object
  let exercise = JSON.parse(info);

  // json format
  // {name: "exercise1", info: {stpes: ["step1", "step2", "step3"], muscles: ["back", "shoulders"]}, link: "http://linktogifofexercise.com"}

  // insert into db
  let query = 'INSERT INTO public.exercise(name, info, link) VALUES($1, $2, $3)';
  await db.none(query, [exercise.name, exercise.info, exercise.link]).then(() => {
    console.log('Data inserted successfully');
    return true;
  })
  .catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addExerciseToUser(info, userID) {
  // convert info into object
  let exercise = JSON.parse(info);

  // json format
  // {exercise: 2, user: 1}

  // insert into db
  let query = 'INSERT INTO public.exerciseadded(eid, uid) VALUES($1, $2)';
  await db.none(query, [exercise.exercise, userID]).then(() => {
    console.log('Data inserted successfully');
    return true;
  })
  .catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addTransaction(info) {
  // convert info into object
  let transaction = JSON.parse(info);

  // json format
  // {uid: 1, date: "2023-12-25", type: "Subscription Renewal", amount: 100, points: 100}
  let query = 'INSERT INTO public.transaction(uid, date, type, amount, points) VALUES($1, CAST($2 AS DATE), $3, $4, $5)';
  await db.none(query, [transaction.uid, transaction.date, transaction.type, transaction.amount, transaction.points]).then(() => {
    console.log('Data inserted successfully');
    return true;
  }).catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addTicket(info) {
  // convert info into object
  let ticket = JSON.parse(info);

  // json format
  // {subject: "Treadmil 5 INOP", description: "Machine has power but motor does not move belt."}

  // insert into db
  let query = 'INSERT INTO public.ticket(subject, description) VALUES($1, $2)';
  await db.none(query, [ticket.subject, ticket.description]).then(() => {
    console.log('Data inserted successfully');
    return true;
  }).catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addActivity(info) {
  // convert info into object
  let activity = JSON.parse(info);

  // json format
  // {name: "Yoga Class", info: "this activity is cool", when: "2020-12-24 12:00:00"}

  // insert into db
  let query = 'INSERT INTO public.activity(name, info, \"when\") VALUES($1, $2, CAST($3 AS DATE))';
  await db.none(query, [activity.name, activity.info, activity.when]).then(() => {
    console.log('Data inserted successfully');
    return true;
  }).catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addRSVP(info) {
  // convert info into object
  let rsvp = JSON.parse(info);

  // json format
  // {aid: 1, uid: 1}

  // insert into db
  let query = 'INSERT INTO public.rsvpactivities(aid, uid) VALUES($1, $2)';
  await db.none(query, [rsvp.aid, rsvp.uid]).then(() => {
    console.log('Data inserted successfully');
    return true;
  }).catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addPayment(info, userID) {
  // convert info into object
  let payment = JSON.parse(info);

  // json format
  // {uid: 1, type: "Visa", number: "123456789", expiryYear: 2023, expiryMonth: 12, cvc: 123, name: "John Smith"}

  // check if payment already exists
  let result = await db.oneOrNone('SELECT * FROM public.payment WHERE uid = $1', [userID]);

  let curDate = new Date();
  let curYear = curDate.getFullYear();
  let curMonth = curDate.getMonth() + 1;
  let expiryYear = parseInt(payment.expiryYear);
  let expiryMonth = parseInt(payment.expiryMonth);
  

  let acceptUpdate = false
  if (result !== null) {
    // check if payment is expired
    if (curYear > expiryYear) {
      acceptUpdate = true;
    } else if (curYear <= expiryYear) {
      if (curMonth > expiryMonth) {
        acceptUpdate = true;
      }
    }

    if (acceptUpdate) {
      // update payment
      let query = 'UPDATE public.payment SET type = $1, number = $2, expiryYear = $3, expiryMonth = $4, cvc = $5, name = $6 WHERE uid = $7';
      await db.none(query, [payment.type, payment.number, payment.expiryYear, payment.expiryMonth, payment.cvc, payment.name, userID]).then(() => {
        console.log('Payment updated successfully');
        return true;
      }).catch(error => {
        console.log('Error updating payment data: ', error);
        return false;
      });
    } else {
      // payment is not expired
      console.log('Payment is not expired. Cannot update payment.');
      return false;
    }
  } else {
    // no payment exists
    // check card is not expired first
    if (curYear > expiryYear) {
      acceptUpdate = true;
    } else if (curYear <= expiryYear) {
      if (curMonth > expiryMonth) {
        acceptUpdate = true;
      }
    }

    if (acceptUpdate) {
      // update payment
      let query = 'INSERT INTO public.payment(uid, type, number, expiryYear, expiryMonth, cvc, name) VALUES($1, $2, $3, $4, $5, $6, $7)';
      await db.none(query, [userID, payment.type, payment.number, payment.expiryYear, payment.expiryMonth, payment.cvc, payment.name]).then(() => {
        console.log('Payment updated successfully');
        return true;
      }).catch(error => {
        console.log('Error updating payment data: ', error);
        return false;
      });
    } else {
      // payment is not expired
      console.log('Payment is not expired. Cannot update payment.');
      return false;
    }
  }
}

async function addUser(info) {
  // object format
  // {email: 'thomaswood4@cmail.carleton.ca', fname: 'Thomas', lname: 'Wood', password: 'password', admin: false}
  
  // insert into db
  let result = false;
  let query = 'INSERT INTO public.user(fname, lname, email, password, admin) VALUES($1, $2, $3, $4, $5)';
  await db.none(query, [info.fname, info.lname, info.email, info.password, info.admin]).then(() => {
    console.log('Data inserted successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
  return result;
}

// updaters
async function updateLastdone(info, userID) {
  // convert info into object
  let exercise = JSON.parse(info);

  // json format
  // {exercise: 2, user: 1, lastDone: "2020-12-12 12:00:00"}

  let query = 'UPDATE public.exerciseadded SET lastdone = CAST($1 AS DATE) WHERE eid = $2 AND uid = $3';
  await db.none(query, [exercise.lastDone, exercise.exercise, userID]).then(() => {
    console.log('Data updated successfully');
    return true;
  })
  .catch(error => {
    console.log('Error updating data: ', error);
    return false;
  });
}

async function payTransaction(info, userID) {
  let user = await getUser(userID);
  let dbError = false;

  // convert info into object
  let transaction = JSON.parse(info);
  // json format
  // {id: 1, amount: 100, points: 100, paidbypoints: false}

  // determine if paid by points or money
  if (transaction.paidbypoints) {
    // pay with points
    if (user.points >= transaction.amount) {
      // user has enough points
      // update user points
      let query = 'UPDATE public.user SET points = $1 WHERE id = $2';
      await db.none(query, [(user.points - transaction.amount) + transaction.points, userID]).then(() => {
        console.log('User points updated successfully');
        return true;
      })
      .catch(error => {
        console.log('Error updating User points: ', error);
        dbError = true;
        return false;
      });
      if (dbError) {
        return 0;
      }
      // update transaction
      let query2 = 'UPDATE public.transaction SET paid = true WHERE id = $1';
      await db.none(query2, [transaction.id]).then(() => {
        console.log('Transaction updated successfully');
        return true;
      })
      .catch(error => {
        console.log('Error updating Transaction: ', error);
        dbError = true;
        return false;
      });
      if (dbError) {
        return 0;
      }
      return 1;
    } else {
      // user does not have enough points
      return -1;
    }
  } else {
    // pay with money

    // check if payment exists
    let payment = await getUserPayment(userID);

    // check if payment is expired
    let curDate = new Date();
    let curYear = curDate.getFullYear();
    let curMonth = curDate.getMonth() + 1;
    let expiryYear = parseInt(payment.expiryYear);
    let expiryMonth = parseInt(payment.expiryMonth);

    if (curYear > expiryYear) {
      // payment is expired
      return -2;
    } else if (curYear <= expiryYear) {
      if (curMonth > expiryMonth) {
        // payment is expired
        return -2;
      }
    }

    // update transaction to paid
    let query = 'UPDATE public.transaction SET paid = true WHERE id = $1';
    await db.none(query, [transaction.id]).then(() => {
      console.log('Transaction updated successfully');
      return true;
    }).catch(error => {
      console.log('Error updating Transaction: ', error);
      dbError = true;
      return false;
    });
    if (dbError) {
      return 0;
    }

    // update user points
    let query2 = 'UPDATE public.user SET points = $1 WHERE id = $2';
    await db.none(query2, [user.points + transaction.points, userID]).then(() => {
      console.log('Transaction updated successfully');
      return true;
    }).catch(error => {
      console.log('Error updating Transaction: ', error);
      dbError = true;
      return false;
    });
    if (dbError) {
      return 0;
    }
    return 1;
  }
}

async function completeTicket(id) {
  // remove ticket from db
  let query = 'DELETE FROM public.ticket WHERE id = $1';
  await db.none(query, [id]).then(() => {
    console.log('Ticket removed successfully');
    return true;
  })
}

async function toggleUser(info) {
  // parse info
  let user = JSON.parse(info);

  // json format
  // {id: 1, disabled: false}

  // update user disabled state
  let query = 'UPDATE public.user SET disabled = $1 WHERE id = $2';
  await db.none(query, [user.disabled, user.id]).then(() => {
    console.log('User disabled state updated successfully');
    return true;
  })
  .catch(error => {
    console.log('Error updating User disabled state: ', error);
    return false;
  });
}

async function changePassword(info) {
  // parse info
  let user = JSON.parse(info);

  // json format
  // {id: 1, password: "password"}

  // update user password
  let query = 'UPDATE public.user SET password = $1 WHERE id = $2';
  await db.none(query, [user.password, user.id]).then(() => {
    console.log('User password updated successfully');
    return true;
  })
  .catch(error => {
    console.log('Error updating User password: ', error);
    return false;
  });

}

async function updateAccount(accountInfo, userID) {
  // update user account info
  let ai = JSON.parse(accountInfo);

  // insert object into db
  let query = 'UPDATE public.user SET accountinfo = $1 WHERE id = $2';
  await db.none(query, [ai, userID]).then(() => {
    console.log('User account info updated successfully');
    return true;
  })
  .catch(error => {
    console.log('Error updating User account info: ', error);
    return false;
  });
}

async function updateGoals(goals, userID) {
  // update user goals
  let g = JSON.parse(goals);

  // insert object into db
  let query = 'UPDATE public.user SET goals = $1 WHERE id = $2';
  await db.none(query, [g, userID]).then(() => {
    console.log('User goals updated successfully');
    return true;
  }
  ).catch(error => {
    console.log('Error updating User goals: ', error);
    return false;
  }
  );
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
      let tickets = await getTickets();
      let transactions = await getTransactions();
      let uEvents = await getUpcomingEvents();
      let pEvents = await getPastEvents();
      res.send(pug.renderFile("./views/pages/adminDashboard.pug", {sessionUser: req.session.userID, users: users, tickets: tickets, transactions: transactions, uEvents: uEvents, pEvents: pEvents}));
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
app.get(['/user/:id', '/payment/:id', '/event/:id', '/userexercises/:id', '/usertransactions/:id', '/userevents/:id'], async function (req, res) {
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
  } else if (req.originalUrl.includes('/userevents/')) {
    let userevents = await getRSVPevents(id);
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(userevents));
  } else {
    console.log("got a bad request for a get parameterized route: " + req.originalUrl);
  }
});

// -------POSTS
// LOGIN RECIEVE
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
        req.session.userID = user.id;

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

app.post('/create-user', express.urlencoded({ extended: false }), async (req, res) => {
  let user = req.body;
  user.admin = req.body.admin ? true : false;

  // check if email exists
  let emailExists = await getEmailExists(user.email);

  if (!emailExists) {
    // create user
    let result = await addUser(user);

    if (result) {
      res.status(200);
      res.setHeader("Content-Type", "text/plain");
      res.send("User added successfully");
      console.log("User added successfully.\n");
    } else {
      res.status(500);
      res.setHeader("Content-Type", "text/plain");
      res.send("Could not create user");
      console.log("Could not create user.\n");
    }
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Email already exists");
    console.log("Could not create user. Email already exists.\n");
  }
});


// Test SQL connection
db.one('SELECT $1 AS message', 'Connected to postgres database!').then(data => {console.log(data.message);}).catch(error => {console.error('Error:', error);});

// Start server
app.listen(3000);
console.log("Server listening at http://localhost:3000");