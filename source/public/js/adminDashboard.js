// function to parse a form object for its names and values
function getFormData(form) {
    var elements = form.elements;
    var obj = {};
    for (var i = 0; i < elements.length; i++) {
        var item = elements.item(i);
        if (item.name) {
            obj[item.name] = item.value;
        }
    }
    return obj;
}

// Function to disable a user
function toggleUser(userId, toggle) {
    fetch(`/disable-user/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ disabled: toggle }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('User disabled successfully!');
        })
        .catch(error => {
            alert('Error: User could not be disabled.');
        });
}

// Function to reset the password for a user
function resetPassword(userId) {
    createOverlay(userId);
    console.log(`Resetting password for user with ID: ${userId}`);
}

function resetPasswordPOST(userId, password) {
    fetch(`/password-reset/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: password }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('User password changed successfully!');
        })
        .catch(error => {
            alert('Error: User password could not be reset.');
        });
}

function createOverlay(id) {
    // Create an overlay element
    var overlay = document.createElement('div');
    overlay.id = 'overlay'; // Set the id of the overlay element

    // Create a form element
    var form = document.createElement('form');
    form.method = 'PUT'; // Set the method of the form element

    // Create a hidden input element that holds the id parameter
    var hidden = document.createElement('input');
    hidden.type = 'hidden'; // Set the type of the hidden input element
    hidden.name = 'id'; // Set the name of the hidden input element
    hidden.value = id; // Set the value of the hidden input element to the id parameter

    // Create a label element for the new password input
    var label = document.createElement('label');
    label.for = 'password'; // Set the for attribute of the label element
    label.textContent = 'New Password:'; // Set the text content of the label element

    // Create an input element for the new password
    var password = document.createElement('input');
    password.type = 'password'; // Set the type of the password input element
    password.id = 'password'; // Set the id of the password input element
    password.name = 'password'; // Set the name of the password input element
    password.placeholder = 'Enter a new password'; // Set the placeholder of the password input element
    password.required = true; // Set the required attribute of the password input element

    // Create a submit button element
    var submit = document.createElement('input');
    submit.type = 'submit'; // Set the type of the submit button element
    submit.value = 'Reset Password'; // Set the value of the submit button element

    // Create a close button element
    var close = document.createElement('span');
    close.id = 'close'; // Set the id of the close button element
    close.textContent = '×'; // Set the text content of the close button element

    // Append the hidden input, the label, the password input, the submit button, and the close button to the form element
    form.appendChild(hidden);
    form.appendChild(label);
    form.appendChild(password);
    form.appendChild(submit);
    form.appendChild(close);

    // Append the form element to the overlay element
    overlay.appendChild(form);

    // Append the overlay element to the body element
    document.body.appendChild(overlay);

    // Add an event listener for the close button
    close.addEventListener('click', function () {
        // Remove the overlay element from the body element
        document.body.removeChild(overlay);
    });

    submit.addEventListener('click', resetPasswordPOST(id, password.value));
}

// Listen to add a new user
var form0 = document.forms.namedItem("create-user-form");
console.log(form0);
form0.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new user")

    var data = getFormData(form0);
    console.log(data);
    fetch('/create-user', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('User added successfully!');
        })
        .catch(error => {
            alert('Error: Email already exists.');
        });
});

// Listen to ticket form
var form1 = document.forms.namedItem("delete-ticket-form");
form1.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - remove ticket")

    var data = getFormData(form1);
    console.log(data);
    fetch('/delete-ticket', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('User added successfully!');
        })
        .catch(error => {
            alert('Error: Email already exists.');
        });
});

// Listen to billing form


window.onload = function () {
    var rows = document.getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i++) {
        rows[i].addEventListener("click", function () {
            var panel = this.querySelector(".collapse-panel");
            if (panel.style.display === "none") {
                panel.style.display = "block";
            } else {
                panel.style.display = "none";
            }
        });
    }
};