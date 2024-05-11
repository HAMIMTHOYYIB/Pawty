const Vendor = require('../models/Vendor');
const Admin = require('../models/admin');
const Order = require('../models/order');
const User = require('../models/User')
let helper = require('../helpers/vendordash')
let { sendOtpEmail } = require('../helpers/sentEmail')
let productHelper = require('../helpers/getProductDetails');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cloudinary = require('../config/cloudinary')
require('dotenv').config()
const htmlToPdf = require('../helpers/htmlToPdf');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');



let vendorDashboard = async (req,res) => {
  let vendor = await Vendor.findById(req.user.id);
  let userOrders= await helper.getclients(req.user.id);
  let topCategories = await helper.orderCountByCategory(req.user.id);
  let orders= await helper.orderOfVendor(req.user.id);
  res.render('vendor/vendorDashboard',{orders,vendor,userOrders,topCategories})
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
            res.redirect('/vendor/dashboard');
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
};


let productList = async (req,res) => {
  let email = req.user.email;
  let vendor = await Vendor.findOne({email});
  res.render('vendor/product-list',{vendor})
};
let addProduct = async (req,res) => {
  let admin = await Admin.findOne();
  const vendor = await Vendor.findById(req.user.id)
  if (!admin.category) {
    res.status(400).send('Category Not Found');
  }else{
    res.render('vendor/product-add',{admin,vendor})
  }
};
let submitAddProduct = async (req, res) => {
  // console.log("req user :", req.user);
  let vendorId = req.user.id;
  // console.log("req.body :", req.body);
  // console.log("req.file :", req.files);
  let imageData = req.files;
  let productData = req.body;
  let { ProductName, Price, Brand, Stock, Description, Category, SubCategory } = productData;
  const imageUrls = [];

  // Upload images to Cloudinary
  try {
      if (productData) {
          for (let i = 0; i < imageData.length; i++) {
              let file = imageData[i];
              let result;
              if (i === 0) {
                if(req.body.croppedImage){
                  result = await cloudinary.uploader.upload(req.body.croppedImage, { transformation: { width: 300, height: 300, crop: 'fill' } });
                }
              } else {
                  result = await cloudinary.uploader.upload(file.path);
              }
              imageUrls.push(result.secure_url);
          }
          console.log(imageUrls);
      } else {
          console.log("No product data found");
      }

      let newProduct = {
          productName: ProductName,
          description: Description,
          price: Price,
          brand: Brand,
          category: Category,
          subCategory: SubCategory,
          stockQuantity: Stock,
          images: imageUrls
      };

      let vendor = await Vendor.findOne({ _id: vendorId });
      if (!vendor) {
          res.status(400).send('Vendor Not Found');
      } else {
          vendor.products.push(newProduct);
          await vendor.save();
          res.redirect('/vendor/product-list');
      }
  } catch (error) {
      console.error("Error uploading images to Cloudinary:", error);
      return res.status(500).send("Error uploading images to Cloudinary");
  }
};
let editProduct = async (req,res) => {
  let productId = req.params.id;
  let vendorId = req.user.id;
  let vendor = await Vendor.findOne({_id:vendorId});
  if(!vendor){
    return res.status(400).send('Vendor Not found')
  }
  let admin = await Admin.findOne();
  let product = vendor.products.find(prod => prod._id.toString() === productId);
  if(!product){
    return res.status(404).send('Product Not Found')
  }
  res.render('vendor/product-edit',{product,admin,vendor});
}
let submitEditProduct = async (req, res) => {
  let vendorId = req.user.id;
  let productData = req.body;
  let imageData = req.files;
  let { ProductName, Price, Brand, Stock, Description, Category, SubCategory } = productData;
  const imageUrls = [];
  
  // Upload images to Cloudinary
  try {
    if(req.files){
      for (let i = 0; i < imageData.length; i++) {
        let file = imageData[i];
        let result;
        if (i === 0) {
          if(req.body.croppedImage){
            result = await cloudinary.uploader.upload(req.body.croppedImage, { transformation: { width: 300, height: 300, crop: 'fill' } });
          }
        } else {
            result = await cloudinary.uploader.upload(file.path);
        }
        imageUrls.push(result.secure_url);
    }
    }

    let productId = req.params.id; // Assuming you have the productId in the URL
    let vendor = await Vendor.findOne({_id:vendorId});
    if (!vendor) {
      res.status(400).send('Vendor Not Found');
    } else {
      let productIndex = await vendor.products.findIndex(product => product._id.toString() === productId);
      if (productIndex === -1) {
        res.status(404).send('Product Not Found');
      } else {
        let updatedProduct = vendor.products[productIndex];
        updatedProduct.productName = ProductName;
        updatedProduct.description = Description;
        updatedProduct.price = Price;
        updatedProduct.brand = Brand;
        updatedProduct.category = Category;
        updatedProduct.subCategory = SubCategory;
        updatedProduct.stockQuantity = Stock;
        if (imageUrls.length > 0) {
          updatedProduct.images = imageUrls;
        }
        await vendor.save();
        res.redirect('/vendor/product-list');
      }
    }
  } catch (error) {
    console.error("Error uploading images to Cloudinary:", error);
    return res.status(500).send("Error uploading images to Cloudinary");
  }
};
let deleteProduct = async (req,res) => {
  let vendorId = req.user.id;
  let productId = req.params.id;
  let vendor = await Vendor.findOne({_id:vendorId});
  if(!vendor){
    return res.status(400).send('Admin Not Found')
  }
  vendor.products = vendor.products.filter(prod => prod._id.toString() !== productId);
  vendor.save();
  console.log('Product Deleted');
  res.redirect('/vendor/product-list');
}


