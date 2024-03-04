const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const vendorAuth = require('../middleware/jwt_vendor');
require('dotenv').config();

//Vendor Dashboard
router.get('/vendor/dashboard',vendorAuth,vendorController.vendorDashboard);

// Vendor Login
router.get('/vendor',vendorController.vendorLogin);
router.post('/vendor',vendorController.vendorLoginSubmit);

// Vendor Signup
router.get('/vendorSignup',vendorAuth,vendorController.vendorSignup);
router.post('/vendorSignup',vendorController.vendorSignupPost);

// Product Management
router.get('/vendor/product-list',vendorAuth,vendorController.productList);
router.get('/vendor/add-product',vendorAuth,vendorController.addProduct);
router.post('/vendor/add-product',vendorController.submitAddProduct);

// vendor Logout
router.get('/vendor/logout',vendorController.vendorLogout);

module.exports = router;