const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const adminController = require('../controllers/adminController'); 
const adminAuthMiddleware = require("../middleware/jwt_admin");

// Dashboard
router.get('/Dashboard',adminAuthMiddleware,adminController.dashboard);
// Admin LoginadminController
router.get('/admin',adminController.adminLogin);
router.post('/admin',adminController.submitAdminLogin);

router.get('/admin/vendorsPage',adminController.vendorsPage);

// User Management
router.get('/admin/Customers',adminAuthMiddleware,adminController.userList);
router.post('/userblock',adminController.userBlock);

// Vendor Management
router.get('/admin/Vendors',adminAuthMiddleware,adminController.vendorList);
router.post('/vendorVerify',adminController.vendorVerify);

// Category Management
router.get('/categories',adminAuthMiddleware,adminController.categoryList);
router.get('/addCategory',adminAuthMiddleware,adminController.addCategory);
router.post('/addCategory',adminController.submitAddCategory);
router.get('/editCategory/:id',adminAuthMiddleware,adminController.editCategory);
router.post('/editCategory/:id',adminController.submitEditCategory);
router.post('/deleteCategory/:id',adminController.deleteCategory);

// SubCategory Management
router.get('/subCategories',adminAuthMiddleware,adminController.subCategoryList);
router.get('/addSubCategory',adminAuthMiddleware,adminController.addSubCategory);
router.post('/addSubCategory',adminController.submitAddSubCategory);
router.get('/editSubCategory/:id',adminAuthMiddleware,adminController.editSubCategory);
router.post('/editSubCategory/:id',adminController.submitEditSubCategory);
router.post('/deleteSubCategory/:id',adminController.deleteSubCategory);


router.get('/admin-ProductView',adminAuthMiddleware,adminController.productList);
router.get('/admin-productDetails/:productId',adminAuthMiddleware,adminController.productDetails);
router.get('/admin-Orderview',adminAuthMiddleware,adminController.orderList);

router.get('/orders/total-price', adminAuthMiddleware , adminController.getGraphData);
router.get('/orders/total-orders', adminAuthMiddleware , adminController.getDayOrders);
router.post('/orderReport',adminAuthMiddleware,adminController.getOrderCvv);
router.post('/downloadOrders',adminAuthMiddleware,adminController.getOrderReport);

router.post('/downloadProduct/:productId',adminAuthMiddleware,adminController.productWiseOrder);
router.post('/ProductReport/:productId',adminAuthMiddleware,adminController.productWiseReport);

router.get('/bannerView',adminAuthMiddleware,adminController.updateBanners);
router.post('/changeMainBanner', upload.array('image',4), adminAuthMiddleware, adminController.changeMainBanner);


// admin logout
router.get('/admin/logout',adminController.adminLogout);

module.exports = router;