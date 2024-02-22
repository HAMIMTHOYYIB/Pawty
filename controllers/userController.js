const bcrypt = require('bcrypt');
const User = require('../models/User');
const nodemailer = require('nodemailer');
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

// Forget Password
// const forgetPassword = (req,res) => {
//     res.render('users/forgetPass',{passError :''})
// }
// const otpVer = (req,res) => {
//     res.render('users/otpVerification',{passError :''})
// }


// FORGOT PASSWORD -- STARTS FROM HERE

// FORGOT PASSWORD PAGE DISPLAY
let forgotGetPage = async (req, res) => {
    try {
      res.render("users/forgetPass");
    } catch (error) {
      res.status(404).send("page not found");
    }
  };
  
  ////////////////////////////////////////////////
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: 'smtp.gmail.com',
     port: 465,
    auth: {
      user: "hamimthoyyib@gmail.com",
      pass: "pfmuixviwdoxxalt",
    },
  });
  
  const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
      from: "hamimthoyyib@gmail.com",
      to: email,
      subject: "Reset Your Password",
      text: `Your OTP to reset your password is: ${otp}`,
    };
  
  
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent");
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };
  ////////////////////////////////////////////
  
  
  // FORGOT EMAIL POST + OTP GENERATION AND MAIL SEND
  let forgotEmailPostPage = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
      await user.save();
  
      await sendOtpEmail(email, otp);
  
      res.render("users/otpVerification",{email})
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };
  
  // RESET PASSWORD
  let resetPassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (user.otp !== otp || Date.now() > user.otpExpiration) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
  
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
  
      const bcryptedNewPassword = await bcrypt.hash(newPassword, 10)
      // Reset password
      user.password = bcryptedNewPassword;
      // Clear OTP fields
      user.otp = undefined;
      user.otpExpiration = undefined;
      await user.save();
      console.log("password resetted");

    
      res.status(200).render("users/account-login",{passError:''});
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };
  // FORGOT PASSWORD -- ENDS HERE
////////////////

module.exports={
    homePage,
    account,
    shop,
    loginPage,
    submitlogin,
    signupPage,
    submitSignup,
    forgotGetPage,
    forgotEmailPostPage,
    resetPassword,
    // otpVer,
    succesGoogleLogin,
    failureGooglelogin
}