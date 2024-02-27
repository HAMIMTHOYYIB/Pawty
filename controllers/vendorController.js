const Vendor = require('../models/Vendor')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config()

let vendorDashboard = (req,res) => {
    res.render('vendor/vendorDashboard')
}
let vendorLogin = (req,res) => {
    res.render('vendor/vendorLogin',{passError:''})
}

let vendorLoginSubmit = async (req,res) => {
    let {email,password} = req.body
    if(email && password){
        const vendorExist = await Vendor.findOne({email:email})
        if(!vendorExist){
            res.render('vendor/vendorLogin',{passError:'User Not Found'})
        }else{
            console.log('Login Vendor :',vendorExist);
            bcrypt.compare(password, vendorExist.password, (err, result) => {
            if(!result){
                res.status(401).render('vendor/vendorLogin',{passError:'Wrong Password.'})
            }else{
                // let name = vendorExist.vendorName
                res.render('vendor/vendorDashboard',{vendorExist})
            }
            })
        }
    }else{
        res.render('vendor/vendorLogin',{passError:'Please Fill the input Fields.'})
    }
}


// FORGOT PASSWORD 
let forgotGetPage = async (req, res) => {
    try {
      res.render("users/forgetPass",{passError:""});
    } catch (error) {
      res.status(404).send("page not found");
    }
  };
  
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: 'smtp.gmail.com',
    port: 465,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});
  
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
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
  
  
  // FORGOT EMAIL POST + OTP GENERATION AND MAIL SEND
  let vendorForgotPass = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await Vendor.findOne({ email });
  
      if (!user) {
        return res.status(404).render('vendor/vendorForgetPass',{passError: "User not found with this email" });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiration = Date.now() + 1 * 60 * 1000; // OTP expires in 1 minute
      await user.save();
  
      await sendOtpEmail(email, otp);
  
      res.render("users/otpVerification",{email})
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };
  
  // RESET PASSWORD
  let resetVendorPass = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).render('users/otpVerification',{ passError: "User not found" });
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


  let vendorSignup = (req,res) => {
    res.render('vendor/vendorSignup',{passError:''})
  }
  let vendorSignupPost = async (req,res) => {
    console.log(req.body);
    let {name,email,password} = req.body
    try {
        let vendorExisted = await Vendor.findOne({email});
        if(vendorExisted){
            res.status(400).render('vendor/vendorSignup',{passError:'Reseller Exist With this E-mail'})
        }else{
            const hashedPass = await bcrypt.hash(password,10)
            const newVendor = new Vendor({vendorName:name,email,password:hashedPass})
            await newVendor.save();
            console.log('New Vendor Added Successfully');
            vendorExist = newVendor;
            res.render('vendor/vendorDashboard',{vendorExist});
        }
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
  }

module.exports = {
    vendorLogin,
    vendorLoginSubmit,
    vendorForgotPass,
    resetVendorPass,
    vendorSignup,
    vendorSignupPost,
    vendorDashboard
}