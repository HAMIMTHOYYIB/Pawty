const Vendor = require('../models/Vendor');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config()

let vendorDashboard = (req,res) => {
    res.render('vendor/vendorDashboard')
}
let vendorLogin = (req,res) => {
  if(req.cookies.vendor_jwt){
    res.redirect('/vendor/dashboard')
  }else{
    res.render('vendor/vendorLogin',{passError:''})
  }
}

let vendorLoginSubmit = async (req,res) => {
    let {email,password} = req.body
    if(email && password){
        const vendorExist = await Vendor.findOne({email:email})
        if(!vendorExist){
            res.render('vendor/vendorLogin',{passError:'User Not Found'})
        }else{
          if(!vendorExist.Status){
            return res.render('vendor/vendorLogin',{passError:"Sorry, You Are Not Validated by the Admin"})
          }
            // console.log('Login Vendor :',vendorExist);
            bcrypt.compare(password, vendorExist.password, (err, result) => {
            if(!result){
                res.status(401).render('vendor/vendorLogin',{passError:'Wrong Password.'})
            }else{
              const token = jwt.sign({
                id: vendorExist._id,
                name: vendorExist.vendorName,
                email: vendorExist.email,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: "24h",
              }
            );
            res.cookie("vendor_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry
            console.log('Vendor Loggined succesfully : Token created.');
            res.redirect('/vendor/dashboard')
            }
            })
        }
    }else{
        res.render('vendor/vendorLogin',{passError:'Please Fill the input Fields.'})
    }
}


let vendorSignup = (req,res) => {
  res.render('vendor/vendorSignup',{passError:''})
}

let vendorSignupPost = async (req,res) => {
  // console.log(req.body);
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
          res.redirect('/vendor')
      }
  } catch (error) {
      res.status(500).send('Internal Server Error')
  }
}

let productList = async (req,res) => {
  let vendor = await Vendor.find();
  res.render('vendor/product-list',{vendor})
}

let addProduct = async (req,res) => {
  let admin = await Admin.findOne();
  if (!admin.category) {
    res.status(400).send('Category Not Found');
  }else{
    res.render('vendor/product-add',{admin})
  }
}

let submitAddProduct = async (req,res) => {
  let {ProductName,Price,Brand,Stock,Discription,image1,image2,image3,image4,Category,SubCategory} = req.body;

  let newProduct = {
    productName:ProductName,discription:Discription,price:Price,brand:Brand,category:Category,subCategory:SubCategory,stockQuantity:Stock
  }
  try {
    let vendor = await Vendor.findOne();
    if(!vendor){
      res.status(400).send('Vendor Not Found')
    }else{
      vendor.products.push(newProduct);
      await vendor.save();
      res.redirect('/vendor/product-list');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error')
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


let vendorLogout = (req, res) => {
  try {
      res.clearCookie("vendor_jwt");
      res.redirect("/vendor");
      console.log("Vendor logged out");
      return;
  } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).send("Internal Server Error");
  }
};

module.exports = {
    vendorDashboard,
    vendorLogin,
    vendorLoginSubmit,
    vendorSignup,
    vendorSignupPost,
    productList,  
    addProduct,
    submitAddProduct,
    vendorForgotPass,
    resetVendorPass,
    vendorLogout
}