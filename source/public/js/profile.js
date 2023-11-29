window.onload = function () {
  const cardnum = document.getElementById('cardnum');
  const expiryDate = document.getElementById('expiryDate');
  const cvc = document.getElementById('cvc');

  // format expiry
  function formatExpiryDate() {
    const currentYear = new Date().getFullYear().toString().substr(-2)
    const inputValue = expiryDate.value;

    const formattedValue = inputValue
      .replace(/\D/g, '') // Remove non-digit characters
      .replace(/^([2-9])/, '0$1') // Prepend a '0' if the first digit is greater than 1
      .replace(/^(1[3-9]|2\d)/, '12') // Ensure the month is not greater than 12
      .slice(0, 4) // Limit to 4 digits
      .replace(/(\d{2})(\d{2})/, function (match, month, year) {
        // If year is less than current year, replace with current year
        return month + '/' + (year < currentYear ? currentYear : year);
      });
    expiryDate.value = formattedValue;
  }
  expiryDate.addEventListener('input', formatExpiryDate);

  // format card number
  function formatCardNum() {
    const inputValue = cardnum.value;

    const formattedValue = inputValue
      .replace(/\D/g, '') // Remove non-digit characters
      .slice(0, 16) // Limit to 16 digits
      .replace(/(\d{4})/g, '$1 ') // Add a space after every 4 digits
      .trim(); // Remove trailing space
    cardnum.value = formattedValue;
  }
  cardnum.addEventListener('input', formatCardNum);

  // format cvc
  function formatCVC() {
    const inputValue = cvc.value;

    const formattedValue = inputValue
      .replace(/\D/g, '') // Remove non-digit characters
      .slice(0, 3) // Limit to 3 digits
      .trim(); // Remove trailing space
    cvc.value = formattedValue;
  }
  cvc.addEventListener('input', formatCVC);
};

function updateAccount() {
  var form = document.forms.namedItem('account-form');
  var data = getFormData(form);

  fetch('/update-account', {
    method: "PUT",
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
    .then(responseData => {
      console.log("server got back: " + responseData);
      location.reload(true);
    })
    .catch(error => {
      console.log("server got back: " + error);
      alert("Error updating account");
      location.reload(true);
    });
}

function updatePayment() {
  var form = document.forms.namedItem('payment-form');
  var data = getFormData(form);

  // format data
  // setup current date
  let currDate = new Date();
  let currYear = currDate.getFullYear();
  let currMonth = currDate.getMonth();

  // organize expiry date
  let expYear = parseInt('20' + data.expiryDate.split('/')[1]);
  let expMonth = parseInt(data.expiryDate.split('/')[0]);
  // check if card is expired
  if (expYear < currYear || (expYear == currYear && expMonth < currMonth)) {
    alert("Error updating payment! \n\nThe card you entered is expired.");
    return;
  } else {
    data.expiryyear = expYear;
    data.expirymonth = expMonth;
  }
  // remove spaces from card number
  data.cardnum = data.cardnum.replace(/\s/g, '');
  // convert to int
  data.cardnum = parseInt(data.cardnum);
  // convert cvc to int
  data.cvc = parseInt(data.cvc);

  fetch('/add-payment', {
    method: "PUT",
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
    .then(responseData => {
      console.log("server got back: " + responseData);
      location.reload(true);
    })
    .catch(error => {
      console.log("server got back: " + error);
      alert("Error updating payment! \n\nThe card you entered may be expiried or your current payment method is still valid.");
    });
}