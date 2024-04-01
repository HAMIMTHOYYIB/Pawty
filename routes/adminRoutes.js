const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 
const adminAuthMiddleware = require("../middleware/jwt_admin");

// Dashboard
router.get('/Dashboard',adminAuthMiddleware,adminController.dashboard);
// Admin LoginadminController
router.get('/admin',adminController.adminLogin);
router.post('/admin',adminController.submitAdminLogin);

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
router.get('/admin-Orderview',adminAuthMiddleware,adminController.orderList);

// admin logout
router.get('/admin/logout',adminController.adminLogout);

module.exports = router;