let getOrderList = async (req, res) => {
  try {
      // Find the vendor
      let vendor = await Vendor.findById(req.user.id);
      if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
      }
      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const startIndex = (page - 1) * limit;
      let orders = await helper.orderOfVendor(req.user.id);
      const totalOrders = orders.length;
      orders = orders.sort((a, b) => b.orderDate - a.orderDate).slice(startIndex, startIndex + limit);
      res.render('vendor/orderList', { orders, vendor, currentPage: page, totalPages: Math.ceil(totalOrders / limit) });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to get orders' });
  }
};
let getOrderDetails = async(req,res) => {
  let {  productId, orderId } = req.params;
  const vendor = await Vendor.findById(req.user.id)
  try {
    let order = await Order.findById(orderId);
    const singleD = Math.round(order.discount/order.products.length);
    let orderProduct = order.products.filter(product => product._id.toString() === productId);
    let product = await productHelper.getProductDetails(productId);
    product.price -= singleD;
    res.render('vendor/orderDetails',{order,product,orderProduct,vendor}) ;

  } catch (error) {
    res.status(500).send("Can't get Order Details")
  }
}
let updateStatus = async (req, res) => {
  try {
    let {  productId, orderId } = req.params;
    let { status } = req.body;
    let order = await Order.findById(orderId);
    let product = order.products.find(prod => prod._id.toString() === productId.toString());
    if (product) {
      product.status = status;
      let existingHistory = product.statusHistory.find(history => history.status === status);
      if (!existingHistory) {
        let newHistory = {
          status,
          isActive : true,
          timestamp : Date.now(),
          vendorChanged : true,
        };
        product.statusHistory.push(newHistory);
      }
      product.statusHistory.forEach(history => {
        if (history.status === status) {
          history.isActive = true;
          history.timestamp = Date.now();
          history.vendorChanged = true;
        } else {
          history.isActive = false;
        }
      });
      await order.save();
      let user = await User.findById(order.userId)
      let productDetails = await productHelper.getProductDetails(product._id);
      const deliveryDate = new Date().toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
      if(status === 'Cancelled'){
        const vendor = await Vendor.findOne({ 'products._id': productId });
        if (!vendor) {
          throw new Error('Vendor not found');
        }
        const vendorProd = vendor.products.find((prod) => prod._id.toString() === productId.toString());
        if (!vendorProd) {
          throw new Error('Product not found');
        }
        vendorProd.sold -= product.quantity;
        vendorProd.stockQuantity += product.quantity;
        await vendor.save();
        if (status === 'Cancelled') {
          let email = user.email;
          let subject = "Order Cancelled";
          let message = `
              <div style="background-color: #f9f9f9; padding: 20px;">
                <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px; display: block;">
                <h2 style="color: #2e702e; text-align: center;">Order Cancelled</h2>
      
                <div style="">
                  <div style="border: 1px solid #555; margin: 0 auto; padding: 20px; text-align: center;">
                    <h3 style="color: #555;">${user.username}, Your order has been cancelled.</h3>
                  </div>
                </div>
      
                <div style="display: flex; justify-content:space-between;">
                  <div style="width:50%; border-right: 1px solid #ddd;">
                    <p style="color: #555;"><strong>Order ID:</strong> ${orderId}</p>
                    <p style="color: #555;"><strong>Product Name:</strong> ${productDetails.productName}</p>
                    <p style="color: #555;"><strong>Price:</strong> ${productDetails.price} /-</p>
                    <p style="color: #555;"><strong>Quantity:</strong> ${product.quantity}</p>
                  </div>
                  <div style="width: 48%;margin-left:2%;">
                    <h3 style="color: #555; text-align: left">Invoice Details</h3>
                    <p style="color: #555;"><strong>Invoice ID:</strong> ${orderId}</p>
                    <p style="color: #555;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <div style="width:50%"></div>
                  <div style="text-align:left;width:25%">
                    <h3 style="color: #555; text-align:left">Delivery Address</h3>
                    <p style="color: #555;"> ${order.shippingAddress.locality}, ${order.shippingAddress.street}</p>
                    <p style="color: #555;"> ${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
                    <p style="color: #555;"><strong>PINCODE :</strong> ${order.shippingAddress.pincode}</p>
                  </div>
                </div>
                <hr style="border: 0.5px solid #ddd; margin: 10px auto;">
                <p style="color: #777; text-align: center;">We apologize for any inconvenience caused.</p>
              `;
          await sendOtpEmail(email, subject, message);
        }
      
      }

      // Delivery Mail Notification
      if(status === 'Delivered'){
        let email = user.email;
        let subject = "Order Delivered - Invoice";
        let message = `
        <div style="background-color: #f9f9f9; padding: 20px;">
          <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px; display: block;">
          <h2 style="color: #2e702e; text-align: center;">Order Delivered</h2>

          <div style="">
            <div style="border: 1px solid #555; margin: 0 auto; padding: 20px; text-align: center;">
              <h3 style="color: #555;">${user.username}, Your order has been delivered successfully!</h3>
            </div>
          </div>

          <div style="display: flex; justify-content:space-between;">
            <div style="width:50%; border-right: 1px solid #ddd;">
              <p style="color: #555;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="color: #555;"><strong>Product Name:</strong> ${productDetails.productName}</p>
              <p style="color: #555;"><strong>Price:</strong> ${productDetails.price} /-</p>
              <p style="color: #555;"><strong>Quantity:</strong> ${product.quantity}</p>
            </div>
            <div style="width: 48%;margin-left:2%;">
              <h3 style="color: #555; text-align: left">Invoice Details</h3>
              <p style="color: #555;"><strong>Invoice ID:</strong> ${orderId}</p>
              <p style="color: #555;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <div style="width:50%"></div>
            <div style="text-align:left;width:25%">
              <h3 style="color: #555; text-align:left">Delivery Address</h3>
              <p style="color: #555;"> ${order.shippingAddress.locality}, <span class="math-inline">\{order\.shippingAddress\.street\}</p\>
              <p style\="color\: \#555;"\></span>{order.shippingAddress.city}, ${order.shippingAddress.state}</p>
              <p style="color: #555;"><strong>PINCODE :</strong> ${order.shippingAddress.pincode}</p>
            </div>
          </div>
          <hr style="border: 0.5px solid #ddd; margin: 10px auto;">
          <p style="color: #777; text-align: center;">Thank you for shopping with us.</p>
        `;
        await sendOtpEmail(email,subject,message);
      }
      // Shipping Mail Notification
      if(status === 'Shipped'){
        let email = user.email;
        let subject = "Order Shipped";
        let message = `
        <div style="background-color: #f9f9f9; padding: 20px;">
        <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px; display: block;">
        <h2 style="color: #2e6e70; text-align: center;">Order Shipped</h2>

        <div style="border: 1px solid #555; margin: 0 auto; padding: 20px; text-align: center;">
          <h3 style="color: #555;">Hello  ${user.username},Your order has been shipped on ${deliveryDate}.</h3>
        </div>

        <div style="display: flex;">
          <div style="width:40%">
            <p style="color: #555;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="color: #555;"><strong>Product ID:</strong> ${productDetails._id}</p>
            <p style="color: #555;"><strong>Product:</strong> ${productDetails.productName} x ${product.quantity}</p>
            <p style="color: #555;"><strong>Price:</strong> ${productDetails.price} /-</p>
          </div>
          <div style="width:20%"></div>
          <div style="text-align:left;width:40%">
            <h3 style="color: #555; text-align:left">Delivery Address</h3>
            <p style="color: #555;"> ${order.shippingAddress.locality},${order.shippingAddress.street}</p>
            <p style="color: #555;">${order.shippingAddress.city},${order.shippingAddress.state}</p>
            <p style="color: #555;"><strong>PINCODE :</strong> ${order.shippingAddress.pincode}</p>
          </div>
        </div>
        <p style="color: #555; text-align: center;">Your order is expected to be delivered in 4-7 business days.</p>

        <hr style="border: 0.5px solid #ddd; margin: 10px auto;">

        <p style="color: #777; text-align: center;">Thank you in advance, for your patience.</p>

        <footer style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Pawty. All Rights Reserved.
        </footer>
        </div>`;
        await sendOtpEmail(email,subject,message);
      }
      // Order Out of delivery Mail Notification.
      if(status === 'Out Of Delivery'){
        const expectedDeliveryDate = new Date();
        expectedDeliveryDate.setHours(expectedDeliveryDate.getHours() + 48);
        const formattedExpectedDeliveryDate = expectedDeliveryDate.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        let email = user.email;
        let subject = "Product Out of Delivery";
        let message = `
        <div style="background-color: #f9f9f9; padding: 20px;">
          <img src="https://res.cloudinary.com/dw3wmxotb/image/upload/v1712451407/pawty_sxt7if.png" alt="PAWTY" style="max-width: 80px; display: block;">
          <h2 style="color: #ebba34; text-align: center;">Order out of Delivery</h2>

          <div style="border: 1px solid #555; margin: 0 auto; padding: 20px; text-align: center;">
            <h3 style="color: #555;"> ${user.username}, Your order is Out Of Delivery.</h3>
          </div>

          <div style="display: flex;">
            <div style="width:25%">
              <p style="color: #555;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="color: #555;"><strong>Product ID:</strong> ${productDetails._id}</p>
              <p style="color: #555;"><strong>Product:</strong> ${productDetails.productName} x ${product.quantity}</p>
              <p style="color: #555;"><strong>Price:</strong> ${productDetails.price} /-</p>
            </div>
            <div style="width:50%"></div>
            <div style="text-align:left;width:25%">
              <h3 style="color: #555; text-align:left">Delivery Address</h3>
              <p style="color: #555;"> ${order.shippingAddress.locality}, ${order.shippingAddress.street}</p>
              <p style="color: #555;">${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
              <p style="color: #555;"><strong>PINCODE :</strong> ${order.shippingAddress.pincode}</p>
            </div>
          </div>
          <p style="color: #555; text-align: center;">Your order is expected to be delivered by ${formattedExpectedDeliveryDate}.</p>

          <hr style="border: 0.5px solid #ddd; margin: 10px auto;">

          <p style="color: #777; text-align: center;">Thank you in advance, for your patience.</p>

          <footer style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Pawty. All Rights Reserved.
          </footer>
        </div>
      `;
        await sendOtpEmail(email,subject,message);
      } 

      res.json({ message: "Order Status Updated.", status  });
    } else {
      res.status(404).json({ message: "Product not found in order."});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error on updating status' });
  }
};

let vendorweekOrders = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalOrders = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $unwind: "$products"
      },
      {
        $match: {
          "products.vendorId":req.user.id
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    // console.log("orderssss :",totalOrders)
    res.json(totalOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get order Report
let getOrderPdf = async (req, res) => {
  let vendor = await Vendor.findById(req.user.id);
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;

  let orders = await Order.find({
    orderDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    'products.vendorId': vendor._id.toString()
  });
  orders = orders.map(order => {
    order.products = order.products.filter(product => product.vendorId.toString() === vendor._id.toString());
    return order;
  }).filter(order => order.products.length > 0);

  for (let order of orders) {
    let user = await User.findById(order.userId);
    order.userName = user.username;
    order.userMail = user.email;
    for (let product of order.products) {
      let productDetails = await productHelper.getProductDetails(product._id);
      product.productName = productDetails.productName;
    } 
  }
  const content = `
  <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
              }
              th, td {
                  border: 1px solid #dddddd;
                  text-align: left;
                  padding: 8px;
              }
              th {
                  background-color: #f2f2f2;
              }
              .brand-icon {
                  width: 50px; /* Adjust as needed */
                  height: 50px; /* Adjust as needed */
              }
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 20px;
                  margin-top: 5px;
              }
              .header h2 {
                  margin: 0;
              }
              .date {
                  text-align: right;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h2>Pawty Order Report</h2>
              <div class="date">From: ${startDate}<br>To: ${endDate}</div>
          </div>
          <table>
              <thead>
                  <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Order Total</th>
                      <th>Products</th>
                  </tr>
              </thead>
              <tbody>
                  ${orders.map(order => `
                      <tr>
                          <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>${order._id}</td>
                          <td>${order.userName}</td>
                          <td>${order.total}</td>
                          <td>
                              <ul>
                                  ${order.products.map(product => `
                                      <li>${product.productName}*${product.quantity}-${product.status}</li>
                                  `).join('')}
                              </ul>
                          </td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      </body>
  </html>
`;
  const pdf = await htmlToPdf(content);
  res.contentType('application/pdf');
  res.attachment('order-report.pdf');
  res.send(pdf);
};
let getOrderCvv = async (req, res) => {
  let vendor = await Vendor.findById(req.user.id);
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;

  let query = {};
  if (startDate && endDate) {
      query.orderDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
      };
  }

  let orders = await Order.find({
    orderDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    'products.vendorId': vendor._id.toString()
  });
  orders = orders.map(order => {
    order.products = order.products.filter(product => product.vendorId.toString() === vendor._id.toString());
    return order;
  }).filter(order => order.products.length > 0);

  for (let order of orders) {
    let user = await User.findById(order.userId);
    order.userName = user.username;
    order.userMail = user.email;
    for (let product of order.products) {
      let productDetails = await productHelper.getProductDetails(product._id);
      product.productName = productDetails.productName;
    } 
  }

  const csvWriter = createObjectCsvWriter({
      path: 'orders.csv',
      header: [
          { id: 'orderId', title: 'Order ID' },
          { id: 'orderDate', title: 'Order Date' },
          { id: 'userName', title: 'Customer Name' },
          { id: 'userMail', title: 'Customer Email' },
          { id: 'total', title: 'Order Total' },
          { id: 'products', title: 'Products' }
      ]
  });
  
  const csvRecords = orders.map(order => ({
      orderId: order._id,
      orderDate: new Date(order.orderDate).toLocaleDateString(),
      userName: order.userName,
      userMail: order.userMail,
      total: order.total,
      products: order.products.map(product => `${product.productName} x ${product.quantity}`).join(';')
  }));    

  await csvWriter.writeRecords(csvRecords);

  // Set headers and stream CSV file as response
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=Orders.csv');
  const fileStream = fs.createReadStream('orders.csv');
  fileStream.pipe(res);
};

// Product wise report
let productWiseOrder = async (req, res) => {
  let productId = req.params.productId;
  let orders = await Order.find({
      'products._id':productId
  });
  for (let order of orders) {
      let user = await User.findById(order.userId);
      order.userName = user.username;
      order.userMail = user.email;
      for (let product of order.products) {
          if (product._id.toString() === productId) {
              let vendor = await Vendor.findOne({ 'products._id':productId });
              let productDetails = vendor.products.find(p => p._id.toString() === productId);
              product.productName = productDetails.productName;
              break;
          }
      }
  }
  const product = await productHelper.getProductDetails(productId)
  const content = `
  <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
              }
              th, td {
                  border: 1px solid #dddddd;
                  text-align: left;
                  padding: 8px;
              }
              th {
                  background-color: #f2f2f2;
              }
              .brand-icon {
                  width: 50px; /* Adjust as needed */
                  height: 50px; /* Adjust as needed */
              }
              .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 20px;
                  margin-top: 5px;
              }
              .header h2 {
                  margin: 0;
              }
              .date {
                  text-align: right;
              }
              .product-image {
                  max-width: 100px;
                  max-height: 100px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h2>Pawty Order Report</h2>
          </div>
          <div>
              <img src="${product.images[0]}" alt="ProductImage" class="product-image">
              <div>
                  <strong>${product.productName}</strong><br>
                  Description: ${product.description}<br>
                  Price: ${product.price}<br>
                  Brand: ${product.brand}<br>
                  Category: ${product.category}<br>
                  Subcategory: ${product.subCategory}<br>
                  Stock Quantity: ${product.stockQuantity}
              </div>
          </div>
          <table>
              <thead>
                  <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Order Status</th>
                      <th>Quantity</th>
                  </tr>
              </thead>
              <tbody>
                  ${orders.map(order => `
                      <tr>
                          <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>${order._id}</td>
                          <td>${order.userName}</td>
                          <td>${order.products.find(p => p._id.toString() === productId).status}</td>
                          <td>${order.products.find(p => p._id.toString() === productId).quantity}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      </body>
  </html>
  `;
  const pdf = await htmlToPdf(content);
  res.contentType('application/pdf');
  res.attachment('Product-report.pdf');
  res.send(pdf);
};
let productWiseReport = async (req,res) => {
  let productId = req.params.productId;

  let orders = await Order.find({
      'products._id':productId
  });

  for (let order of orders) {
      let user = await User.findById(order.userId);
      order.userName = user.username;
      order.userMail = user.email;
      for (let product of order.products) {
          if (product._id.toString() === productId) {
              let vendor = await Vendor.findOne({ 'products._id':productId });
              let productDetails = vendor.products.find(p => p._id.toString() === productId);
              product.productName = productDetails.productName;
              break;
          }
      }
  }
  const csvWriter = createObjectCsvWriter({
      path: 'product-sales.csv',
      header: [
          { id: 'orderDate', title: 'Order Date' },
          { id: 'orderId', title: 'Order ID' },
          { id: 'userName', title: 'Customer Name' },
          { id: 'userMail', title: 'Customer Email' },
          { id: 'status', title: 'Order Status' },
          { id: 'quantity', title: 'Quantity' }
      ]
  });

  const csvRecords = orders.flatMap(order => {
      let product = order.products.find(p => p._id.toString() === productId);
      if (!product) return [];
      return {
          orderDate: new Date(order.orderDate).toLocaleDateString(),
          orderId: order._id,
          userName: order.userName,
          userMail: order.userMail,
          status: product.status,
          quantity: product.quantity
      };
  });

  await csvWriter.writeRecords(csvRecords);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product-sales.csv');
  const fileStream = fs.createReadStream('product-sales.csv');
  fileStream.pipe(res);
};



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
    editProduct,
    submitEditProduct,
    deleteProduct,

    getOrderList,
    getOrderDetails,
    updateStatus,

    getOrderPdf,
    getOrderCvv,

    productWiseOrder,
    productWiseReport,

    vendorweekOrders,

    vendorForgotPass,
    resetVendorPass,
    vendorLogout
}