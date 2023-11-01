/** 
 * A4 Client for user register
 * @version 1.0
 * @author Thomas Wood
 * Responsible for checking register data and then sending it to server
 * Very similar to login
**/

/**
 * This function collects and sends new user data to server 
 * activated when register button is clicked
 * @return {void} nothing
**/
function register() {
    // setup
    let divParent = document.getElementById("main").children;
    // get username
    let section = divParent[0].children;
    let username = section[1].value;
    // check if username is blank
    if (username === "") {
        alert("Username cannot be blank!");
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
            // server accepted new user. lets redirect them to their profile
            if (req.status === 201) {
                alert("Succesfully Registered.\nRedirecting to profile.");
                window.location = "/profile";
            }
            // server said username was already registered
            if(req.status === 406) {
                alert("Username is already registered.\nChoose a different username.");
            }
        }
    };
    req.open("POST", "/register", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(reqBody));
}