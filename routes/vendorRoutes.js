const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const vendorAuth = require('../middleware/jwt_vendor');
const upload = require('../config/multer');
require('dotenv').config();

//Vendor Dashboard
router.get('/vendor/dashboard',vendorAuth,vendorController.vendorDashboard);

// Vendor Login
router.get('/vendor',vendorController.vendorLogin);
router.post('/vendor',vendorController.vendorLoginSubmit);

// Vendor Signup
router.get('/vendorSignup',vendorController.vendorSignup);
router.post('/vendorSignup',vendorController.vendorSignupPost);

// Product Management
router.get('/vendor/product-list',vendorAuth,vendorController.productList);
router.get('/vendor/add-product',vendorAuth,vendorController.addProduct);
router.post('/vendor/add-product',vendorAuth, upload.array('image',4), vendorController.submitAddProduct);
router.post('/vendor/editProduct/:id',vendorAuth,vendorController.editProduct);
router.post('/vendor/submitEditProduct/:id',vendorAuth, upload.array('image', 4), vendorController.submitEditProduct);
router.post('/vendor/deleteProduct/:id',vendorAuth,vendorController.deleteProduct);

// Coupon Management
router.get('/vendor/addCoupon',vendorAuth,vendorController.addCoupon)
router.get('/vendor/couponList',vendorAuth,vendorController.listCoupon)
router.post('/vendor/addCoupon',vendorAuth,vendorController.submitAddCoupon)
router.get('/vendor/editCoupon/:couponId',vendorAuth,vendorController.editCoupon)
router.post('/vendor/editCoupon/:couponId',vendorAuth,vendorController.submitEditCoupon)
router.post('/vendor/removeCoupon',vendorAuth,vendorController.deleteCoupon)

router.get('/vendor/orderList',vendorAuth,vendorController.getOrderList);
router.post('/vendor/orderStatus/:orderId/:productId',vendorAuth,vendorController.updateStatus)

// vendor Logout
router.get('/vendor/logout',vendorController.vendorLogout);

module.exports = router;