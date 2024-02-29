const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 

router.get('/admin',adminController.adminLogin);
router.get('/Dashboard',adminController.dashboard);
router.post('/admin',adminController.submitAdminLogin);

router.get('/Customers',adminController.userList);
router.post('/userblock',adminController.userBlock);

// Category Management
router.get('/categories',adminController.categoryList);
router.get('/addCategory',adminController.addCategory);
router.post('/addCategory',adminController.submitAddCategory);
router.get('/editCategory/:id',adminController.editCategory);
router.post('/editCategory/:id',adminController.submitEditCategory);
router.post('/deleteCategory/:id',adminController.deleteCategory);

// SubCategory Management
router.get('/subCategories',adminController.subCategoryList);
router.get('/addSubCategory',adminController.addSubCategory);
router.post('/addSubCategory',adminController.submitAddSubCategory);
router.get('/editSubCategory/:id',adminController.editSubCategory);
router.post('/editSubCategory/:id',adminController.submitEditSubCategory);
router.post('/deleteSubCategory/:id',adminController.deleteSubCategory);

module.exports = router;