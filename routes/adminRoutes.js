const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 

router.get('/admin',adminController.adminLogin);
router.get('/adminDashboard',adminController.dashboard);
router.post('/admin',adminController.submitAdminLogin);
module.exports = router;