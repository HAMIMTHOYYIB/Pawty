const bcrypt = require('bcrypt');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/admin');
const Order = require('../models/order')
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
  let orders = await Order.find({userId});
  console.log("orders : ",orders.length)
  const { tab } = req.query;
  res.render('users/account', { initialTab:'dashboard',user,orders});
  // res.render('users/account',{user,addError});
}
let editProfile = async (req,res) => {
  let userId = req.user.id;
  let user = await User.findOne({_id:userId});
  const {userName,email,phone} = req.body;
  user.username = userName;
  user.email = email;
  user.phone = phone;
  await user.save();
  res.json({ message: "Profile Updated."});
  
}
let changePass = async (req, res) => {
  const { currentPass, newPass, confirmPass } = req.body;
  let userId = req.user.id;
  let user = await User.findOne({ _id: userId });
  console.log("find user :",user);
  bcrypt.compare(currentPass, user.password, async (err, result) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    if (!result) {
      return res.render('users/account', { initialTab:'dashboard',user, passErr: 'Wrong Password' });
    }
    if (!newPass || !confirmPass) {
      return res.status(400).send('Password empty');
    }
    if (newPass !== newPass) {
      return res.status(400).send('Passwords do not match');
    }
    const hashedPassword = await bcrypt.hash(newPass, 10);
    user.password = hashedPassword;
    await user.save();
    res.redirect('/accountChangePass');
  });
};
let accountAddress = async(req,res) => {
  let userId = req.user.id;
  let user = await User.findOne({_id:userId});
  if(!user){
    return res.status(400).send('User Not found');
  }
  let orders = await Order.find({userId});
  console.log("orders : ",orders.length)
  const { tab } = req.query;
  res.render('users/account', { initialTab:'dashboard',user,orders});
}
let accountChangePass = async(req,res) => {
  let userId = req.user.id;
  let user = await User.findOne({_id:userId});
  if(!user){
    return res.status(400).send('User Not found');
  }
  let orders = await Order.find({userId});
  console.log("orders : ",orders.length)
  const { tab } = req.query;
  res.render('users/account', { initialTab: tab || 'changePass',user,orders});
}
let addAddress = async (req,res) => {
  let {name,locality,street,city,state,phone,pincode} =req.body;
  let userId = req.user.id;
  if(!userId){
    res.status(404).send('user Not Found')
  }
  let user = await User.findOne({_id:userId});
  if(user.address.length >= 4){
    let addError = 'Maximum 4 Address can be saved.'
    console.log(addError);
    return res.redirect('/account');
    // return res.render('users/account',{addError,user});
  }
  console.log("addresss lenghttt :",user.address.length);
  let newAddress = {name,locality,street,city,state,phone,pincode};
  user.address.push(newAddress);
  user.save();
  res.redirect('/accountAddress');
}
let editAddress = async (req, res) => {
  try {
    // console.log(req.user);
    const { id } = req.user;
    const { name, locality, street, city, state, phone, pincode } = req.body;
    
    // Find the user by userId
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(req.params);

    // Update the address
    const addressIndex = req.params.id
    console.log(addressIndex)
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.address[addressIndex] = {
      name,
      locality,
      street,
      city,
      state,
      phone,
      pincode
    };

    await user.save();
    // res.status(200)
    res.json({ message: "Address updated successfully", userAddress: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
let deleteAddress = async (req,res) => {
  const { addressId } = req.params;
  let userId = req.user.id;
  // console.log("addressId :",addressId,"user :",req.user);
  let user = await User.findOne({_id:userId});
  let updatedAdd = user.address.filter(add => add._id != addressId);
  user.address = updatedAdd
  user.save();
  console.log("updated Adres : ",updatedAdd);
  // await updatedUser.save();
  res.redirect('/accountAddress');
}

let userOrder = async (req,res) => {
  let userId = req.user.id;
  try {
    let user = await User.findOne({_id:userId});
    if(!user){
      return res.status(400).send('User Not found');
    }
    let orders= await Order.aggregate([
      {$unwind:'$products'},
      {$match:{'userId':req.user.id}}
    ]);
    for (let order of orders) {
      const vendor = await Vendor.findOne({ 'products._id': order.products._id });
      if (vendor) {
        const product = vendor.products.find(p => p._id.equals(order.products._id));
        order.products = {
          _id: product._id,
          productName: product.productName,
          description: product.description,
          price: product.price,
          brand: product.brand,
          category: product.category,
          subCategory: product.subCategory,
          stockQuantity: product.stockQuantity,
          addedOn: product.addedOn,
          images: product.images,
          status:order.products.status,
          quantity:order.products.quantity          
        };
      }
      let user = await User.findById(order.userId);
      // console.log("userr :",user);
      if (user) {
        order.userName = user.username;
        order.userEmail = user.email;
      }
    }
    console.log("orders :",orders)
    res.render('users/account', { initialTab:'orders',user,orders});
  } catch (error) {
    console.log(error);
    res.status(500).json({message:"Error on getting User Orders"})
  }
}

// Get ProductPage
let shop = async (req,res) => {
  let admin = await Admin.findOne();
  let products =  await Vendor.find().select("products");

  if (req.cookies.user_jwt) {
    jwt.verify(req.cookies.user_jwt, process.env.JWT_SECRET, async (err, decodedToken)=>{
      if(err){
        return res.render('users/shop-org',{products,admin,user:undefined});
      }else{
        req.user = decodedToken;
        let user = await User.findOne({_id:req.user.id});
        return res.render('users/shop-org',{products,admin,user:user});
      }
    });
  }else{
    return res.render('users/shop-org',{products,admin,user:undefined});
  }
}


// single product
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
  });
  if (req.cookies.user_jwt) {
    jwt.verify(req.cookies.user_jwt, process.env.JWT_SECRET, async (err, decodedToken)=>{
      if(err){
        return res.render('users/single-product',{product,user:undefined});
      }else{
        req.user = decodedToken
        let user = await User.findOne({_id:req.user.id});
        return res.render('users/single-product',{product,user});
      }
    });
  }else{
    return res.render('users/single-product',{product,user:undefined});
  }
}

// cart
let getcart = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.user.id });
    let cart = user.cart;
    let coupons = await Vendor.find().select("coupons")
    console.log("coupons :",coupons);
    res.render('users/cart', { userCart:cart,user,coupons });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}
