const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
require('dotenv').config();


router.get('/vendor', vendorController.vendorLogin);
router.post('/vendor',vendorController.vendorLoginSubmit);

router.get('/vendorSignup',vendorController.vendorSignup);
router.post('/vendorSignup',vendorController.vendorSignupPost);

module.exports = router;