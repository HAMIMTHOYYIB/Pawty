const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/admin');
const Order = require('../models/order');
let helper = require('../helpers/user');
let productHelper = require('../helpers/getProductDetails');
let { sendOtpEmail } = require('../helpers/sentEmail');
let htmlToPdf = require('../helpers/htmlToPdf')
// const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const razorpayInstance = require('../config/razorpay');
// const { validationResult } = require('express-validator');
require('dotenv').config()


// Get Homepage
let homePage = async (req,res) => {
  try {
    let admin = await Admin.findOne();
    let category = admin.category;
    let subCategory = admin.subCategory;
    let banner = admin.banner;
    let vendors = await Vendor.find().select("products");
    let products = vendors.map((vendor) => vendor.products).flat();
    let productsBySubCategory = {};
    for (let i = 0; i < subCategory.length; i++) {
      let subCategoryProducts = vendors
        .map((vendor) => vendor.products.filter((product) => product.subCategory === subCategory[i]))
        .flat();
      productsBySubCategory[subCategory[i]] = subCategoryProducts;
    }
    res.render('users/index-two', { category, subCategory, productsBySubCategory, products, banner });
  } catch (error) {
    res.status(500).send("Error on rendering home page")
  }
}
// Get UserAccount
let account = async (req,res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({_id:userId});
    if(!user){
      return res.status(400).send('User Not found');
    }
    let orders= await helper.accountOrders(userId)
    const { tab } = req.query;
    res.render('users/account', { initialTab:'dashboard',user,orders});
  } catch (error) {
    res.status(500).send("Cannot render account Page");
  }
}
let editProfile = async (req,res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({_id:userId});
    const {userName,email,phone} = req.body;
    user.username = userName;
    user.email = email;
    user.phone = phone;
    await user.save();
    res.redirect('/account');
  } catch (error) {
    res.status(404).send("Error on Updating Profile",error);
  }
}
let changePass = async (req, res) => {
  try {
    const { currentPass, newPass } = req.body;
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    bcrypt.compare(currentPass, user.password, async (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (!result) {
        return res.status(400).json({ error: 'Wrong Password' });
      }
      if (!newPass) {
        return res.status(400).json({ error: 'New password cannot be empty' });
      }
      const hashedPassword = await bcrypt.hash(newPass, 10);
      user.password = hashedPassword;
      await user.save();
      return res.json({ message: 'Password changed successfully' });
    });
  } catch (error) {
    res.status(500).send("Error On changing Password");
  }
};
let accountAddress = async(req,res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({_id:userId});
    if(!user){
      return res.status(400).send('User Not found');
    }
    let orders= await helper.accountOrders(userId)
    const { tab } = req.query;
    res.render('users/account', { initialTab:'address-edit',user,orders});
  } catch (error) {
    res.status(500).send("Cannot render account Page");
  }
  
}
let accountChangePass = async(req,res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({_id:userId});
    if(!user){
      return res.status(400).send('User Not found');
    }
    let orders= await helper.accountOrders(userId)
    const { tab } = req.query;
    res.render('users/account', { initialTab: tab || 'changePass',user,orders});
  } catch (error) {
    res.status(500).send("Error on changing password");
  }
}
let userOrder = async (req,res) => {
  let userId = req.user.id;
  try {
    let user = await User.findOne({_id:userId});
    if(!user){
      return res.status(400).send('User Not found');
    }
    let orders= await helper.accountOrders(userId)
    // console.log("orders :",orders)

    res.render('users/account', { initialTab:'orders',user,orders});
  } catch (error) {
    console.log(error);
    res.status(500).json({message:"Error on getting User Orders"})
  }
}

