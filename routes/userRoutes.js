const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');  
const passport = require('passport')
const userAuth = require('../middleware/jwt_user');

require('../helpers/passport')
require('dotenv').config()

router.use(passport.initialize())
router.use(passport.session())

// Home page
router.get('/', userController.homePage);

// Signup & Login
router.get('/login',userController.loginPage);
router.post('/loginUser',userController.submitlogin);
router.get('/signup',userController.signupPage);
router.post('/signupUser',userController.submitSignup);

router.get('/account',userAuth,userController.account);
router.post('/editprofile',userAuth,userController.editProfile);
router.post('/changePassword',userAuth,userController.changePass);

// Address management
router.get('/accountAddress',userAuth,userController.accountAddress);
router.get('/accountChangePass',userAuth,userController.accountChangePass);
router.post('/addAddress',userAuth,userController.addAddress);
router.post('/editAddress/:id', userAuth, userController.editAddress);
router.get('/addressDelete/:addressId', userAuth, userController.deleteAddress);

router.get('/shop',userController.shop);
router.get('/product/:id',userController.product);

// Logout
router.get('/logout',userController.userLogout);

// other Authentication
router.get('/forgetPass',userController.forgotGetPage);
router.post('/forgetPass',userController.forgotPassPost);
router.post('/resetPass',userController.resetPassword);

// GoogleAuth
router.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))
router.get('/auth/google/callback',
 passport.authenticate('google',{successRedirect:
                                '/success',
                                failureRedirect:'/failure'
                            }
                        )
)
// success
router.get('/success',userController.succesGoogleLogin)
// failure
router.get('/failure',userController.failureGooglelogin)


module.exports = router;