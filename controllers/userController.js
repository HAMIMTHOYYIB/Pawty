const bcrypt = require('bcrypt');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/admin');
let Address = User.address;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config()


// Get Homepage
let homePage = (req,res) => {
    res.render('users/index-two')
}

// Get UserAccount
let account = async (req,res) => {
  let userId = req.user.id;
  let user = await User.findOne({_id:userId});
  if(!user){
    return res.status(400).send('User Not found');
  }
  let addError = ''
  res.render('users/account',{user,addError});
}

// Add New Address
let addAddress = async (req,res) => {
  let {name,locality,street,city,state,phone,pincode} =req.body;
  let userId = req.user.id;
  if(!userId){
    res.status(404).send('user Not Found')
  }
  let user = await User.findOne({_id:userId});
  if(user.address.length >= 4){
    let addError = 'Maximum 4 Address can be saved.'
     return res.render('users/account',{addError,user});
  }
  console.log("addresss lenghttt :",user.address.length);
  let newAddress = {name,locality,street,city,state,phone,pincode};
  user.address.push(newAddress);
  user.save();
  res.redirect('/account');
}

// let editAddress = async (req, res) => {
//   // Update the address in the database based on the request body
//   // This is just an example, you should implement your own logic
//   await Address.findByIdAndUpdate(req.body.id, req.body, { new: true }, (err, updatedAddress) => {
//       if (err) {
//           res.status(500).send('Failed to update address');
//       } else {
//           res.status(200).send('Address updated successfully');
//       }
//   });
// };


let editAddress = async (req, res) => {
  try {
    // console.log(req.user);
    const { id } = req.user;
    console.log("req.body :",req.body);
    const { name, locality, street, city, state, phone, pincode } = req.body;
    
    // Find the user by userId
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the address
    const addressIndex = user.address.findIndex(add => add._id.toString() === req.params.id);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.address[addressIndex] = {
      _id: req.params.id,
      name,
      locality,
      street,
      city,
      state,
      phone,
      pincode
    };

    await user.save();
    res.status(200).redirect('/account')
    // res.json({ message: "Address updated successfully", user: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Get ProductPage
let shop = async (req,res) => {
  let admin = await Admin.findOne();
  let products =  await Vendor.find().select("products");
  console.log("products :",products);
  res.render('users/shop-org',{products,admin})
}

let product = async (req,res) => {
  let productId = req.params.id;
  let vendors = await Vendor.find();
  let product;
  vendors.forEach(vendor => {
    vendor.products.forEach(prod => {
      if(prod._id.toString() === productId){
        product = prod;
      }
    })
  })
  // let products =await Vendor.find().select("products");
  // let product = vendor.products.find(product => product.id.toString() === productId);
  // let product = vendor.products.find(product => product._id === productId);
  console.log("The Product :",product);
  res.render('users/single-product',{product});
}

// Get UserLoginPage
let loginPage = (req,res) => {
  if(req.cookies.user_jwt){
   return  res.redirect('/');
  }
  let addError = '';
  res.render('users/account-login',{passError :'',addError})
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
                if (loginUser.Blocked) {
                  console.log('This Account has been restricted by the Admin');
                  return res.render('users/account-login', { passError: 'This Account is Restricted by the admin' });
                }
                const token = jwt.sign({
                  id: loginUser._id,
                  name: loginUser.username,
                  email: loginUser.email,
                },
                process.env.JWT_SECRET,
                {
                  expiresIn: "24h",
                }
              );
              res.cookie("user_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry
              console.log('User Loggined succesfully : Token created.');
                // res.render('users/account',{addError:''});
                res.redirect('/');
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
        let addError = ''
        res.render('users/account',{addError});     
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
        res.redirect('/login')
    }else{
      if (user.Blocked) {
        console.log('User is blocked ');
        return res.render('users/account-login', { passError: 'Your Account has been restricted by the Admin' });
      }
      console.log("login with google");

      const token = jwt.sign({
        id: user._id,
        name: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
    res.cookie("user_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry
    console.log('User Loggined succesfully : Token created.');
      // res.render('users/account');
      res.redirect('/');
    }

}

const failureGooglelogin = (req,res) =>{
    res.send('Error')
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
  let forgotPassPost = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).render('users/forgetPass',{passError: "User not found with this email" });
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


  let userLogout = (req, res) => {
    try {
        res.clearCookie("user_jwt");
        res.redirect("/");
        console.log("User logged out");
        return;
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).send("Internal Server Error");
    }
  };
module.exports={
    homePage,
    account,
    addAddress,
    editAddress,
    shop,
    product,
    loginPage,
    submitlogin,
    signupPage,
    submitSignup,
    forgotGetPage,
    forgotPassPost,
    resetPassword,
    succesGoogleLogin,
    failureGooglelogin,
    userLogout
}