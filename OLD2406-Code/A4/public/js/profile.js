/** 
 * A4 Client for user profile
 * @version 1.0
 * @author Thomas Wood
 * Responsible for making profile page interactive and sending profile update to server
**/

/**
 * This function initializes page by adding event listeners to radio privacy buttons
 * @return {void} nothing
**/
function init() {
    console.log("initializing...");
    document.getElementById("private").addEventListener("click", switchToPrivate);
    document.getElementById("public").addEventListener("click", switchToPublic);
}

/**
 * This function handles if the user selected the public privacy button. it will uncheck private.
 * @return {void} nothing
**/
function switchToPublic(){
    console.log("switching to public...")
    if (document.getElementById("public").checked) {
        document.getElementById("private").checked = false;
    }
}

/**
 * This function handles if the user selected the priavte privacy button. it will uncheck public.
 * @return {void} nothing
**/
function switchToPrivate(){
    console.log("switching to private...")
    if (document.getElementById("private").checked) {
        document.getElementById("public").checked = false;
    } 
}

/**
 * This function sends whatever option is currently checked in privacy settings to server so that it can be updated
 * called when update button is pressed
 * @return {void} nothing
**/
function update() {
    let reqBody = {};

    // is private checked?
    if (document.getElementById("private").checked) {
        reqBody.userPrivacy = true;
    }
    // is public checked?
    if (document.getElementById("public").checked) {
        reqBody.userPrivacy = false;
    }

    // did we get a value assigned to userPrivacy?
    if (reqBody.userPrivacy == null) {
        alert("Please check an option.");
        return;
    }

    // send data
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        console.log(req)
        if (this.readyState==4) {
            // server said privacy was updated
            if (req.status === 204) {
                alert("Succesfully updated privacy.");
            // server said there was an error
            } else {
                alert("Error updating privacy. Make sure you are logged in.");
                console.log("server had some unknown error updating status. you are probably not logged in");
            }
        }
    };
    req.open("PUT", "/profile", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(reqBody));
}