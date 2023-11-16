function rsvp(status, aid) {
    fetch(`/rsvp-event`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: status, aid: aid }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            if (status) {
                alert('You have successfully RSVP\'d to this event!');
            } else {
                alert('You have successfully Un-RSVP\'d to this event!');
            }
        })
        .catch(error => {
            alert('Error: Could not change the status of your RSVP.');
        });
}