let addAddress = async (req, res) => {
  try {
    const { val } = req.params;
    let { name, locality, street, city, state, phone, pincode } = req.body;
    let userId = req.user.id;
    if (!userId) {
      res.status(404).send('user Not Found')
    }
    let user = await User.findOne({ _id: userId });
    if (user.address.length >= 4) {
      let addError = 'Maximum 4 Address can be saved.'
      console.log(addError);
      if (val === '0') {
        return res.redirect('/accountAddress');
      }
      if (val === '1') {
        return res.redirect('/checkout');
      }
    }
    let newAddress = { name, locality, street, city, state, phone, pincode };
    user.address.push(newAddress);
    await user.save();
    if (val === '0') {
      return res.redirect('/accountAddress');
    }
    if (val === '1') {
      return res.redirect('/checkout');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
let editAddress = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, locality, street, city, state, phone, pincode } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addressIndex = req.params.id
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
    res.json({ message: "Address updated successfully", userAddress: user.address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
let deleteAddress = async (req,res) => {
  try {
    const { addressId } = req.params;
    let userId = req.user.id;
    let user = await User.findOne({_id:userId});
    let updatedAdd = user.address.filter(add => add._id != addressId);
    user.address = updatedAdd
    user.save();
    res.redirect('/accountAddress');
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
}

let shop = async (req, res) => {
  try {
    const perPage = 6;
    let admin = await Admin.findOne();
    let vendors = await Vendor.find().select("products");
    let products = vendors.reduce((acc, vendor) => {
      return acc.concat(vendor.products);
    }, []);
    let prod = products.length;
    let page = parseInt(req.query.page) || 1;

    const totalProducts = prod;
    const totalPages = Math.ceil(totalProducts / perPage);
    products = products.slice((page - 1) * perPage, page * perPage);
    if (req.cookies.user_jwt) {
      jwt.verify(req.cookies.user_jwt, process.env.JWT_SECRET, async (err, decodedToken) => {
        if (err) {
          return res.render('users/shop-org', { products, admin, user: undefined, prod, totalPages, currentPage: page });
        } else {
          req.user = decodedToken;
          let user = await User.findOne({ _id: req.user.id });
          return res.render('users/shop-org', { products, admin, user: user, prod, totalPages, currentPage: page });
        }
      });
    } else {
      return res.render('users/shop-org', { products, admin, user: undefined, prod, totalPages, currentPage: page });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
};
// single product
let product = async (req,res) => {
  try {
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
          req.user = decodedToken;
          let user = await User.findOne({_id:req.user.id});
          return res.render('users/single-product',{product,user:undefined});
        }
      });
    }else{
      return res.render('users/single-product',{product,user:undefined});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}
let filterProduct = async (req, res) => {  
  const { categories, tags, sort, searchTerm } = req.body;
  try {
    const vendors = await Vendor.find().populate('products');
    const filteredProducts = vendors.reduce((acc, vendor) => {
      const vendorProducts = vendor.products.filter(product => {
        if (categories.length > 0 && tags.length > 0) {
          return categories.includes(product.category) &&
            tags.includes(product.subCategory);
        } else if (categories.length > 0) {
          return categories.includes(product.category);
        } else if (tags.length > 0) {
          return tags.includes(product.subCategory);
        } else {
          return true;
        }
      });
      return [...acc, ...vendorProducts];
    }, []);

    // Apply search term filtering
    const searchTermFilteredProducts = filteredProducts.filter(product => {
      const searchWords = searchTerm.trim().toLowerCase().split(' '); // Split the search term into words
      return searchWords.every(word =>
        product.brand.toLowerCase().includes(word) ||
        product.productName.toLowerCase().includes(word) ||
        product.category.toLowerCase().includes(word) ||
        product.price.toString().toLowerCase().includes(word) ||
        product.description.toLowerCase().includes(word) ||
        product.subCategory.toLowerCase().includes(word)
      );
    });
    
    // Apply sorting
    switch (sort) {
      case 'latest':
        searchTermFilteredProducts.sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn));
        break;
      case 'priceLowToHigh':
        searchTermFilteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        searchTermFilteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'alphabeticalAZ':
        searchTermFilteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'alphabeticalZA':
        searchTermFilteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      default:
    }
    res.json(searchTermFilteredProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// cart
let getcart = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.user.id });
    let Products =  await Vendor.find().select("products");
    let tot = 0;
    if(user.cart.products.length === 0){
      user.cart.total = 0;
      user.cart.discount = 0;
      await user.save();
    }else{
      user.cart.products.forEach(product => {
        Products.forEach(vend => {
          vend.products.forEach(p => {
            if(p._id.toString() === product._id.toString()){
              product.images = p.images;
              product.price = p.price;
              product.productName = p.productName;
              product.stock = p.stockQuantity;
              tot+=parseFloat(product.price * product.quantity);
            }
          })
        })
      });
    }
    if(user.cart.total !== tot){
      user.cart.total = tot
      await user.save();
      console.log("change in cart total")
    }
    res.render('users/cart', {user,userCart:user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
let addtocart = async (req, res) => {
  try {
    if (!req.cookies.user_jwt) {
      return res.status(201).json({ error: "Try after Login." });
    }
    jwt.verify(req.cookies.user_jwt, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        return res.status(201).json({ error: "Unauthorised user" });
      } else {
        req.user = decodedToken;
      }
    })
    const { productId } = req.body;
    const userId = req.user ? req.user.id : null; // Check if user is logged in
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
      return res.status(201).json({ error: "Please login" });
    }
    if(product.stockQuantity <= 0){
      return res.status(201).json({error:"Product Out of Stock"})
    }
    const existingProductIndex = user.cart.products.findIndex((cartItem) => cartItem._id.toString() === productId);
    if (existingProductIndex !== -1) {
      user.cart.products[existingProductIndex].quantity += 1;
    } else {
      user.cart.products.push({
        _id: productId,
        quantity: 1,
        price : product.price
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
let removefromcart = async (req, res) => {
  try {
    let { productId, price } = req.body;
    let user = await User.findOne({ _id: req.user.id });
    let product = user.cart.products.find(prod => prod._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    user.cart.products = user.cart.products.filter(prod => prod._id.toString() !== productId);
    // Calculate the new total
    let subtotal = parseInt(price) * product.quantity;
    let total = parseInt(user.cart.total) - subtotal;
    
    user.cart.total = total;
    await user.save();
    res.json({ message: "product removed", user, product, total });
  } catch (error) {
    res.status(500).send("Internal Server Error on product removal in cart");
  }
};
let changeQuantity = async (req, res) => {
  const { productId,quantity,price , change } = req.body;
  try {
    const user = await User.findById(req.user.id);

    const productIndex = user.cart.products.findIndex(product => product._id.toString() === productId);
    if (productIndex !== -1) {
      user.cart.products[productIndex].quantity = quantity;
      // let price = user.cart.products[productIndex].price;
      if(change === true){
        user.cart.total += parseFloat(price);
      }
      if(change === false){
        user.cart.total -= parseFloat(price);
      }
      await user.save();
      res.status(200).json({ message: 'Quantity updated successfully',user,quantity,price});
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
    let admin = await Admin.findOne();
    const coupons = admin.coupons;  
    let coupon = coupons.filter(val => val.couponCode == couponCode)
    if (coupon[0] && coupon[0].status === 'Active' && coupon[0].limit>0) {
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
        coupon[0].limit -= 1;
        await user.save();
        await admin.save();
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
  try {
    let user =  await User.findById(req.user.id);
    if(!user){
      return res.status(500).json({valid:false,message:'cannot find user'});
    }
    user.cart.discount = 0;
    user.save();
    res.json({valid:true,message:'discount removed from the checkout'});
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
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
  try {
    const { productId } = req.body;
    const userId = req.user.id;
    let existInWishlist = false;
    let userExist = false;
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
      return res.json({ message: "NO user", user, productId, existInWishlist , userExist});
    }
    userExist = true
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
    await user.save();
    res.json({ message: "Product added to wishlist successfully", user, productId, existInWishlist , userExist});
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
    await user.save();
    res.json({message:"product removed"});
  } catch (error) {
    res.status(500).send("Internal Server Error on product removal in wishlist");
  }
}

// checkout
let checkCart = async (req,res) => {
  try {
    let vendors = await Vendor.find();
    let user = await User.findById(req.user.id);
    for(let Cproduct of user.cart.products){
      for(let vendor of vendors){
        for(Vproduct of vendor.products){
          if(Vproduct._id.toString() === Cproduct._id.toString()){
            Cproduct.stock = Vproduct.stockQuantity;
            Cproduct.productName = Vproduct.productName;
            Cproduct.price = Vproduct.price;
            if(Cproduct.stock < Cproduct.quantity){
              return res.status(201).json({message:"Some products exceeds available stock"});
            }
          }
        }
      }
    }
    return res.status(200).json({ message: "Cart checked successfully." });  
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
}
let getCheckout = async (req,res) => {
  try {
    let vendors = await Vendor.find();
    let user = await User.findById(req.user.id);
    for(let Cproduct of user.cart.products){
      for(let vendor of vendors){
        for(Vproduct of vendor.products){
          if(Vproduct._id.toString() === Cproduct._id.toString()){
            Cproduct.productName = Vproduct.productName;
            Cproduct.price = Vproduct.price;
          }
        }
      }
    }
    if(user.cart.products.length === 0){
      return res.redirect('/cart');
    }
    res.render('users/checkout',{user,coupon:false});
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
}
let submitCheckout = async (req, res) => {
  const { addressId, paymentMethod , razor } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let vendors = await Vendor.find();
    let address = user.address.filter(add => add._id.toString() === addressId);

    let products = [];
    for (const prod of user.cart.products) {
      let vendorId = null;
      // Find the vendor ID for each product
      for (const vendor of vendors) {
        for (const product of vendor.products) {
          if (product._id.toString() === prod._id.toString()) {
            let stock = parseInt(product.stockQuantity) - prod.quantity;
            product.sold += parseFloat(prod.quantity);
            product.stockQuantity = stock.toString();
            vendorId = vendor._id.toString();
            break;
          }
        }
        if (vendorId) {
          break;
        }
      }
      let statusHistory = [
        { status: 'Pending', isActive: true, timestamp: Date.now(), vendorChanged: true },
        { status: 'Shipped', isActive: false, timestamp: Date.now(), vendorChanged: false },
        { status: 'Out Of Delivery', isActive: false, timestamp: Date.now(), vendorChanged: false },
        { status: 'Delivered', isActive: false, timestamp: Date.now(), vendorChanged: false },
        { status: 'Requested for Cancellation', isActive: false, timestamp: Date.now(), vendorChanged: false },
        { status: 'Cancelled', isActive: false, timestamp: Date.now(), vendorChanged: false }
      ];
      if(razor!== false){
        products.push({
          _id: prod._id,
          quantity: prod.quantity,
          vendorId: vendorId,
          statusHistory: statusHistory,
          razorpayId:razor
        });
      }else{
          products.push({
          _id: prod._id,
          quantity: prod.quantity,
          vendorId: vendorId,
          statusHistory: statusHistory
        });
      }
    }
    // Save the updated products in each vendor
    for (const vendor of vendors) {
      await vendor.save();
    }

    let shippingAddress = address[0];
    let newOrder = new Order({
      products: products,
      total: user.cart.total - user.cart.discount,
      discount: user.cart.discount,
      shippingAddress,
      paymentMethod: paymentMethod,
      userId: req.user.id
    });
    await newOrder.save();

    user.cart = { products: [], total: 0, discount: 0 };
    await user.save();

   // Mail Notification
    let arr = [];
    for (const prod of newOrder.products) {
      let productDetails = await productHelper.getProductDetails(prod._id);
      productDetails.quantity = prod.quantity;
      productDetails.price = productDetails.price*productDetails.quantity;
      arr.push(productDetails);
    }

    let email = user.email;
    let subject = "PAWTY - Order Placed";

    let tableRows = arr.map(productDetails => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">
        ${productDetails.productName}
      </td>
      <td style="padding: 10px; border: 1px solid #ddd;">
        <img src="${productDetails.images[0]}" alt="${productDetails.productName}" style="max-width: 100px; max-height: 100px;">
      </td>
      <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
        ${productDetails.quantity}
      </td>
      <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">
        ${productDetails.price} /-
      </td>
    </tr>
  `).join('');
    let message = `
    <div style="background-color: #f9f9f9; padding: 20px;">
      <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px; display: block;">
      <h2 style="color: #255923; text-align: center;">Order Confirmation</h2>
      <div style="border: 1px solid #ddd; margin: 0 auto; padding: 20px;">
        <h3 style="color: #555;">Hi ${user.username}, Thanks for your order!</h3>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #eee; border: 1px solid #ddd; padding: 10px;">
            <th style="text-align: left;">Product</th>
            <th style="text-align: left;">Product image</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p style="text-align: right;">
        <strong>Total:</strong> ${newOrder.total} /-
      </p>
      <p style="color: #555; text-align: center;">
        Your order (ID: ${newOrder._id}) has been placed and is being processed. We'll update you on the delivery status soon.
      </p>
      <hr style="border: 0.5px solid #ddd; margin: 10px auto;">
      <p style="color: #777; text-align: center;">We appreciate your business!</p>
      <footer style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Pawty. All Rights Reserved.
      </footer>
    </div>
    `;
    sendOtpEmail(email, subject, message);
    res.status(201).json({ message: 'Order placed successfully', order: newOrder, shippingAddress });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to place order' });
  }
};

let requestCancellation = async (req, res) => {
  try {
    let { orderId, productId } = req.body;
    if (!orderId || !productId) {
      return res.status(500).send("Internal Server Error");
    }
  
    let order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).send('Cannot find the order');
    }
    let product = order.products.find((prod) => prod._id.toString() === productId.toString());
    if (!product) {
      return res.status(404).send('Cannot find the product in the order');
    }
    product.status = 'Requested for Cancellation';
    if(product.statusHistory.length>4){
      product.statusHistory[4].vendorChanged = true;
      product.statusHistory[4].timestamp = Date.now();
    }else{
      let cancel = {
        status:"Requested for Cancellation",
        isActive:true,
        timestamp:Date.now(),
        vendorChanged:true
      }
      product.statusHistory.push(cancel);
    }
    await order.save();
    let userEmail = req.user.email; // Assuming user email is stored in order or user profile
    let productDetails = await productHelper.getProductDetails(product._id)
    let subject = "Order Cancellation Request";
    let message = `
    <div style="">
    <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px;max-height: 40px; display: block;">
      <div style="background-color: #f9f9f9; padding: 20px;">
        <h2 style="color: red;">Order Cancellation Request</h2>
        <p style="color: #555;">Your request to cancel the following order has been received:</p>
        <p style="color: #666;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="color: #555;"><strong>Product Name:</strong> ${productDetails.productName}</p>
        <p style="color: #555;"><strong>Price:</strong> ${productDetails.price} /-</p>
        <p style="color: #777;">We will process your request as soon as possible.</p>
      </div>
    </div>
    `;
    sendOtpEmail(userEmail ,subject , message );
    return res.json({ message: 'Request for cancellation sent' });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

let razorpayOrder = async (req,res) => {
  const { paymentMethod } = req.body;
  try {
    if (paymentMethod !== 'Razorpay') {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    let user = await User.findById(req.user.id)
    if(!user){
      res.status(404).json({message:'User Not Found'})
    }

    // Create order on Razorpay
    const order = await razorpayInstance.orders.create({
      amount: (user.cart.total - user.cart.discount) *100,
      currency: 'INR',
      payment_capture: 1,
    });
    console.log("order ,",order)
    res.status(200).json({
      orderId: order.id,
      razorpayOrderId: order.id,
      razorpayApiKey: process.env.key_id,
      total : (user.cart.total - user.cart.discount) * 100,
      user:user
    }); 
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
};

// Get UserLoginPage
let loginPage = (req,res) => {
  try {
    if(req.cookies.user_jwt){
      return  res.redirect('/');
     }
     let addError = '';
     res.render('users/account-login',{passError :'',addError})
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
}
let submitlogin = async (req, res) => { 
    const {email, password} = req.body;
    if(email && password){
        try {
            const loginUser = await User.findOne({email: email});
            if (!loginUser) {
                return res.status(404).render('users/account-login', { passError: 'User Not Found' });//send('User Not Found');
            }
            bcrypt.compare(password, loginUser.password, (err, result) => {
                if (err) {
                    // console.error("problem : ", err);
                    return res.status(500).send('Internal Serverr Error');
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
                res.redirect('/');
            });
        } catch (error) {
            console.log("Error on Login Submit",error);
            res.status(500).send("Internal Server Errorr");
        }  
    }else{
        res.render('users/account-login',{passError:'Please Complete the fields :'})
    }
}

// Get SignUpPage
let signupPage = (req,res) => {
  try {
    if(req.cookies.user_jwt){
      return  res.redirect('/');
     }
     res.render('users/account-signup',{errMsg:''})
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error");
  }
}
let submitSignup = async (req,res) => {
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
        console.log('New google signup.');
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
    let subject = "Reset Your Password";
    let message = `
    <div style="background-color: #f9f9f9; padding: 20px;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p style="color: #555;">Your OTP to reset your password is: <strong>${otp}</strong></p>
      <p style="color: #777;">Please use this OTP to reset your password.</p>
    </div>
  `
    await sendOtpEmail(email,subject, message);

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
    filterProduct,

    getcart,
    addtocart,
    changeQuantity,
    removefromcart,
    checkCoupon,

    getwishlist,
    addtowishlist,
    removefromwishlist,

    checkCart,
    getCheckout,
    removeCoupon,
    submitCheckout,
    requestCancellation,
    razorpayOrder,

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