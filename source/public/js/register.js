function register() {
    const error = document.getElementById('password-error');
    const form = document.forms.namedItem('register-form');

    let data = getFormData(form);

    // Check that the passwords match
    if (data.password !== data.confirmPassword) {
        error.innerHTML = 'Passwords do not match.';
        error.style.display = 'block';
        return;
    // password must be at least 8 characters
    } else if (data.password.length < 8) {
        error.innerHTML = 'Password must be at least 8 characters.';
        error.style.display = 'block';
        return;
    // password must be less than 65 characters
    } else if (data.password.length > 65) {
        error.innerHTML = 'Password must be less than 65 characters.';
        error.style.display = 'block';
        return;
    // password must have at least one number, one lowercase letter, one uppercase letter, and one special character
    } else if (!data.password.match(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).*$/)) {
        error.innerHTML = 'Password must have at least one number, one lowercase letter, one uppercase letter, and one special character.';
        error.style.display = 'block';
        return;
    }


    fetch('/register', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (response.status === 409) {
            error.innerHTML = 'Email already in use.';
            error.style.display = 'block';
            throw new Error('Email already in use');
        } else if (response.status === 200) {
            error.innerHTML = '';
            error.style.display = 'hidden';
            window.location.href = '/login';
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