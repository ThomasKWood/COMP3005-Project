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
  return await db.any('SELECT id, email, fname, lname, admin, joinDate, points, disabled FROM fitness_user');
}

async function getTickets() {
  return await db.any('SELECT id, subject, description FROM ticket');
}

async function getTransactions() {
  return await db.any('SELECT t.id AS transaction_id, u.fname AS first_name, u.lname AS last_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM user_transaction t JOIN fitness_user u ON t.uid = u.id');
}

async function getUserTransactions(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.any('SELECT t.id AS transaction_id, CONCAT(u.fname, \' \', u.lname) AS full_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM user_transaction t JOIN fitness_user u ON t.uid = u.id WHERE u.id = $1', [userID]);
  } else if (typeof userID === 'string') {
    // email lookup
    return await db.any('SELECT t.id AS transaction_id, CONCAT(u.fname, \' \', u.lname) AS full_name, u.email as email, t.date, t.type, t.amount, t.points, t.paidbypoints, t.paid FROM user_transaction t JOIN fitness_user u ON t.uid = u.id WHERE u.email = $1', [userID]);
  } else {
    console.log('got a bad parameter for getUserTransactions()');
    return null;
  }
}

// get user by id or email
async function getUser(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.oneOrNone('SELECT * FROM fitness_user WHERE id = $1', [userID]);
  } else if (typeof userID === 'string') {
    // email lookup
    return await db.oneOrNone('SELECT * FROM fitness_user WHERE email = $1', [userID]);
  }
}
// get user payment by id or email
async function getUserPayment(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.oneOrNone('SELECT * FROM payment WHERE uid = $1', [userID]);
  } else if (typeof userID === 'string') {
    // email lookup
    return await db.oneOrNone('SELECT * FROM payment WHERE email = $1', [userID]);
  }
}

async function getUpcomingEvents() {
  return await db.any('SELECT * FROM fitness_event WHERE "when" >= NOW() ORDER BY "when" ASC');
}

async function getPastEvents() {
  return await db.any('SELECT * FROM fitness_event WHERE "when" < NOW() ORDER BY "when" DESC');
}

async function getEventRSVP(eventID) { 
  // SELECT CONCAT(u.fname, ' ', u.lname) AS full_name, u.email
  // FROM rsvpactivities AS ra
  // JOIN user AS u ON ra.uid = u.id
  // WHERE ra.aid = 1;
  return await db.any('SELECT CONCAT(u.fname, \' \', u.lname) AS full_name, u.email FROM rsvpactivities AS ra JOIN fitness_user AS u ON ra.uid = u.id WHERE ra.aid = $1', [eventID]);
}

async function getRSVPevents(userID) {
  // SELECT aid
  // FROM rsvpactivities
  // WHERE uid = $1
  return await db.any('SELECT aid FROM rsvpactivities WHERE uid = $1', [userID]);
}

// Get exercise by ID
async function getExercise(id) {
  return await db.oneOrNone('SELECT * FROM exercise WHERE id = $1', [id]);
}

// Get exercises not added by user
async function getExercisesNotAdded(userID) {
  if (typeof userID === 'number' && Number.isInteger(userID)) {
    // id lookup
    return await db.any('SELECT id, name FROM exercise WHERE id NOT IN (SELECT eid FROM exerciseadded WHERE uid = $1)', [userID]);
  } else if (typeof value === 'string') {
    // email lookup
    return await db.any('SELECT id, name FROM exercise WHERE id NOT IN (SELECT eid FROM exerciseadded WHERE uid = (SELECT id FROM fitness_user WHERE email = \'$1\'))', [userID]);
  } else {
    console.log('got a bad parameter for getExercisesNotAdded()');
    return null;
  }
}

// Get exercises added by user
async function getExercisesAdded(userID) {
  return await db.any('SELECT e.id, e.name, ea.lastdone FROM exercise e JOIN exerciseadded ea ON e.id = ea.eid WHERE ea.uid = $1', [userID]);
}

async function getEmailExists(email) {
  // check if email exists
  let result = await db.oneOrNone('SELECT * FROM fitness_user WHERE email = $1', [email]);

  if (result) {
    return true;
  } else {
    return false;
  }
}

