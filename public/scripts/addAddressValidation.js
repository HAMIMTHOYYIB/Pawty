// Password changing eye show and hide password
document.getElementById('toggle-current-pwd').addEventListener('click', function() {
    var pwdInput = document.getElementById('current-pwd');
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('toggle-new-pwd').addEventListener('click', function() {
    var pwdInput = document.getElementById('new-pwd');
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('toggle-confirm-pwd').addEventListener('click', function() {
    var pwdInput = document.getElementById('confirm-pwd');
    pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });


// Change Password Validation
document.getElementById('submit-btn').addEventListener('click', function () {
    var currentPassword = document.getElementById('current-pwd').value;
    var newPassword = document.getElementById('new-pwd').value;
    var confirmPassword = document.getElementById('confirm-pwd').value;
    var currentPasswordError = document.getElementById('current-password-error');
    var newPasswordError = document.getElementById('new-password-error');
    var confirmPasswordError = document.getElementById('confirm-password-error');
    var isValid = true;

    // Reset error messages
    currentPasswordError.innerHTML = '';
    newPasswordError.innerHTML = '';
    confirmPasswordError.innerHTML = '';

    // Validate current password
    if (currentPassword.length === 0) {
      currentPasswordError.innerHTML = 'Please enter your current password.';
      isValid = false;
    }

    // Validate new password
    if (newPassword.length < 6) {
      newPasswordError.innerHTML = 'New password must be at least 6 characters long.';
      isValid = false;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      confirmPasswordError.innerHTML = 'Passwords do not match.';
      isValid = false;
    }

    // If no errors, submit form
    if (isValid) {
      axios.post('/changePassword', {
        currentPass: currentPassword,
        newPass: newPassword
      })
      .then(function (response) {
        // Handle successful response
        console.log(response);
        // Clear input fields
        document.getElementById('current-pwd').value = '';
        document.getElementById('new-pwd').value = '';
        document.getElementById('confirm-pwd').value = '';
        // // Show toast message
        Toastify({
            text: "Password updated",
            duration: 2000, // 3 seconds
            gravity: "top", // Display at the top
            position: 'center', // Display on the right side
            backgroundColor: "#203e5a", // Background color
            stopOnFocus: true, // Stop the timer when the toast is focused
        }).showToast();
    })
          .catch(function (error) {
            console.log("working catch block")
          // Handle error
          console.error(error);
          if (error.response.status === 400) {
              // Assuming you have a div with id "current-password-error" to show current password error
              document.getElementById('current-password-error').innerHTML = error.response.data.error;
          } else {
              // Handle other errors
              console.log("error on changing Password");
          }
      });
    }
});


// Add Address validtion.
function validateForm(event) {
    console.log("Validation function working now...");

    const name = document.getElementById("addName").value;
    const locality = document.getElementById("addLocality").value;
    const street = document.getElementById("addStreet").value;
    const city = document.getElementById("addCity").value;
    const state = document.getElementById("addState").value;
    const phone = document.getElementById("addPhone").value;
    const pincode = document.getElementById("addPincode").value;

    let isValid = true;

    // Reset error messages
    document.getElementById("addName-error").textContent = "";
    document.getElementById("addLocality-error").textContent = "";
    document.getElementById("addStreet-error").textContent = "";
    document.getElementById("addCity-error").textContent = "";
    document.getElementById("addState-error").textContent = "";
    document.getElementById("addPhone-error").textContent = "";
    document.getElementById("addPincode-error").textContent = "";

    // Validate name
    if (!name.trim()) {
        document.getElementById("addName-error").textContent = "Name is required";
        isValid = false;
    }

    // Validate locality
    if (!locality.trim()) {
        document.getElementById("addLocality-error").textContent = "Locality is required";
        isValid = false;
    }

    // Validate street
    if (!street.trim()) {
        document.getElementById("addStreet-error").textContent = "Street is required";
        isValid = false;
    }

    // Validate city
    if (!city.trim()) {
        document.getElementById("addCity-error").textContent = "City is required";
        isValid = false;
    }

    // Validate state
    if (state === "") {
        document.getElementById("addState-error").textContent = "Please select a state";
        isValid = false;
    }

    // Validate phone number
    if (phone.trim().length !== 10) {
        document.getElementById("addPhone-error").textContent = "Phone number must be 10 digits";
        isValid = false;
    }

    // Validate pincode
    if (pincode.trim().length !== 6) {
        document.getElementById("addPincode-error").textContent = "Pincode must be 6 digits";
        isValid = false;
    }

    // Prevent form submission if validation fails
    if (!isValid) {
        event.preventDefault();
    }
}


//  function to Request Order Cancellation.
function requestCancellation(orderId, productId , index) {
    Swal.fire({
     title: "Cancellation Request",
     text: "Are you sure you want to cancel this order?",
     icon: "question",
     confirmButtonText: "Cancel Order",
     showCancelButton: true,
     cancelButtonText: "Go Back",
     reverseButtons: true
   }).then((result) => {
     if (result.isConfirmed) {
       axios.post('/cancelOrder', {
       orderId: orderId,
       productId: productId
   })
   .then(function (response) {
       // Handle successful cancellation
       console.log("order Cancellation request send",index,response);
       document.getElementById('textCancelOrder-' + index).textContent = 'Requested for Order Cancellation';
       document.getElementById(index).textContent = 'Requested for Cancellation';
       document.getElementById("ind"+index).textContent = 'Requested for Cancellation';
       document.getElementById("inde"+index).textContent = 'Requested for Cancellation';
       document.getElementById("ind"+index).style.color = 'red';
       document.getElementById("inde"+index).style.color = 'red';
       document.getElementById(index).style.color = 'red';
         $('#orderModal-' + index).modal('hide');
         // $('body').removeClass('modal-open');
         $('.modal-backdrop').remove();
        Toastify({
           text: "Order cancellation request sent",
           duration: 2000, // 3 seconds
           gravity: "top", // Display at the top
           position: 'right', // Display on the right side
           backgroundColor: "orange", // Background color
           stopOnFocus: true, // Stop the timer when the toast is focused
       }).showToast();
   })
   .catch(function (error) {
       // Handle cancellation error
       console.error(error);
       // Show error message
       Toastify({
           text: "Error requesting cancellation",
           duration: 3000, // 3 seconds
           close: true,
           gravity: "top", // Display at the top
           position: 'right', // Display on the right side
           backgroundColor: "red", // Background color
           stopOnFocus: true, // Stop the timer when the toast is focused
       }).showToast();
   })
     // } else if (
     //   result.dismiss === Swal.DismissReason.cancel
     // ) {
     //   swalWithBootstrapButtons.fire({
     //     title: "Cancelled",
     //     text: "Your imaginary file is safe :)",
     //     icon: "error"
     //   });
     }
 });
};
