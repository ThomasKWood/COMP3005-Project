var form0 = document.forms.namedItem("create-user-form");
var form1 = document.forms.namedItem("create-new-transaction-form");
var form2 = document.forms.namedItem("create-new-event-form");

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
            if (toggle) {
                alert('User disabled successfully!');
            } else {
                alert('User enabled successfully!');
            }
            location.reload(true);
        })
        .catch(error => {
            alert('Error: User could not be disabled.');
        });
}

// Remove Ticket
function completeTicket(ticketID) {
    fetch(`/complete-ticket/${ticketID}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('Ticket '+ticketID+': completed successfully!');
            location.reload(true);
        })
        .catch(error => {
            alert('Ticket '+ticketID+': could not be completed.');
        });
}

// Form Listeners
// Listen to add user form
form0.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new user")

    var data = getFormData(form0);
    data.admin = document.getElementById("admin").checked;
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
// Listen to billing form
form1.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new transaction")

    var data = getFormData(form1);
    console.log(data);

    fetch('/create-transaction', {
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
            alert('Transaction created successfully!');
        })
        .catch(error => {
            alert('Error: Transaction could not be created.');
        });
});

// Listen to create event form
form2.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new event")

    var data = getFormData(form2);
    console.log(data);
    fetch('/create-event', {
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
            alert('Event created successfully!');
        })
        .catch(error => {
            alert('Error: Event could not be created.');
        });
});