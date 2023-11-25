function formatExpiryDate(event) {
    var input = event.target;
    var value = input.value;
    
    if (value.length === 2 && !value.includes("/")) {
      input.value = value + "/";
    }
  }
  