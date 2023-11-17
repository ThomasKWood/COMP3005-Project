var form0 = document.forms.namedItem('create-goal');
var form1 = document.forms.namedItem('create-ticket');

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

    fetch('/create-goal', {
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
});

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