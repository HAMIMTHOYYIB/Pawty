const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 

router.get('/admin',adminController.adminLogin);
router.get('/Dashboard',adminController.dashboard);
router.post('/admin',adminController.submitAdminLogin);
router.get('/categories',adminController.categoryList);
router.get('/Customers',adminController.userList);
router.post('/userblock',adminController.userBlock);
router.get('/addCategory',adminController.addCategory);
router.post('/addCategory',adminController.submitAddCategory)

module.exports = router;