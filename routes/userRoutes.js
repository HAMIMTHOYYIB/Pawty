const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');  
const passport = require('passport')
const userAuth = require('../middleware/jwt_user');
const preventBack = require("../middleware/preventBack");

require('../helpers/passport')
require('dotenv').config()

router.use(passport.initialize())
router.use(passport.session())

// Home page
router.get('/', preventBack, userController.homePage);

// Signup & Login
router.get('/login',userController.loginPage);
router.post('/loginUser',userController.submitlogin);
router.get('/signup',userController.signupPage);
router.post('/signupUser',userController.submitSignup);

router.get('/account',userAuth,userController.account);
router.post('/editprofile',userAuth,userController.editProfile);
router.post('/changePassword',userAuth,userController.changePass);
router.get('/orders',userAuth,userController.userOrder);

// Address management
router.get('/accountAddress',userAuth,userController.accountAddress);
router.get('/accountChangePass',userAuth,userController.accountChangePass);
router.post('/addAddress/:val',userAuth,userController.addAddress);
router.post('/editAddress/:id', userAuth, userController.editAddress);
router.get('/addressDelete/:addressId', userAuth, userController.deleteAddress);

router.get('/shop',userController.shop);
router.get('/product/:id',userController.product);
router.post('/filter',userController.filterProduct)
// Assuming you have a route to handle the filter request


router.get('/cart',userAuth,userController.getcart);
router.post('/addToCart',userController.addtocart);
router.post('/updateCart',userAuth,userController.changeQuantity);
router.post('/removeFromCart',userAuth,userController.removefromcart);
router.post('/check-coupon',userAuth,userController.checkCoupon);
router.post('/remove-coupon',userAuth,userController.removeCoupon)

router.get('/wishlist',userAuth,userController.getwishlist);
router.post('/addToWishlist',userAuth,userController.addtowishlist);
router.post('/removeFromWishlist',userAuth,userController.removefromwishlist);

router.post('/checkCart',userAuth,userController.checkCart)
router.get('/checkout',userAuth,userController.getCheckout);
router.post('/checkout',userAuth,userController.submitCheckout);
router.post("/cancelOrder",userAuth,userController.requestCancellation);
router.post('/razorpay/order',userAuth,userController.razorpayOrder);

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