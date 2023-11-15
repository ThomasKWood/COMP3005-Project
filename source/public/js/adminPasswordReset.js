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

var form0 = document.forms.namedItem("password-form");
form0.addEventListener('submit', function (event) {
    event.preventDefault();

    console.log("attempt to put - update user password")
    // get form data
    var data = getFormData(form0);
    console.log(data);

    // convert id to int
    let id = parseInt(data.id);

    fetch(`/admin-password-reset/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: data.password }),
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
});