// Submit Order  validation
document.addEventListener('DOMContentLoaded', () => {
const placeOrderBtn = document.getElementById('btn-place-order');
const agreeCheckbox = document.getElementById('privacy');
const errMsg = document.getElementById('errMsg');

    document.getElementById('btn-place-order').addEventListener('click', async () => {
    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked').value;
    const selectAddress = document.querySelector('input[name="addressId"]:checked')
    let selectedAddress;
    if (!selectedPayment) {
        errMsg.innerText = 'Please select a payment method.';
        return;
    }
    if (!selectAddress) {
        console.log("no address :",selectAddress)
        errMsg.innerText = 'Please select a billing address.';
        return;
    }
    if(selectAddress){
        console.log("yes address :",selectAddress)
        selectedAddress = selectAddress.value;
        console.log("yaaas address :",selectedAddress)

    }
    if (!agreeCheckbox.checked) {
        errMsg.innerText = 'Please agree to the terms and conditions.';
        return;
    }
    errMsg.innerText = '';
    try {
        console.log("payment methoddd :",selectedPayment)
        if (selectedPayment == 'Razorpay') {
        const orderData = {
            paymentMethod: selectedPayment,
            addressId: selectedAddress,
        };
        const response = await axios.post('/razorpay/order', orderData);
        if (response.status === 200) {
            const { orderId, razorpayOrderId, razorpayApiKey , total } = response.data;
            const options = {
            key:razorpayApiKey,
            amount: total, 
            currency: 'INR',
            order_id: razorpayOrderId,
            name: 'Pawty',
            description: 'Order payment',
            handler: function (response) {
                console.log(response);
                // You can then submit the order
                let raz = razorpayOrderId;
                submitOrder(selectedPayment, selectedAddress,raz);
            },
            prefill: {
                name: user.username,
                email: user.email,
                contact:user.phone,
                logo: 'https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png'
            },
            notes: {
                address: selectedAddress,
            },
            theme: {
                color: '#203e5a',
            },
            };
            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            Swal.fire({
            title: 'Error!',
            text: 'Failed to create Razorpay order',
            icon: 'error',
            });
        }
        } else {
        let raz = false;
        submitOrder(selectedPayment, selectedAddress,raz);
        }
    } catch (error) {
        console.error('Error placing order:', error.response.data);
        Swal.fire({
        title: 'Error!',
        text: 'Failed to place order',
        icon: 'error',
        });
    }
    });

    async function submitOrder(paymentMethod, addressId , razor) {
        try {
        const orderData = { 
            paymentMethod,
            addressId,
            razor
        };
        const response = await axios.post('/checkout', orderData);
        if (response.status === 201) {
            const orderDetails = response.data.order;
            Swal.fire({
            title: 'Order Placed!',
            text: 'Your order has been placed successfully!',
            icon: 'success',
            html: `
                <p><b>Payment Method:</b> ${orderDetails.paymentMethod}</p>
                <small class="text-uppercase"><b>Billing Address: </b>${orderDetails.shippingAddress.name}<br>${orderDetails.shippingAddress.street}, ${orderDetails.shippingAddress.locality}, ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state}.<br>${orderDetails.shippingAddress.pincode}</small><br>
                <small><b>OrderId:</b> ${orderDetails._id}</small>
            `,
            confirmButtonText: 'View Orders',              
            }).then(() => {
            window.location.href = '/orders';
            });
        } else {
            Swal.fire({
            title: 'Error!',
            text: 'Failed to place order',
            icon: 'error',
            });
        }
        } catch (error) {
        console.error('Error placing order:', error.response.data);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to place order',
            icon: 'error',
        });
        }
    }
});


// Checkout Add-Address Validation
function validateForm(event) {
    let isValid = true;
    console.log("fuctionnnn wokringg ")

    // Name validation
    let name = document.getElementById('name').value.trim();
    if (name === '') {
      document.getElementById('name-error').innerText = 'Name is required';
      isValid = false;
    } else {
      document.getElementById('name-error').innerText = '';
    }

    // Locality validation
    let locality = document.getElementById('locality').value.trim();
    if (locality === '') {
      document.getElementById('locality-error').innerText = 'Locality is required';
      isValid = false;
    } else {
      document.getElementById('locality-error').innerText = '';
    }

    // Street validation
    let street = document.getElementById('street').value.trim();
    if (street === '') {
      document.getElementById('street-error').innerText = 'Street is required';
      isValid = false;
    } else {
      document.getElementById('street-error').innerText = '';
    }

    // City validation
    let city = document.getElementById('city').value.trim();
    if (city === '') {
      document.getElementById('city-error').innerText = 'City is required';
      isValid = false;
    } else {
      document.getElementById('city-error').innerText = '';
    }

    // State validation
    let state = document.getElementById('state').value;
    if (state === '') {
      document.getElementById('state-error').innerText = 'State is required';
      isValid = false;
    } else {
      document.getElementById('state-error').innerText = '';
    }

    // Phone validation
    let phone = document.getElementById('phone').value.trim();
    if (phone === '' || phone.length !== 10) {
      document.getElementById('phone-error').innerText = 'Phone number must be 10 digits';
      isValid = false;
    } else {
      document.getElementById('phone-error').innerText = '';
    }

    // Pincode validation
    let pincode = document.getElementById('pincode').value.trim();
    if (pincode === '' || pincode.length !== 6) {
      document.getElementById('pincode-error').innerText = 'Pincode must be 6 digits';
      isValid = false;
    } else {
      document.getElementById('pincode-error').innerText = '';
    }
    if(isValid === false){
        return event.preventDefault();
      }
    
}