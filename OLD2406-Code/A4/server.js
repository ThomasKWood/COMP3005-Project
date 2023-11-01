/** 
 * A4 Server
 * @version 1.1
 * @author Thomas Wood
 * Responsible for handeling and rendering the pages of A4 
**/

// Requires
const pug = require("pug");
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
let mongo = require('mongodb');

// Mongo setup
let MongoClient = mongo.MongoClient;
const users = "users";
const orders = "orders";
let db;

//Express Setup
let app = express();
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "pug");

// Session Setup
// Database for sessions
let store = new MongoDBStore(
    {
        uri: 'mongodb://localhost:27017/a4',
        collection: 'sessions'
    }
);
// session properties
app.use(
    session({
        name: 'restaurant user',
        secret: "some secret key here",
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
// HOME
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
// ORDER
app.get('/order', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /register ("+request+")");

	res.setHeader("Content-Type", "text/html");
    if (req.session.loggedin) {
        res.status(200);
        res.send(pug.renderFile("./views/pages/orderform.pug"));
    } else {
        res.status(403);
        res.send(pug.renderFile("./views/pages/orderformError.pug"));
    }
});
// ORDER SUMMARY
app.get('/orders/:orderID', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /register ("+request+")");
    console.log("    request wants order with id: "+req.params.orderID);

    // setup
    let oid;
    let found = false;

    // see if id exists from param
    try{
        oid = new mongo.ObjectID(req.params.orderID);
    } catch {
        res.status(404)
        res.setHeader("Content-Type", "text/plain");
        res.send("Unknown ID");
		return;
    }
    // BRANCH...
    // if user is logged in...
    if (req.session.loggedin) {
        // find order with id
        db.collection(orders).findOne({"_id": oid}, (err, order) => {
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }
            
            // order returned is not null.
            if (order != null) {
                found = true;
                console.log("    found order with requested id.");
            }

            if (found) {
                // is the person requesting their own order?
                if (order.user === req.session.username) {
                    res.status(200);
                    res.setHeader("Content-Type", "text/html");
                    res.send(pug.renderFile("./views/pages/order.pug", {loggedin: true, order: order}));
                    console.log("    sending order.\n");
                } else {
                    // find user that made the order by searching for username stored in order
                    db.collection(users).findOne({username: order.user}, (err, user) => {
                        if(err) {
                            res.status(500);
                            res.setHeader("Content-Type", "text/plain");
                            res.send("Error reading database.");
                            throw err;
                        }
                        // is user public?
                        if (user.privacy == false) {
                            // the user is public we can send the order details
                            res.status(200);
                            res.setHeader("Content-Type", "text/html");
                            res.send(pug.renderFile("./views/pages/order.pug", {loggedin: true, order: order}));
                            console.log("    sending profile.\n");
                        } else {
                            // user is not public we cannot send the order details
                            res.status(403);
                            res.setHeader("Content-Type", "text/plain");
                            res.send("You cannot view this order because the user is private.");
                        }
                    });
                }
            // order was not found or is corrupted  
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("order not found");
                console.log("    order \""+req.params.orderID+"\" does not exist.\n");
            }
        });
    // if user is not logged in...
    } else {
        // find the order with the requested id
        db.collection(orders).findOne({"_id": oid}, (err, order) => {
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }

            // order returned is not null.
            if (order != null) {
                found = true;
                console.log("    found order with requested id.");
            }

            // find user that made the order by searching for username stored in order
            if (found) {
                db.collection(users).findOne({ username: order.user }, (err, user) => {
                    if (err) {
                        res.status(500);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("Error reading database.");
                        throw err;
                    }
                    // is user public?
                    if (user.privacy == false) {
                        // the user is public we can send the order details
                        res.status(200);
                        res.setHeader("Content-Type", "text/html");
                        res.send(pug.renderFile("./views/pages/order.pug", { loggedin: false, order: order }));
                        console.log("    sending profile.\n");
                    } else {
                        // user is not public we cannot send the order details
                        res.status(403);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("You cannot view this order because the user is private.");
                    }
                });
            // order was not found or is corrupted  
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("order not found");
                console.log("    order \""+req.params.orderID+"\" does not exist.\n");
            }
        });
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
// LOGOUT
app.get('/logout', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /logout ("+request+")");

	res.setHeader("Content-Type", "text/html");
    if (req.session.loggedin) {
        console.log("    logged out user \""+req.session.username+"\".\n");
        req.session.destroy();
        res.status(200);
        res.send(pug.renderFile("./views/pages/logout.pug"));
    } else {
        res.status(401)
        res.send(pug.renderFile("./views/pages/logoutError.pug"));
    }
});
// REGISTER
app.get('/register', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /register ("+request+")");

	res.status(200);
	res.setHeader("Content-Type", "text/html");
    if (req.session.loggedin) {
        res.send(pug.renderFile("./views/pages/loginError.pug"));
    } else {
        res.send(pug.renderFile("./views/pages/register.pug", {loggedin: false}));
    }
});
// GET USERS & SEARCH USERS
app.get('/users', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];

    // store how many query parameters we have
    let querySize = Object.keys(req.query).length;

    // is there at least one query?
    if(querySize > 0) {
        // their is a query in req. handle it...
        console.log("get /users?query ("+request+")");
        // we have more than one query...
        if (querySize > 1) {
            res.status(403);
            res.setHeader("Content-Type", "text/plain");
            res.send("server only accepts one query: name");
            return;
        }
        // we have one query...
        // is query called name?
        if(req.query.hasOwnProperty("name")) {
            // check if null
            if (req.query.name != "") {
                console.log("    user is looking for anything related to "+req.query.name);
                // convert to lower case
                let queryName = req.query.name.toLowerCase();
                // insert into query array so we can filter for both related to query and are public
                let dbQuery = [{username: {$regex:queryName}}, {privacy: false}];

                // create array of query array
                db.collection(users).find({$and:dbQuery}).toArray((err, results) => {
                    if(err){
                        res.status(500);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("Error reading database.");
                        throw err;
                    }

                    res.status(200);
                    res.setHeader("Content-Type", "text/html");
                    if (req.session.loggedin) {
                        res.send(pug.renderFile("./views/pages/users.pug", {users:results, loggedin:true}));
                    } else {
                        res.send(pug.renderFile("./views/pages/users.pug", {users:results, loggedin:false}));
                    }
                });
            // query is blank
            } else {
                res.status(403);
                res.setHeader("Content-Type", "text/plain");
                res.send("name cannot be blank");
                return;
            }
        // query is not called "name"
        } else {
            res.status(404);
            res.setHeader("Content-Type", "text/plain");
            res.send("unknown query parameter. server only accepts \"name\"");
            return;
        }
    // there is not query in the request so instead we just display all public users
    } else {
        console.log("get /users ("+request+")");
        // create users array
        db.collection(users).find({ privacy: false }).toArray((err, results) => {
            if (err) {
                res.status(500);
                res.send("Error reading database.");
                throw err;
            }

            res.status(200);
            res.setHeader("Content-Type", "text/html");
            if (req.session.loggedin) {
                res.send(pug.renderFile("./views/pages/users.pug", { users: results, loggedin: true }));
            } else {
                res.send(pug.renderFile("./views/pages/users.pug", { users: results, loggedin: false }));
            }
        });
    }
});
// PROFILE
app.get('/profile', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /profile ("+request+")");

    // is user logged in?
    if (req.session.loggedin) {
        // get user from database from session username
        db.collection(users).findOne({username: req.session.username}, (err, user) => {
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }

            // did we find a user with that username?
            if (user != null) {
                found = true;
                console.log("    found logged in user");
            }

            // user found and not null
            if (found) {
                // get orders of user
                db.collection(orders).find({user: req.session.username}).toArray((err2, orders) => {
                    if(err2) {
                        res.status(500);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("Error reading database.");
                        throw err;
                    }
        
                    res.status(200);
                    res.setHeader("Content-Type", "text/html");
                    res.send(pug.renderFile("./views/pages/user.pug", {loggedin: true, profile: true, user: user, orders: orders}));
                    console.log("    sending profile.\n");
                });
            // we did not find a user with that username
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("user not found");
                console.log("    user \""+req.session.username+"\" does not exist.\n");
            }
        });
    // client is not signed in and therefore cannt view profile
    } else {
        res.send(pug.renderFile("./views/pages/profileError.pug"));
    }
});
// USER DETAILS (like /profile but can be anyone with privacy set to public)
app.get('/users/:userID', (req, res) => {
    // for html
    let rawRequest = req.headers.accept;
    let requestSplit = rawRequest.split(",");
    let request = requestSplit[0];
    console.log("get /users/:userID ("+request+")");
    console.log("    request wants user with id: "+req.params.userID);

    // setup
    let oid;
    let found = false
    // does id exist?
    try{
        oid = new mongo.ObjectID(req.params.userID);
    } catch {
        res.status(404)
        res.setHeader("Content-Type", "text/plain");
        res.send("Unknown ID");
		return;
    }
    // is user logged in?
    if (req.session.loggedin) {
        // find user with request id
        db.collection(users).findOne({"_id": oid}, (err, user) => {
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }
            // did we find a user with matching id?
            if (user != null) {
                found = true;
                console.log("    found user with request id");
            }
            // we did infact find user
            if (found) {
                // is the person requesting their own account?
                if (user.username === req.session.username) {
                    // get their orders
                    db.collection(orders).find({user: user.username}).toArray((err2, orders) => {
                        if(err2) {
                            res.status(500);
                            res.setHeader("Content-Type", "text/plain");
                            res.send("Error reading database.");
                            throw err;
                        }
            
                        res.status(200);
                        res.setHeader("Content-Type", "text/html");
                        // since it is the user who requested their own id we can allow them to edit their privacy. (its the same as /profile)
                        res.send(pug.renderFile("./views/pages/user.pug", {loggedin: true, profile: true, user: user, orders: orders}));
                        console.log("    sending user.\n");
                    });
                // user requested is not the user that is logged in
                } else {
                    // privacy check
                    if (user.privacy == false) {
                        // user is public now we need to get their orders
                        db.collection(orders).find({user: user.username}).toArray((err2, orders) => {
                            if(err2) {
                                res.status(500);
                                res.setHeader("Content-Type", "text/plain");
                                res.send("Error reading database.");
                                throw err;
                            }
                
                            res.status(200);
                            res.setHeader("Content-Type", "text/html");
                            // username does not match session user there for they can only view the user and cannot change their privacy
                            res.send(pug.renderFile("./views/pages/user.pug", {loggedin: true, profile: false, user: user, orders: orders}));
                            console.log("    sending user.\n");
                        });
                    // profile is private
                    } else {
                        res.status(403);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("This user has their profile set to private.");
                    }
                }
            // no user found with that id
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("user not found");
                console.log("    user \""+req.params.userID+"\" does not exist.\n");
            }
        });
    // client is not logged in
    } else {
        // find user with requested id
        db.collection(users).findOne({ "_id": oid }, (err, user) => {
            if (err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }

            // check is user returned is null
            if (user != null) {
                found = true;
                console.log("    found user with request id");
            }
            // great we found a user with that id
            if (found) {
                // are they public?
                if (user.privacy == false) {
                    // they are public now we need their orders
                    db.collection(orders).find({ user: user.username }).toArray((err2, orders) => {
                        if (err2) {
                            res.status(500);
                            res.setHeader("Content-Type", "text/plain");
                            res.send("Error reading database.");
                            throw err;
                        }

                        res.status(200);
                        res.setHeader("Content-Type", "text/html");
                        res.send(pug.renderFile("./views/pages/user.pug", { loggedin: false, profile: false, user: user, orders: orders }));
                        console.log("    sending user.\n");
                    });
                // user is not public
                } else {
                    res.status(403);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("This user has their profile set to private.");
                }
            // we did not find a user with that id
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("user not found");
                console.log("    user \""+req.params.userID+"\" does not exist.\n");
            }
        });
    }
});
// -------END OF GETS