let addtocart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;
  try {
    const vendor = await Vendor.findOne({ "products._id": productId });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const product = vendor.products.find(
      (prod) => prod._id.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const existingProductIndex = user.cart.products.findIndex((cartItem) => cartItem._id.toString() === productId);
    if (existingProductIndex !== -1) {
      user.cart.products[existingProductIndex].quantity += 1;
    } else {
      user.cart.products.push({
        _id: productId,
        quantity: 1,
        productName: product.productName,
        price: product.price,
        images: product.images,
      });
    };
    user.cart.total += parseFloat(product.price);
    await user.save();
    res.json({ message: "Product added to cart successfully", user });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Unable to add product to cart" });
  }
}
let removefromcart = async (req,res) => {
  try {
    let  { productId } = req.body;
    let user = await User.findOne({_id:req.user.id});
    let product  = user.cart.products.filter(prod => prod._id.toString() === productId);
    user.cart.products = user.cart.products.filter(prod => prod._id.toString() !== productId);
    user.cart.total = user.cart.total - (product[0].price * product[0].quantity);
    console.log("user cart total :",user.cart.total);
    console.log("product removed from cart");
    await user.save();
    res.json({message:"product removed",user,product})
  } catch (error) {
    res.status(500).send("Internal Server Error on product removal in cart")
  }
  // res.redirect('/cart');
}
let changeQuantity = async (req, res) => {
  const { productId,quantity } = req.body;
  try {
    const user = await User.findById(req.user.id);

    const productIndex = user.cart.products.findIndex(product => product._id.toString() === productId);
    if (productIndex !== -1) {
      user.cart.products[productIndex].quantity = quantity;
      user.cart.total = user.cart.products.reduce((total, product) => total + (product.price * product.quantity), 0);
      await user.save();
      res.status(200).json({ message: 'Quantity updated successfully',user,quantity});
    } else {
      res.status(404).json({ message: 'Product not found in cart' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
let checkCoupon = async (req, res) => {
  let user = await User.findById(req.user.id)
  const { couponCode } = req.body;
  try {
    const VendorCoupons = await Vendor.find().select("coupons");
    let coupons = VendorCoupons.map(val => val.coupons)
    let flatcoupon = coupons.flat(1);
    let coupon = flatcoupon.filter(val => val.couponCode == couponCode)
    if (coupon[0] && coupon[0].status === 'Active') {
      let currentDate = new Date();
      let endDate = new Date(coupon[0].endDate);
      let startDate = new Date(coupon[0].startDate);
      if (currentDate <= endDate && currentDate >= startDate) {
        let value;
        if (coupon[0].type === 'percentage') {
          let user = await User.findOne({_id:req.user.id});
          subtotal = user.cart.total;
          value = (subtotal * coupon[0].value) / 100;
        } else {
          value = coupon[0].value
        }
        user.cart.discount = value
        await user.save()
        res.json({ valid: true, value });
      } else {
        res.json({ valid: false, message: 'Coupon has expired' });
      }
    } else {
      res.json({ valid: false, message: 'Coupon is inactive or does not exist' });
    }
  } catch (error) {
    console.error('Failed to check coupon:', error);
    res.status(500).json({ error: 'Failed to check coupon' });
  }
};
let removeCoupon = async (req,res) => {
  let user =  await User.findById(req.user.id);
  if(!user){
    return res.status(500).json({valid:false,message:'cannot find user'})
  }
  console.log("removed coupon");
  user.cart.discount = 0;
  user.save();
  res.json({valid:true,message:'discount removed from the checkout'})
}

//wishlist
let getwishlist = async (req,res) => {
  try {
    let user = await User.findOne({_id:req.user.id})
    let wishlist = user.wishlist;
    res.render('users/wishlist',{wishlist,user});
  } catch (error) {
    consoler.error(error);
    res.status(500).send('Internal Server Error');
  }
}
let addtowishlist  = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;
  let existInWishlist = false;
  try {
    const vendor = await Vendor.findOne({ "products._id": productId });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const product = vendor.products.find(
      (prod) => prod._id.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const existingProductIndex = user.wishlist.products.findIndex((Item) => Item._id.toString() === productId);
    if (existingProductIndex !== -1) { //if exist remove from wishlist
      existInWishlist = false;
      user.wishlist.products = user.wishlist.products.filter((prod) => prod._id.toString() !== productId )
    } else {
      existInWishlist = true;
      user.wishlist.products.push({
        _id: productId,
        productName: product.productName,
        price: parseFloat(product.price),
        images: product.images,
        stockQuantity: parseFloat(product.stockQuantity)
      });
    };
    console.log("userwishlist :", user.wishlist);
    await user.save();
    res.json({ message: "Product added to wishlist successfully", user, productId, existInWishlist});
  }catch (error) {
    console.error("Error adding product to wishlist:", error);
    res.status(500).json({ error: "Unable to add product to wishlist" });
  }
}
let removefromwishlist = async (req,res) => {
  try {
    let  { productId } = req.body;
    let user = await User.findOne({_id:req.user.id});
    let product  = user.wishlist.products.filter(prod => prod._id.toString() === productId);
    user.wishlist.products = user.wishlist.products.filter(prod => prod._id.toString() !== productId);
    console.log("product removed from wishlist");
    await user.save();
    res.json({message:"product removed"});
  } catch (error) {
    res.status(500).send("Internal Server Error on product removal in wishlist");
  }
}


// checkout
let getCheckout = async (req,res) => {
  let user = await User.findById(req.user.id);
  if(user.cart.products.length === 0){
    return res.redirect('/cart');
  }
  res.render('users/checkout',{user,coupon:false})
}

let submitCheckout = async (req, res) => {
  const { addressId, paymentMethod } = req.body;
  console.log("req.body : ", req.body);
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let vendors = await Vendor.find()
    let address = user.address.filter(add => add._id.toString() === addressId)
    console.log("address : ",address[0]);
    
    let products = [];
    for (const prod of user.cart.products) {
      let vendorId = null;
      // Find the vendor ID for each product
      for (const vendor of vendors) {
        for (const product of vendor.products) {
          if (product._id.toString() === prod._id.toString()) {
            vendorId = vendor._id.toString();
            break;
          }
        }
        if (vendorId) {
          break;
        }
      }
      products.push({
        _id: prod._id,
        quantity: prod.quantity,
        vendorId: vendorId
      });
    }

    let shippingAddress = address[0]
    let newOrder = new Order({
      products: products,
      total: user.cart.total,
      discount: user.cart.discount,
      shippingAddress,
      paymentMethod: paymentMethod,
      userId: req.user.id
    });
    await newOrder.save();
    user.cart = { products: [], total: 0, discount: 0 };
    await user.save();
    res.status(201).json({ message: 'Order placed successfully', order: newOrder , shippingAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to place order' });
  }
};



// Get UserLoginPage
let loginPage = (req,res) => {
  if(req.cookies.user_jwt){
   return  res.redirect('/');
  }
  let addError = '';
  res.render('users/account-login',{passError :'',addError})
}
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
let submitSignup = async (req,res) => {
    console.log(req.body);
    const { username,email,phone,password,confirmPassword} = req.body;
    try {
        const userExist= await User.findOne({email:email});
        const phoneExist = await User.findOne({phone:phone});
        if(userExist){
            return res.status(400).render('users/account-signup',{errMsg:'User exist with this email.'})
        }
        if(phoneExist){
          return res.status(400).render('users/account-signup',{errMsg:'User exist with this Phone Number.'})
      }
        if(!password){
            res.status(400).send("Password empty");
        }
        if(password !== confirmPassword){
            res.status(400).send('password does not match');
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({username,email,phone,password:hashedPassword});
        await newUser.save();
        console.log(newUser);
        res.redirect('/login')
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
    editProfile,
    changePass,
    userOrder,

    accountAddress,
    accountChangePass,
    addAddress,
    editAddress,
    deleteAddress,

    shop,
    product,

    getcart,
    addtocart,
    changeQuantity,
    removefromcart,
    checkCoupon,

    getwishlist,
    addtowishlist,
    removefromwishlist,

    getCheckout,
    removeCoupon,
    submitCheckout,

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