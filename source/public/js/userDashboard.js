var form0 = document.forms.namedItem('create-goal');
var form1 = document.forms.namedItem('create-ticket');

// create goal
form0.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new goal")

    // get new goal data
    var data = getFormData(form0);

    // add remaining data
    let array = goals.goals;
    data.id = array.length + 1;
    data.completed = false;

    // add new goal to goals
    goals.goals.push(data);
    
    console.log(goals);

    // send server updated goals
    sendGoals();
});

// create ticket
form1.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to post - new ticket")

    var data = getFormData(form1);
    console.log(data);
    fetch('/create-ticket', {
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
            alert('Ticket has been sent!');
        })
        .catch(error => {
            alert('Error: Ticket could not be added.');
        });
});

// helper function to send updated goals
function sendGoals() {
    fetch('/update-goals', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(goals),
    })
        .then(response => {
            if (!response.ok) {
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

// complete goal
function goal(id) {
    console.log("attempt to complete goal: " + id);

    // find goal
    let array = goals.goals;
    let index = array.findIndex(x => x.id == id);
    let goal = array[index];

    // update goal
    goal.completed = true;
    goals.goals[index] = goal;
    
    console.log(goals);

    // send server updated goals66666
    sendGoals();
}

// complete exercise
function completeExercise(id) {
    console.log("attempt to complete exercise: " + id);

    fetch('/complete-exercise', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ eid: id }),
    })
        .then(response => {
            if (!response.ok) {
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

// remove exercise
function removeExercise(id) {
    console.log("attempt to remove added exercise: " + id);

    fetch('/user-remove-exercise', {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ eid: id }),
    })
        .then(response => {
            if (!response.ok) {
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

// add exercise
function addExercise(id) {
    console.log("attempt to add exercise: " + id);

    fetch('/user-add-exercise', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ eid: id }),
    })
        .then(response => {
            if (!response.ok) {
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