// -------POSTS
// REGISTER RECIEVE
app.post('/register', (req, res) => {
    console.log("\nrecieving a new user to add...");
    reqObject = req['headers'];
    let request = reqObject['content-type'];
    console.log("    content type: "+request);

    // is format json?
    if (request === "application/json") {
        let notTaken = true; // boolean store for username check
        // see if we can find a user with the username that the client sent. (we dont want to find a user)
        db.collection(users).findOne({username: req.body.username}, (err, user) => {
            if (err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }
            // check what we found
            if(user == null) {
                console.log("    did not find user with that username. this is good.");
            } else {
                notTaken = false;
                console.log("    database found an already existing user. this will result in error for client.");
            }
            // did we find an existing user?
            if (notTaken) {
                // if we did not:
                // fill account details
                let newAccount = {};
                newAccount.username = req.body.username;
                newAccount.password = req.body.password;
                newAccount.privacy = false;
                // add new user to database
                db.collection(users).insertOne(newAccount, function(err2, result){
                    if(err2){
                        res.status(500);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("database error");
                        console.log("    could not add new user. database did not like.\n");
                        throw err2;
                    } else {
                        // set the registered user to the session username and login them in as the created account
                        req.session.loggedin = true;
                        req.session.username = req.body.username;
                        res.status(201);
                        res.setHeader("Content-Type", "text/plain");
                        res.send("success");
                        console.log("    added a new user \"" + newAccount.username + "\".\n");
                    }
                });
            // we found an existing user with that username
            } else if (notTaken == false) {
                res.status(406);
                res.setHeader("Content-Type", "text/plain");
                res.send("username already used");
                console.log("    could not add new user. username already in use.\n");
            }
        });
    // format is not json
    } else {
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("server only accepts json");
        console.log("    could not add new user. incorrect format.\n");
    }
});
// LOGIN RECIEVE
app.post('/login', (req, res) => {
    console.log("\nrecieving a login...");
    reqObject = req['headers'];
    let request = reqObject['content-type'];
    console.log("    content type: "+request);

    // is format json?
    if (request === "application/json") {
        // fromat is json
        let found = false; // boolean that stores if we found a user based of client request username
        db.collection(users).findOne({username: req.body.username}, (err, user) => {
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("Error reading database.");
                throw err;
            }

            // determine if we found a user from request username
            if (user != null) {
                found = true;
                console.log("    found a user with that username");
            }
            // was user found?
            if (found) {
                // does client sent password match users actual password? 
                if (req.body.password === user.password) {
                    // set session details
                    req.session.loggedin = true;
                    req.session.username = req.body.username;
                    req.session.maxAge = 1800000;   // not sure if this works lol should expire after 30 mins

                    res.status(200);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("succsess");
                    console.log("    user login successful.\n");
                // password does not match, ruh roh!
                } else {
                    res.status(401);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("passwords do not match");
                    console.log("    could not login user. passwords do not match.\n");
                }
            // user with client sent username does not exist
            } else if (found == false) {
                res.status(404);
                res.setHeader("Content-Type", "text/plain");
                res.send("username not found");
                console.log("    user \""+req.body.username+"\" does not exist.\n");
            }
        });
    // format is not json 
    } else {
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("server only accepts json");
        console.log("    could not add new user. incorrect format.\n");
    }
});
// ORDER RECIEVE
app.post('/orders', (req, res) => {
    console.log("\nrecieving an order...");
    reqObject = req['headers'];
    let request = reqObject['content-type'];
    console.log("    content type: "+request);

    // is user logged in?
    if (req.session.loggedin == null){
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("order has no user associated");
        console.log("    there is no user logged in. this order cannot be processed.\n");
        return;
    }
    // is format json?
    if (request === "application/json") {
        // create new order object to be added
        let newOrder = {};
        // order stores username and id and then an object containing order info
        newOrder.info = {};
        // set object within order to order details from client send
        newOrder.user = req.session.username;
        newOrder.info.restaurantID = req.body.restaurantID;
        newOrder.info.restaurantName = req.body.restaurantName;
        newOrder.info.subtotal = req.body.subtotal;
        newOrder.info.total = req.body.total;
        newOrder.info.fee = req.body.fee;
        newOrder.info.tax = req.body.tax;
        newOrder.info.order = req.body.order;
        // add order to database
        db.collection(orders).insertOne(newOrder, function (err, result) {
            if (err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("database error");
                console.log("    could not add order to database. database did not like.\n");
                throw err;
            } else {
                res.status(201);
                res.setHeader("Content-Type", "text/plain");
                res.send("succsess");
                console.log("    added order to database. has id: "+result.insertedId+"\n");
            }
        });
    // format is not json
    } else {
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("server only accepts json");
        console.log("    could not add order. incorrect format.\n");
    }
});
// -------END OF POSTS

