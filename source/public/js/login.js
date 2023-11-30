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
    const error = document.getElementById('password-error');
    const form = document.forms.namedItem('login-form');

    let data = getFormData(form);

    fetch('/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (response.status === 401) {
            error.innerHTML = 'Password is incorrect.';
            error.style.display = 'block';
            throw new Error('password is incorrect');
        } else if (response.status === 403) {
            error.innerHTML = 'No account with that email exists. Please register.';
            error.style.display = 'block';
            throw new Error('account does not exist');
        }  else if (response.status === 406) {
            error.innerHTML = 'Your Account has been disabled.';
            error.style.display = 'block';
            throw new Error('account disabled');
        } else if (response.status === 200) {
            error.innerHTML = '';
            error.style.display = 'hidden';
            window.location.href = '/';
        } else if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(responseData => {
        console.log("server got back: " + responseData);
    })
    .catch(error => {
        console.log("server got back: " + error);
    });
}