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

// Function to add a new user
function addUser() {
    // Replace this with your actual logic to add a new user
    console.log('Adding a new user');
}

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