// SQL Setters
async function addEvent(event) {
  // {name: "event1", info: "this event is cool", when: "2020-12-12 12:00:00"}
  
  // insert into db
  let result = false;
  let query = 'INSERT INTO fitness_event(name, info, \"when\") VALUES($1, $2, CAST($3 AS DATE))';
  await db.none(query, [event.name, event.info, event.when]).then(() => {
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

async function addNewExercise(info) {
  // convert info into object
  let exercise = JSON.parse(info);

  // json format
  // {name: "exercise1", info: {stpes: ["step1", "step2", "step3"], muscles: ["back", "shoulders"]}, link: "http://linktogifofexercise.com"}

  // insert into db
  let query = 'INSERT INTO exercise(name, info, link) VALUES($1, $2, $3)';
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
  // {eid: 2}

  // insert into db
  let query = 'INSERT INTO exerciseadded(eid, uid) VALUES($1, $2)';
  let result = false;
  await db.none(query, [info.eid, userID]).then(() => {
    console.log('Exercise added successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error inserting exercise added: ', error);
    return false;
  });
  return result;
}

async function addTransaction(info) {
  let result = false;
  // json format
  // {uid: 1, date: "2023-12-25", type: "Subscription Renewal", amount: 100, points: 100}
  let query = 'INSERT INTO user_transaction(uid, date, type, amount, points) VALUES($1, CAST($2 AS DATE), $3, $4, $5)';
  await db.none(query, [info.uid, info.date, info.type, info.amount, info.amount]).then(() => {
    console.log('Transaction inserted successfully');
    result = true;
    return true;
  }).catch(error => {
    console.log('Error inserting Transaction: ', error);
    return false;
  });
  return result;
}

async function addTicket(info) {
  // {subject: "Treadmil 5 INOP", description: "Machine has power but motor does not move belt."}

  // insert into db
  let result = false;
  let query = 'INSERT INTO ticket(subject, description) VALUES($1, $2)';
  await db.none(query, [info.subject, info.description]).then(() => {
    console.log('Ticket inserted successfully');
    result = true;
    return true;
  }).catch(error => {
    console.log('Error inserting Ticket: ', error);
    return false;
  });
  return result;
}

async function addActivity(info) {
  // convert info into object
  let activity = JSON.parse(info);

  // json format
  // {name: "Yoga Class", info: "this activity is cool", when: "2020-12-24 12:00:00"}

  // insert into db
  let query = 'INSERT INTO activity(name, info, \"when\") VALUES($1, $2, CAST($3 AS DATE))';
  await db.none(query, [activity.name, activity.info, activity.when]).then(() => {
    console.log('Data inserted successfully');
    return true;
  }).catch(error => {
    console.log('Error inserting data: ', error);
    return false;
  });
}

async function addRSVP(uid, aid, status) {
  // json format
  // {aid: 1, uid: 1}
  let result = false;
  if (status) {
    // insert into db
    let query = 'INSERT INTO rsvpactivities(aid, uid) VALUES($1, $2)';
    await db.none(query, [aid, uid]).then(() => {
      result = true;
      console.log('RSVP added successfully');
      return true;
    }).catch(error => {
      console.log('Error inserting RSVP: ', error);
      return false;
    });
  } else {
    // remove from db
    let query = 'DELETE FROM rsvpactivities WHERE aid = $1 AND uid = $2';
    await db.none(query, [aid, uid]).then(() => {
      console.log('RSVP removed successfully');
      result = true;
      return true;
    }).catch(error => {
      console.log('Error removing RSVP: ', error);
      return false;
    });
  }
  return result;
}

async function addPayment(info, userID) {
  // convert info into object
  let payment = JSON.parse(info);

  // json format
  // {uid: 1, type: "Visa", number: "123456789", expiryYear: 2023, expiryMonth: 12, cvc: 123, name: "John Smith"}

  // check if payment already exists
  let result = await db.oneOrNone('SELECT * FROM payment WHERE uid = $1', [userID]);

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
      let query = 'UPDATE payment SET type = $1, number = $2, expiryYear = $3, expiryMonth = $4, cvc = $5, name = $6 WHERE uid = $7';
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
      let query = 'INSERT INTO payment(uid, type, number, expiryYear, expiryMonth, cvc, name) VALUES($1, $2, $3, $4, $5, $6, $7)';
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
  let query = 'INSERT INTO fitness_user(fname, lname, email, password, admin) VALUES($1, $2, $3, $4, $5)';
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
  // {exercise: 2, user: 1, lastDone: "2020-12-12 12:00:00"}

  let query = 'UPDATE exerciseadded SET lastdone = CAST($1 AS DATE) WHERE eid = $2 AND uid = $3';
  let result = false;
  await db.none(query, [new Date(), info.eid, userID]).then(() => {
    console.log('Exercise: Last done updated successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error updating exercise: last done: ', error);
    return false;
  });
  return result;
}

async function payTransaction(info, userID) {
  // get transaction
  let transaction = await db.oneOrNone('SELECT * FROM user_transaction WHERE id = $1', [info.id]);

  let user = await getUser(userID);
  let dbError = false;

  // determine if paid by points or money
  if (info.paidbypoints) {
    // pay with points
    if (user.points >= transaction.amount) {
      // user has enough points
      // update user points
      let query = 'UPDATE fitness_user SET points = $1 WHERE id = $2';
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
      let query2 = 'UPDATE user_transaction SET paid = true WHERE id = $1';
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
    let query = 'UPDATE user_transaction SET paid = true WHERE id = $1';
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
    let query2 = 'UPDATE fitness_user SET points = $1 WHERE id = $2';
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
  let result = false;
  let query = 'DELETE FROM ticket WHERE id = $1';
  await db.none(query, [id]).then(() => {
    console.log('Ticket removed successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error updating User disabled state: ', error);
    return false;
  });
  return result;
}

async function toggleUser(id, state) {
  // check it isnt SUPERUSER
  if (id === 0) {
    return false;
  }

  // update user disabled state
  let result = false;
  let query = 'UPDATE fitness_user SET disabled = $1 WHERE id = $2';
  await db.none(query, [state, id]).then(() => {
    console.log('User disabled state updated successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error updating User disabled state: ', error);
    return false;
  });
  return result;
}

async function changePassword(id, password) {
  // update user password
  let query = 'UPDATE fitness_user SET password = $1 WHERE id = $2';
  let result = false;
  await db.none(query, [password, id]).then(() => {
    console.log('User password updated successfully');
    result = true;
    return true;
  })
  .catch(error => {
    console.log('Error updating User password: ', error);
    return false;
  });
  return result;
}

async function updateAccount(accountInfo, userID) {
  // update user account info
  let ai = JSON.parse(accountInfo);

  // insert object into db
  let query = 'UPDATE fitness_user SET accountinfo = $1 WHERE id = $2';
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
  // insert object into db
  let result = false;
  let query = 'UPDATE fitness_user SET goals = $1 WHERE id = $2';
  await db.none(query, [goals, userID]).then(() => {
    console.log('User goals updated successfully');
    result = true;
    return true;
  }
  ).catch(error => {
    console.log('Error updating User goals: ', error);
    return false;
  });
  return result;
}

async function userRemoveExercise(body, userID) {
  // remove exercise from user
  let result = false;
  let query = 'DELETE FROM exerciseadded WHERE eid = $1 AND uid = $2';
  await db.none(query, [body.eid, userID]).then(() => {
    console.log('Exercise removed successfully');
    result = true;
    return true;
  }).catch(error => {
    console.log('Error removing Exercise: ', error);
    return false;
  });
  return result;
}




  
// ------------ROUTES------------
// -------GETS
// Home
app.get(['/', '/home'], async function (req, res) {
  // for html
  let rawRequest = req.headers.accept;
  let requestSplit = rawRequest.split(",");
  let request = requestSplit[0];
  console.log("get /home (" + request + ")");
  console.log(req.session);

  res.status(200);
  res.setHeader("Content-Type", "text/html");
  if (!req.session.loggedin) {
    res.send(pug.renderFile("./views/pages/home.pug", { loggedin: false }));
  } else if (req.session.loggedin && req.session.admin) {
    let users = await getUsers();
    let tickets = await getTickets();
    let transactions = await getTransactions();
    let uEvents = await getUpcomingEvents();
    let pEvents = await getPastEvents();
    res.send(pug.renderFile("./views/pages/adminDashboard.pug", { sessionUser: req.session.userID, users: users, tickets: tickets, transactions: transactions, uEvents: uEvents, pEvents: pEvents }));
  } else if (req.session.loggedin) {
    let user = await getUser(req.session.userID);
    let addedExercises = await getExercisesAdded(req.session.userID);
    let otherExercises = await getExercisesNotAdded(req.session.userID);
    let uEvents = await getUpcomingEvents();
    let pEvents = await getPastEvents();
    let transactions = await getUserTransactions(req.session.userID);

    res.send(pug.renderFile("./views/pages/userDashboard.pug", { user: user, addedExercises: addedExercises, otherExercises: otherExercises, uEvents: uEvents, pEvents: pEvents, transactions: transactions }));
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
});
// ADMIN RESET PASSWORD
app.get('/admin-password-reset/:id', function (req, res, next) {
  let pass = false;
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
    pass = true;
  }

  if (pass) {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /admin-password-reset/:id ("+request+")");

    res.setHeader("Content-Type", "text/html");
    if (req.session.user) {
      if (req.session.admin) {
        res.status(200);
        res.send(pug.renderFile("./views/pages/adminPasswordReset.pug", {id: id}));
      } else {
        res.status(403).json({ message: "You don't have permision to access this page."});
      }
    } else {
      res.status(401);
      res.redirect('/login');
    }
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
    // get event / check if exists
    let event = await db.oneOrNone('SELECT * FROM fitness_event WHERE id = $1', [id]);
    if (event === null) {
      res.status(404);
      res.setHeader("Content-Type", "text/plain");
      res.send("Event not found");
      console.log("Event not found.\n");
      return;
    }

    // handle admin request
    if (req.session.admin) {
      let rsvp = await getEventRSVP(id);
      event.rsvp = rsvp;
      res.status(200);
      res.send(pug.renderFile("./views/pages/event.pug", {event: event, admin: true}));
    // handle user request
    } else if (req.session.user) {
      // determine if user is RSVP'd
      let rsvp = await getEventRSVP(id);
      let rsvpBool = false;
      for (let i = 0; i < rsvp.length; i++) {
        if (rsvp[i].email === req.session.user) {
          rsvpBool = true;
        }
      }

      // check if date has passed.
      let curDate = new Date();
      let eventDate = new Date(event.when);
      if (curDate > eventDate) {
        // event has passed
        res.status(200);
        res.send(pug.renderFile("./views/pages/event.pug", {event: event, loggedin: true, rsvp: rsvpBool, eventPassed: true}));
      } else {
        // event has not passed
        res.status(200);
        res.send(pug.renderFile("./views/pages/event.pug", {event: event, loggedin: true, rsvp: rsvpBool}));
      }
    } else {
      res.status(200);
      res.send(pug.renderFile("./views/pages/event.pug", {event: event, loggedin: false}));
    }
  } else if (req.originalUrl.includes('/userexercises/')) {

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
// VIEW EXERCISE
app.get('/exercise/:id', async function (req, res) {
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
  }

  let exercise = await getExercise(id);
  res.status(200);
  res.send(pug.renderFile("./views/pages/exercise.pug", {exercise: exercise}));
});
// USER VIEW TRANSACTION
app.get('/pay/:id', async function (req, res) {
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
  }

  let transaction = await db.oneOrNone('SELECT * FROM user_transaction WHERE id = $1', [id]);
  let payment = await getUserPayment(req.session.userID);
  let user = await getUser(req.session.userID);

  if (payment === null) {
    payment = false;
  } else { payment = true; }

  if (transaction === null) {
    res.status(404);
    res.setHeader("Content-Type", "text/plain");
    res.send("Transaction not found");
    console.log("Transaction not found.\n");
    return;
  }

  // check if user is logged in
  if (req.session.userID === transaction.uid) {

    res.status(200);
    res.send(pug.renderFile("./views/pages/pay.pug", {transaction: transaction, payment: payment, user: user, loggedin: true, paid: transaction.paid, match: true}));

  } else if (req.session.admin) {
    res.status(200);
    res.send(pug.renderFile("./views/pages/pay.pug", {admin: true}));
  } else if (req.session.loggedin) {
    res.status(200);
    res.send(pug.renderFile("./views/pages/pay.pug", {match: false, loggedin: true}));
  } else {
    res.status(200);
    res.send(pug.renderFile("./views/pages/pay.pug", {match: false, loggedin: false}));
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
        let user = await db.oneOrNone('SELECT * FROM fitness_user WHERE email = $1', [username]);

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
// ADMIN CREATE USER
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
// ADMIN CREATE TRANSACTION
app.post('/create-transaction', express.urlencoded({ extended: false }), async (req, res) => {
  let transaction = req.body;
  
  // check if email exists
  let user = await getUser(transaction.email);


  if (user !== null) {
    transaction.uid = user.id;
    // create user
    let result = await addTransaction(transaction);

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
    res.send("Email does not exist");
    console.log("Could not create transaction. Email does not exist.\n");
  }
});
// ADMIN CREATE EVENT
app.post('/create-event', express.urlencoded({ extended: false }), async (req, res) => {
  let event = req.body;

  // create event
  let result = await addEvent(event);
  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("Event added successfully");
    console.log("Event added successfully.\n");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not create event");
    console.log("Could not create event.\n");
  }
});
// USER CREATE TICKET
app.post('/create-ticket', express.urlencoded({ extended: false }), async (req, res) => {
  let ticket = req.body;

  // create event
  let result = await addTicket(ticket);
  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("Event added successfully");
    console.log("Event added successfully.\n");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not create event");
    console.log("Could not create event.\n");
  }
});
// USER ADD EXERCISE
app.post('/user-add-exercise', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await addExerciseToUser(req.body, req.session.userID);

  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("Exercise added to user successfully");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not add exercise");
  }
});

// -------PUTS
// ADMIN DISABLE USER
app.put('/disable-user/:id', express.urlencoded({ extended: false }), async (req, res) => {
  let pass = false;
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
    pass = true;
  }
  
  if (pass) {
    let status = req.body.disabled;

    // disable user
    let result = await toggleUser(id, status);

    if (result) {
      res.status(200);
      res.setHeader("Content-Type", "text/plain");
      res.send("User disabled successfully");
      console.log("User disabled successfully.\n");
    } else {
      res.status(500);
      res.setHeader("Content-Type", "text/plain");
      res.send("Could not disable user");
      console.log("Could not disable user.\n");
    }
  } 
});
// ADMIN RESET PASSWORD
app.put('/admin-password-reset/:id', express.urlencoded({ extended: false }), async (req, res) => {
  let pass = false;
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
    pass = true;
  } else {
    // bad request
    res.status(400);
    res.setHeader("Content-Type", "text/plain");
    res.send("parameter id must be an integer");
  }

  if (pass) {
    let password = req.body.password;

    // change user password
    let result = await changePassword(id, password);

    if (result) {
      res.status(200);
      res.setHeader("Content-Type", "text/plain");
      res.send("User password updated successfully");
    } else {
      res.status(500);
      res.setHeader("Content-Type", "text/plain");
      res.send("Could not update user password");
    }
  }
});
// USER RSVP
app.put('/rsvp-event', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await addRSVP(req.session.userID, req.body.aid, req.body.status);

  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("RSVP updated successfully");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not update RSVP status");
  }
});
// USER UPDATE GOALS
app.put('/update-goals', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await updateGoals(req.body, req.session.userID);

  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("goals updated successfully");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not update user goals");
  }
});
// USER COMPLETE EXERCISE
app.put('/complete-exercise', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await updateLastdone(req.body, req.session.userID);

  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("User exercise last done updated successfully");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not update last done for exercise: " + req.body.eid);
  }
});
// USER PAY TRANSACTION
app.put('/pay', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await payTransaction(req.body, req.session.userID);

  if (result === 1) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("Transaction paid successfully");
  } else if (result === -1) {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("User does not have enough points");
  } else if (result === -2) {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Payment is expired");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not pay transaction");

  }
});


