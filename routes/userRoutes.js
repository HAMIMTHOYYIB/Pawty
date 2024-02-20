const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.homePage);
router.get('/account',userController.account);
router.get('/shop',userController.shop);
router.get('/login',userController.loginPage)
router.post('/loginUser',userController.submitlogin);
router.get('/signup',userController.signupPage);
router.post('/signupUser',userController.submitSignup);


module.exports = router;