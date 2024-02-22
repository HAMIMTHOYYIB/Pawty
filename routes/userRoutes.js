const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');  
const passport = require('passport')
require('../passport')
require('dotenv').config()

router.use(passport.initialize())
router.use(passport.session())

// const userController = require('../controllers/userController');


router.get('/', userController.homePage);
router.get('/account',userController.account);
router.get('/shop',userController.shop);
router.get('/login',userController.loginPage)
router.post('/loginUser',userController.submitlogin);
router.get('/signup',userController.signupPage);
router.post('/signupUser',userController.submitSignup);

router.get('/forgetPass',userController.forgotGetPage);
router.post('/forgetPass',userController.forgotEmailPostPage);
router.post('/resetPass',userController.resetPassword)

// router.get('/otpVerification',userController.otpVer)



// router.get('/',userController.loadAuth)


router.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))

router.get(
    '/auth/google/callback',
    passport.authenticate('google',{
        successRedirect:'/success',
        failureRedirect:'/failure'
    })
)
// success
router.get('/success',userController.succesGoogleLogin)
// failure
router.get('/failure',userController.failureGooglelogin)

module.exports = router;