const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
require('dotenv').config();

router.get('/vendor/dashboard',vendorController.vendorDashboard);

router.get('/vendor', vendorController.vendorLogin);
router.post('/vendor',vendorController.vendorLoginSubmit);

router.get('/vendorSignup',vendorController.vendorSignup);
router.post('/vendorSignup',vendorController.vendorSignupPost);

router.get('/vendor/product-list',vendorController.productList);
router.get('/vendor/add-product',vendorController.addProduct);
router.post('/vendor/add-product',vendorController.submitAddProduct);

module.exports = router;