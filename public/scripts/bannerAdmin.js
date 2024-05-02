//  Modal for Home Page
document.getElementById('homeBannerForm').addEventListener('submit', function(event) {
    var fileInput = document.getElementById('homeBanner');
    if (fileInput.files.length === 0) {
        event.preventDefault(); // Prevent form submission
        document.getElementById('homeFileErrorMsg').classList.remove('d-none'); // Show error message
    }
});


// Modal for Home Page Offers
// 1
document.getElementById('offerBannerForm1').addEventListener('submit', function(event) {
    let fileInput = document.getElementById('offerBanner1');
    let offerValue = document.getElementById('offerVal');
    let title = document.getElementById('title1');
    let error = false;

    // Validate file input
    if (fileInput.files.length !== 1) {
        error = true;
        document.getElementById('offerFileErrorMsg1').classList.remove('d-none'); // Show error message
    }

    // Validate offer value
    if (offerValue.value.trim() === '') {
        error = true;
        offerValue.classList.add('is-invalid'); // Add validation class
    } else {
        offerValue.classList.remove('is-invalid');
    }

    // Validate title
    if (title.value.trim() === '') {
        error = true;
        title.classList.add('is-invalid'); // Add validation class
    } else {
        title.classList.remove('is-invalid');
    }

    // Prevent form submission if there are errors
    if (error) {
        event.preventDefault();
    }
});
// 2
document.getElementById('offerBannerForm2').addEventListener('submit', function(event) {
    let fileInput = document.getElementById('offerBanner2');
    let offerValue = document.getElementById('offerVal2');
    let title = document.getElementById('title2');
    let error = false;

    // Validate file input
    if (fileInput.files.length !== 1) {
        error = true;
        document.getElementById('offerFileErrorMsg2').classList.remove('d-none'); 
    }

    // Validate offer value
    if (offerValue.value.trim() === '') {
        error = true;
        offerValue.classList.add('is-invalid');
    } else {
        offerValue.classList.remove('is-invalid');
    }

    // Validate title
    if (title.value.trim() === '') {
        error = true;
        title.classList.add('is-invalid'); 
    } else {
        title.classList.remove('is-invalid');
    }

    if (error) {
        event.preventDefault();
    }
});
// 3
document.getElementById('offerBannerForm3').addEventListener('submit', function(event) {
    let fileInput = document.getElementById('offerBanner3');
    let offerValue = document.getElementById('offerVal3');
    let title = document.getElementById('title3');
    let error = false;

    if (fileInput.files.length !== 1) {
        error = true;
        document.getElementById('offerFileErrorMsg3').classList.remove('d-none'); // Show error message
    }

    if (offerValue.value.trim() === '') {
        error = true;
        offerValue.classList.add('is-invalid'); // Add validation class
    } else {
        offerValue.classList.remove('is-invalid');
    }

    if (title.value.trim() === '') {
        error = true;
        title.classList.add('is-invalid'); // Add validation class
    } else {
        title.classList.remove('is-invalid');
    }

    if (error) {
        event.preventDefault();
    }
});

// multipage banner modal
document.getElementById('singleBannerForm').addEventListener('submit', function(event) {
    var fileInput = document.getElementById('singleBanner');
    if (fileInput.files.length === 0) {
        event.preventDefault(); // Prevent form submission
        document.getElementById('singleErrMsg').classList.remove('d-none'); // Show error message
    }
});
        