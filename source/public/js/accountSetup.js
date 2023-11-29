function addGoals() {
    let form = document.forms.namedItem("goals-form");
    let formData = new getFormData(form);

    let goals = {goals: [{}, {}, {}]};

    goals.goals[0].id = 1;
    goals.goals[0].name = formData.goal1name;
    goals.goals[0].value = formData.goal1;

    goals.goals[1].id = 2;
    goals.goals[1].name = formData.goal2name;
    goals.goals[1].value = formData.goal2;

    goals.goals[2].id = 3;
    goals.goals[2].name = formData.goal3name;
    goals.goals[2].value = formData.goal3;

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
            location.reload(true);
        })
        .catch(error => {
            console.log("server got back: " + error);
            location.reload(true);
        });
}

function addAccount() {
    let form = document.forms.namedItem("account-form");
    let formData = new getFormData(form);

    let accountinfo = {};

    accountinfo.height = formData.height;
    accountinfo.weight = formData.weight;
    accountinfo.dateoOfBirth = formData.dateOfBirth;

    fetch('/update-account', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(accountinfo),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(responseData => {
            console.log("server got back: " + responseData);
            location.reload(true);
        })
        .catch(error => {
            console.log("server got back: " + error);
            location.reload(true);
        });
}

async function addBoth() {
    let form = document.forms.namedItem("both-form");
    let formData = new getFormData(form);

    console.log(formData);

    let goals = {goals: [{}, {}, {}]};

    goals.goals[0].id = 1;
    goals.goals[0].name = formData.goal1name;
    goals.goals[0].value = formData.goal1;

    goals.goals[1].id = 2;
    goals.goals[1].name = formData.goal2name;
    goals.goals[1].value = formData.goal2;

    goals.goals[2].id = 3;
    goals.goals[2].name = formData.goal3name;
    goals.goals[2].value = formData.goal3;

    let gResult = false;
    await fetch('/update-goals', {
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
            gResult = true;
        })
        .catch(error => {
            console.log("server got back: " + error);
            location.reload(true);
    });
    
    let accountinfo = {}; 
    accountinfo.height = formData.height;   
    accountinfo.weight = formData.weight;
    accountinfo.dateoOfBirth = formData.dateOfBirth;
    
    let aResult = false;
    await fetch('/update-account', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(accountinfo),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(responseData => {
            console.log("server got back: " + responseData);
            aResult = true;
        })
        .catch(error => {
            console.log("server got back: " + error);
            location.reload(true);
    });
    
    if (gResult && aResult) {
        location.reload(true);
    }  
}