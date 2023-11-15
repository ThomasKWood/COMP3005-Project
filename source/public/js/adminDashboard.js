var form0 = document.forms.namedItem("create-user-form");
var form1 = document.forms.namedItem("create-new-transaction-form");

// Helper function to get form data
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
            if (toggle) {
                alert('User disabled successfully!');
            } else {
                alert('User enabled successfully!');
            }
        })
        .catch(error => {
            alert('Error: User could not be disabled.');
        });
}

// Remove Ticket
function completeTicket(ticketID) {
    fetch(`/complete-ticket/${userId}`, {
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

// Collapse Panel Functionality
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