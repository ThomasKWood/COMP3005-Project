/** 
 * Client for logging user in
 * @version 1.0
 * @author Thomas Wood
 * Responsible for processing and verifying user info to be sent to server.
**/

/**
 * This function grabs user info from input forms and does basic checks before sending login data to server
 * activated when login button is clicked
 * @return {void} nothing
**/
function login() {
    // setup
    let divParent = document.getElementById("main").children;
    // get username
    let section = divParent[0].children;
    let username = section[1].value;
    // check if username is blank
    if (username === "") {
        alert("Email cannot be blank!");
        return;
    }

    // get password
    section = divParent[1].children;
    let password = section[1].value;
    // check if password is blank
    if (password === "") {
        alert("Password cannot be blank!");
        return;
    }
    // create body data
    const reqBody = {
        username,
        password
    }

    // send data
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        console.log(req)
        if (this.readyState==4) {
            // server accepted login
            if (req.status === 200) {
                //alert("Succesfully Logged-In.\nRedirecting to home page.");
                window.location = "/";
            }
            // server said password was incorrect
            if(req.status === 401) {
                alert("Password is incorrect.");
            }
            // server said username was not registered
            if(req.status === 404) {
                alert("Email not registered.");
            }

            if (req.status === 402) {
                alert("Account has been disabled. Please contact an admininstrator.");
            }
        }
    };
    req.open("POST", "/login", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(reqBody));
}