// -------DELETE
// ADMIN DELETE TICKET
app.delete('/complete-ticket/:id', express.urlencoded({ extended: false }), async (req, res) => {
  let pass = false;
  let id = req.params.id;
  if (Number.isInteger(parseInt(id))) {
    id = parseInt(id);
    pass = true;
  } else {
    // bad request
    res.status(400);
    res.setHeader("Content-Type", "text/plain");
    res.send("parameter id must be an integer");
  }

  if (pass) {
    // complete ticket
    let result = await completeTicket(id);

    if (result) {
      res.status(200);
      res.setHeader("Content-Type", "text/plain");
      res.send("User disabled successfully");
      console.log("User disabled successfully.\n");
    } else {
      res.status(500);
      res.setHeader("Content-Type", "text/plain");
      res.send("Could not disable user");
      console.log("Could not disable user.\n");
    }
  }
});
// USER REMOVE EXERCISE
app.delete('/user-remove-exercise', express.urlencoded({ extended: false }), async (req, res) => {
  let result = await userRemoveExercise(req.body, req.session.userID);

  if (result) {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.send("Exercise removed successfully");
  } else {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    res.send("Could not remove exercise");
  }
});


// Test SQL connection
db.one('SELECT $1 AS message', 'Connected to postgres database!').then(data => {console.log(data.message);}).catch(error => {console.error('Error:', error);});

// Start server
app.listen(3000);
console.log("Server listening at http://localhost:3000");