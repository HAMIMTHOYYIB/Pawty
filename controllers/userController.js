const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config()

// Get Homepage
let homePage = (req,res) => {
    res.render('users/index-two')
}

// Get UserAccount
let account = (req,res) => {
    // if(req.user){
    //     console.log('email From Google Login : ',req.user.email);
    // }
    if(req.body)
    res.render('users/account')
}

// Get ProductPage
let shop = (req,res) => {
    res.render('users/shop-org')
}

// const loadAuth = (req,res) =>{
//     res.render('auth')
// }

// Get UserLoginPage
let loginPage = (req,res) => {
    res.render('users/account-login',{passError :''})
}
// Post SubmitUserLoginPage
let submitlogin = async (req, res) => {
    console.log("req.body : ", req.body);
    const {email, password} = req.body;
    if(email && password){
        try {
            const loginUser = await User.findOne({email: email});
            if (!loginUser) {
                return res.status(404).render('users/account-login', { passError: 'User Not Found' });             //send('User Not Found');
            }
            console.log("loginUser : ", loginUser);
            bcrypt.compare(password, loginUser.password, (err, result) => {
                if (err) {
                    // console.error("problem : ", err);
                    return res.status(500).send('Internal Server Error');
                }
                if (!result) {
                    return res.status(401).render('users/account-login',{passError : 'Wrong Password'});
                }
                // req.session.userId = loginUser._id;  //jwt
                res.render('users/account');
            });
        } catch (error) {
            console.log("Error on Login Submit",error);
            res.status(500).send("Internal Server Error");
        }  
    }else{
        res.render('users/account-login',{passError:'Please Complete the fields :'})
    }
}


// Get SignUpPage
let signupPage = (req,res) => {
    res.render('users/account-signup',{errMsg:''})
}
//Post SubmitSignup
let submitSignup = async (req,res) => {
    console.log(req.body);
    const { username,email,password,confirmPassword} = req.body;
    try {
        const userExist= await User.findOne({email:email});
        if(userExist){
            return res.status(400).render('users/account-signup',{errMsg:'User exist with this email.'})
        }
        if(!password){
            res.status(400).send("Password empty");
        }
        if(password !== confirmPassword){
            res.status(400).send('password does not match');
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({username,email,password:hashedPassword});
        await newUser.save();
        console.log(newUser);
        res.render('users/account');     
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}

const succesGoogleLogin = async (req,res) =>{
    if(!req.user){
        res.redirect('/failure')
    }
    console.log('Google Login Email :',req.user.email)
    let user = await User.findOne({email:req.user.email});
    if(!user){
        user = new User({
            username:req.user.displayName,
            email:req.user.email
        })
        await user.save();
        console.log('UserData Saved.');
    }
    res.redirect('/account')
}

const failureGooglelogin = (req,res) =>{
    res.send('Error')
}

module.exports={
    homePage,
    account,
    shop,
    loginPage,
    submitlogin,
    signupPage,
    submitSignup,
    succesGoogleLogin,failureGooglelogin
}