// -------PUT
// PROFILE UPDATE
app.put('/profile', (req, res) => {
    console.log("\nrecieving profile update...");
    reqObject = req['headers'];
    let request = reqObject['content-type'];
    console.log("    content type: "+request);

    // is user logged in?
    if (req.session.loggedin == null){
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("profile has no user associated");
        console.log("    there is no user logged in. this user update cannot be processed.\n");
        return;
    }

    console.log("    recieved: "+ req.body.userPrivacy);

    // is format json?
    if (request === "application/json") {
        // update user privacy with request data and matching session username
        db.collection(users).updateOne({username: req.session.username}, {$set: {privacy: req.body.userPrivacy}}, function(err,result){
            if(err) {
                res.status(500);
                res.setHeader("Content-Type", "text/plain");
                res.send("database error");
                throw err;
            }
            
            // console.log(result);

            res.status(204);
            res.setHeader("Content-Type", "text/plain");
            res.send("profile privacy has been updated");
        });
    // format is not json
    } else {
        res.status(500);
        res.setHeader("Content-Type", "text/plain");
        res.send("server only accepts json");
        console.log("    could not update profile. incorrect format.\n");
    }
});
// -------END OF PUT

// DATABASE CONNECT 
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if(err) {
    throw err;
  }
  //Get the a4 database
  db = client.db('a4');

  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Server listening at http://localhost:3000");
});