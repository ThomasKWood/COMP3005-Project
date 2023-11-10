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
function disableUser(userId) {
    // Replace this with your actual logic to disable the user with the given userId
    console.log(`Disabling user with ID: ${userId}`);
}

// Function to reset the password for a user
function resetPassword(userId) {
    // Replace this with your actual logic to reset the password for the user with the given userId
    console.log(`Resetting password for user with ID: ${userId}`);
}

// Listen to add a new user
var form0 = document.forms.namedItem("create-user-form");
console.log(form0);
form0.addEventListener('submit', function(event) {
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
form1.addEventListener('submit', function(event) {
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