const bcrypt = require('bcrypt');
const User = require('../models/User');

// Get Homepage
let homePage = (req,res) => {
    res.render('users/index-two')
}
// Get UserAccount
let account = (req,res) => {
    res.render('users/account')
}
// Get ProductPage
let shop = (req,res) => {
    res.render('users/shop-org')
}

// Get UserLoginPage
let loginPage = (req,res) => {
    res.render('users/account-login')
}
// Post SubmitUserLoginPage
let submitlogin =(req,res) => {
    console.log(req.body);
    const {email,password} = req.body;
    if(email,password){
        res.render('users/account')
    }
}

// Get SignUpPage
let signupPage = (req,res) => {
    res.render('users/account-signup')
}
//Post SubmitSignup
let submitSignup = async (req,res) => {
    console.log(req.body);
    const { username,email,password} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = new User({username,email,password:hashedPassword});
    await newUser.save();
    res.render('users/account')
}

module.exports={
    homePage,
    account,
    shop,
    loginPage,
    submitlogin,
    signupPage,
    submitSignup
}
