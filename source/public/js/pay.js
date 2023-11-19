function pay(id, payWithPoints) {
    fetch('/pay', {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({id:id, paidbypoints:payWithPoints}),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(responseData => {
        console.log("server got back: " + responseData);
        alert('Transaction approved!');
        location.reload(true);
    })
    .catch(error => {
        console.log("server got back: " + error);
        if (!payWithPoints) {
            alert('Transaction was not approved. Check that your payment method is not expired.');
        } else {
            alert('Transaction was not approved. Check that you have enough points.');
        }
        location.reload(true);
    });

}