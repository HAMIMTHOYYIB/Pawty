
const Admin = require('../models/admin');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require("../models/order")
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary')
const getProductDetails = require ('../helpers/getProductDetails');
const htmlToPdf = require('../helpers/htmlToPdf');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');


let dashboard = async (req,res) => {
    try {
        let admin = await Admin.findOne();
        // let category = admin.category;
        // let subCategory = admin.subCategory;
        let users = await User.find();
        let orders = await Order.find();
        let vendors = await Vendor.find().select("products")
        let products = vendors.map((vendor) => vendor.products).flat()
        let productOrders = await Order.aggregate([
            {$unwind:'$products'}
          ]);
          for (let order of productOrders) {
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
                quantity:order.products.quantity,
                vendor : vendor.vendorName       
              };
            }
            let user = await User.findById(order.userId);
            if (user) {
              order.userName = user.username;
              order.userEmail = user.email;
            }
          }
          productOrders.reverse();
          productOrders.length = 5;
        res.render('admin/index',{admin,vendors,products,orders,users,productOrders});
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

let adminLogin = (req, res) => {
    try {
        if(req.cookies.admin_jwt){
            res.redirect('/Dashboard')
        }else{
            res.render('admin/admin-login', { passError: '' });
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({error : "Internal server error"})
    }
    
}
let submitAdminLogin = async (req,res) => {
    try {
        const {email, password} = req.body;
        if(email && password){
            const admin = await Admin.findOne({email: email});
            if (!admin) {
                return res.status(404).render('admin/admin-login', { passError: 'Admin Not Found' });             //send('User Not Found');
            }        
            if(password !== admin.password){
                return res.status(401).render('admin/admin-login',{passError : 'Wrong Password'});
            }else{
                const token = jwt.sign({
                      id: admin._id,
                      name: admin.adminname,
                      email: admin.email,
                    },
                    process.env.JWT_SECRET,
                    {
                      expiresIn: "24h",
                    }
                  );
                res.cookie("admin_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry
                console.log('Admin Loggined succesfully : Token created.');
                res.redirect('/Dashboard');
            }
        }else{
            res.render('admin/admin-login',{passError:'Please Complete the fields :'})
        }
    } catch (error) {
        console.log("Error on Login Submit.",error);
        res.status(500).send("Internal Server Error");
    } 
}


//Category Managment
let categoryList = async (req,res) => {
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin not found');
        }
        let category = admin.category.map(category => category);
        res.render('admin/categorie-list',{category,admin}); 
    } catch (error) {
        res.status(500).send("internal Server Error")
    }
}
let addCategory = async (req,res) => {
    try {
        const admin = await Admin.findOne();
        res.render('admin/categories-add',{admin});
    } catch (error) {
        res.status(500).send("internal server Error")
    }
}
let submitAddCategory = async (req,res) => {
    try {
        let {categoryName} =req.body;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin not found')
        }
        admin.category.push({categoryName});
        admin.save();
        res.redirect('/categories')
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let editCategory = async (req,res) => {
    try {
        let categoryId = req.params.id;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let category = admin.category.find(cat => cat.id == categoryId);
        console.log(category);
        if(!category){
            res.status(400).send('Category Not Found')
        }
        res.render('admin/category-edit',{category,admin});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditCategory = async (req,res) => {
    try {
        let categoryId = req.params.id;
        let {categoryName} = req.body;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let categoryInd = await admin.category.findIndex(cat => cat.id == categoryId);
        if(categoryInd == -1){
            res.status(400).send('Category Not Found')
        }else{
            admin.category[categoryInd].categoryName = categoryName ; 
            // if i add more things to edit in category i can change it here...
            await admin.save()
            res.redirect('/categories');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let deleteCategory = async (req,res) => {
    try {  
        let categoryId = req.params.id;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        admin.category = admin.category.filter(cat => cat.id != categoryId);
        admin.save();
        res.redirect('/categories')
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server Error')
    }
}


// SubCategory Managment
let subCategoryList = async (req,res) => {
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategory = admin.subCategory.map(item => item);
        res.render('admin/subCategoryList',{subCategory,admin})
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let addSubCategory = async (req,res) => {
    try {  
    const admin = await Admin.findOne();
    res.render('admin/subCategory-add',{admin})
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let submitAddSubCategory = async (req,res) => {
    try {
        let {subCategoryName} = req.body;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        admin.subCategory.push({subCategoryName});
        admin.save();
        res.redirect('/subCategories');
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let editSubCategory = async (req,res) => {
    try {
        let subCategoryId = req.params.id;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategory = admin.subCategory.find(cat => cat.id == subCategoryId);
        if(!subCategory){
            res.status(400).send('subCategory Not Found')
        }
        res.render('admin/subCategory-edit',{subCategory,admin});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditSubCategory = async (req,res) => {
    try {
        let subCategoryId = req.params.id;
        let {subCategoryName} = req.body;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategoryInd = await admin.subCategory.findIndex(cat => cat.id == subCategoryId);
        if(subCategoryInd == -1){
            res.status(400).send('Category Not Found')
        }else{
            admin.subCategory[subCategoryInd].subCategoryName = subCategoryName ; 
            // if i add more things to edit in category i can change it here...
            await admin.save()
            res.redirect('/subCategories');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let deleteSubCategory = async (req,res) => {
    try {
        let subCategoryId = req.params.id;
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        admin.subCategory = admin.subCategory.filter(sub => sub.id != subCategoryId)
        admin.save()
        res.redirect('/subCategories');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error')
    }
}


// User Management
let userList =async (req,res) => {
    try {
        const admin = await Admin.findOne();
        let user = await User.find();
        res.render('admin/customers',{user,admin});
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let userBlock = async (req,res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findOne({_id:userId});
        console.log(user);
        if(user){
            user.Blocked = !user.Blocked;
            await user.save();
        }
        res.redirect('/admin/Customers');
    } catch (error) {
        res.status(500).send('Error on admin Changing User status');
    }
}

// Vendor Management
let vendorList = async (req,res) => {
    try {
        const admin = await Admin.findOne();
        let vendor = await Vendor.find();
        res.render('admin/vendors',{vendor,admin})
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let vendorVerify = async (req,res) => {
    try {
        const vendorId = req.body.vendorId;
        const vendor = await Vendor.findOne({_id:vendorId});
        if(vendor){
            vendor.Status = !(vendor.Status);
            await vendor.save();
        }
        res.redirect('/admin/Vendors')
    } catch (error) {
        res.status(500).send('Error on vendor verification')
    }
}

// Coupon Management
let addCoupon = async (req,res) => {
    try {
        const admin = await Admin.findOne();
        res.render('admin/coupon-add',{admin});
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let listCoupon = async (req,res) => {
    try {
        let admin = await Admin.findOne();
        if(!admin){
          return res.status(404).send('Admin Not Found');
        }
        res.render('admin/coupons-list',{admin});
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let submitAddCoupon = async (req,res) => {
    try {
        let {status,startDate,endDate,couponCode,category,subCategory,limit,type,value} = req.body;
        let admin = await Admin.findOne();
        if(!admin){
          return res.status(404).send('Admin Not found')
        }
        if(!admin.coupons){
          admin.coupons = [];
        }
        if(startDate === ""){
          startDate = undefined;
        };
        let discountProducts = {category,subCategory};
        let newCoupon = {status,startDate,endDate,couponCode,limit,type,value,discountProducts}
        admin.coupons.push(newCoupon);
        await admin.save();
        console.log("coupon added succesfully");
        res.redirect('/admin/couponList')
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let editCoupon = async (req,res) => {
    try {
        let admin = await Admin.findOne();
        if(!admin){
          return res.status(404).send("admin Not Found")
        }
        let coupon = admin.coupons.filter(coup => coup._id.toString() === req.params.couponId)
        if(!coupon){
          return res.status(404).send("Coupon Not Found");
        }
        res.render('admin/coupon-edit',{coupon:coupon[0],admin})
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}
let submitEditCoupon = async (req, res) => {
    try {
        let couponId = req.params.couponId;
        let admin = await Admin.findOne({_id:req.user.id});
        if(!admin){
          return res.status(404).send('Admin Not found');
        }
      
        let {status, startDate, endDate, couponCode, category, subCategory, limit, type, value} = req.body;
        let updatedCoup = {status, startDate, endDate, couponCode, category, subCategory, limit, type, value};
      
        let coupon = admin.coupons.find(val => val._id.toString() === couponId);
        if (!coupon) {
          return res.status(404).send('Coupon Not found');
        }
      
        Object.assign(coupon, updatedCoup);
        await admin.save();
    
        res.redirect('/admin/couponList');
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
};
let deleteCoupon = async (req,res) => {
    try {
        let {couponId} = req.body;
        let admin = await Admin.findById(req.user.id);
        admin.coupons = admin.coupons.filter(coup => coup._id.toString() !== couponId)
        await admin.save();
        res.json({message:"coupon removed succesfully"})
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}


let adminLogout = (req, res) => {
    try {
        res.clearCookie("admin_jwt");
        res.redirect("/admin");
        console.log("Admin logged out");
        return;
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).send("Internal Server Error");
    }
};

//admin side listing
let productList = async (req, res) =>{
    try {
        const admin = await Admin.findOne();
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const startIndex = (page - 1) * limit;

        let vendors = await Vendor.find().populate('products').select('vendorName products');
        let products = vendors.flatMap(vendor => vendor.products);
        const totalProducts = products.length;
        products = products.slice(startIndex, startIndex + limit);
        console.log("products :",products.length,products)

        res.render('admin/product-grid', { products, admin, currentPage: page, totalPages: Math.ceil(totalProducts / limit) });
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}

let productDetails = async (req, res) => {
    try {
        let productId = req.params.productId;
        const admin = await Admin.findOne();
        if (!mongoose.Types.ObjectId.isValid(productId)) {
        }
        const vendor = await Vendor.findOne({ 'products._id': productId });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        let product = vendor.products.find(prod => prod._id == productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.render('admin/productDetails', { product, vendor, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// let orderList = async (req,res) => {
//     try {
//         const admin = await Admin.findOne();
//         let orders = await Order.find();
//         // aggregate([
//         //     { $unwind: '$products' }
//         //   ]);
          
//           for (let order of orders) {
//             // const vendor = await Vendor.findOne({ 'products._id': order.products._id });
//             // if (vendor) {
//             //   const product = vendor.products.find(p => p._id.equals(order.products._id));
//             //   order.products = {
//             //     _id: product._id,
//             //     productName: product.productName,
//             //     description: product.description,
//             //     price: product.price,
//             //     brand: product.brand,
//             //     category: product.category,
//             //     subCategory: product.subCategory,
//             //     stockQuantity: product.stockQuantity,
//             //     addedOn: product.addedOn,
//             //     images: product.images,
//             //     status: order.products.status,
//             //     quantity: order.products.quantity
//             //   };
//             // }
//             let user = await User.findById(order.userId);
//             if (user) {
//               order.userName = user.username;
//             //   order.userEmail = user.email;
//             }
//           }
          
//         // Grouping orders by _id and aggregating products into an array for each order
//             // let groupedOrders = orders.reduce((acc, order) => {
//             //     const existingOrderIndex = acc.findIndex(o => o._id.equals(order._id));
//             //     if (existingOrderIndex !== -1) {
//             //     acc[existingOrderIndex].products.push(order.products);
//             //     } else {
//             //     acc.push({
//             //         _id: order._id,
//             //         total: order.total,
//             //         discount: order.discount,
//             //         userId: order.userId,
//             //         shippingAddress: order.shippingAddress,
//             //         paymentMethod: order.paymentMethod,
//             //         orderDate: order.orderDate,
//             //         userName: order.userName,
//             //         userEmail: order.userEmail,
//             //         products: [order.products]
//             //     });
//             //     }
//             //     return acc;
//             // }, []);
            
//         res.render('admin/orderView', { orders:orders.reverse() , admin});
//       } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: 'Failed to get orders' });
//       }
// }
let orderList = async (req, res) => {
    try {
        const admin = await Admin.findOne();
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const startIndex = (page - 1) * limit;
        
        let orders = await Order.find().sort({ orderDate: -1 }).skip(startIndex).limit(limit);
        
        for (let order of orders) {
            let user = await User.findById(order.userId);
            if (user) {
                order.userName = user.username;
            }
        }
        
        const totalPages = Math.ceil(await Order.countDocuments() / limit);
        
        res.render('admin/orderView', { orders, admin, totalPages, currentPage: page });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get orders' });
    }
}

let orderDetails = async (req, res) => {
    try {
      let admin = await Admin.findOne();
      const {orderId} = req.params;
      let order = await Order.findById(orderId);
      let updatedProducts = [];
  
      for (let ind = 0; ind < order.products.length; ind++) {
        const prod = order.products[ind];
        const vendor = await Vendor.findOne({ 'products._id': prod._id });
        if (vendor) {
          const product = vendor.products.find(p => p._id.equals(prod._id));
          updatedProducts.push({
            _id: product._id,
            productName: product.productName,
            price: product.price,
            images: product.images,
            status: prod.status,
            quantity: prod.quantity,
            vendor:vendor.vendorName
          });
        }
      }
      res.render('admin/orderDetails', { order, admin, updatedProducts });
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
};
  

// Banner Management
let updateBanners = async (req,res) => {
    try {
        const admin = await Admin.findOne();
        res.render('admin/banners',{admin});
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}
let changeMainBanner = async(req,res) => {
    try {
        let imageData = req.files;
        console.log("images : ",req.files)
        const imageUrls = [];
        if(imageData){
            for (const file of imageData) {
              const result = await cloudinary.uploader.upload(file.path);
              imageUrls.push(result.secure_url);
            }
            console.log(imageUrls);

            const admin = await Admin.findOne();
            admin.banner.mainBanner = imageUrls;
            await admin.save();

        }else{
            console.log("No Image data found");
        }
        res.redirect('/bannerView');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error on Changing Banners')
    }
}
let changeOfferBanner = async (req, res) => {
    try {
        let count = req.params.count;
        console.log("count :",count)
        let imageData = req.file;
        let offerValue = req.body.offerVal;
        let title = req.body.title;

        console.log("image passed to cloudinary upload.")
        if (imageData && offerValue && title) {
            const result = await cloudinary.uploader.upload(imageData.path);
            const imageUrl = result.secure_url;
            console.log("image : ",imageUrl);

            const admin = await Admin.findOne();
            admin.banner.offerBanner[count-1].image = imageUrl;
            admin.banner.offerBanner[count-1].offerValue = offerValue;
            admin.banner.offerBanner[count-1].title = title;
            await admin.save();

            console.log("Offer banner changed successfully.");
        } else {
            console.log("Missing image data, offer value, or title.");
        }
        res.redirect('/bannerView');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error on Changing Offer Banner');
    }
}
let changeSingleBanner = async (req,res) => {
    try {
        let imageData = req.file;
        console.log("image : ",req.file)
        const imageUrl = [];

        if(imageData){
            const result = await cloudinary.uploader.upload(imageData.path);
            imageUrl.push(result.secure_url);
            console.log(imageUrl);

            const admin = await Admin.findOne();
            admin.banner.multiplePageBanner = imageUrl;
            await admin.save();

        }else{
            console.log("No Image data found");
        }
        res.redirect('/bannerView');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error on Changing Banners')
    }
}


let getGraphData = async (req, res) => {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const totalPrices = await Order.aggregate([
        {
            $match: {
            orderDate: { $gte: tenDaysAgo }
            }
        },
        {
            $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            total: { $sum: "$total" }
            }
        },
        {
            $sort: { _id: 1 }
        }
        ]);

        res.json(totalPrices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
let getDayOrders = async (req, res) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);
  
      const totalOrders = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: sevenDaysAgo }
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
  
      res.json(totalOrders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
};
let getOrderReport = async (req, res) => {
    try {
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
    
        let orders = await Order.find({
            orderDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });
        for (let order of orders) {
          let user = await User.findById(order.userId);
          order.userName = user.username;
          order.userMail = user.email;
          for (let product of order.products) {
            let productDetails = await getProductDetails.getProductDetails(product._id);
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
let getOrderCvv = async (req, res) => {
    try {
        let startDate = req.body.startDate;
        let endDate = req.body.endDate;
    
        let query = {};
        if (startDate && endDate) {
            query.orderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
    
        let orders = await Order.find(query);
        for (let order of orders) {
            let user = await User.findById(order.userId);
            order.userName = user.username;
            order.userMail = user.email;
            for (let product of order.products) {
                let productDetails = await getProductDetails.getProductDetails(product._id);
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

let productWiseOrder = async (req, res) => {
    try {
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
        const product = await getProductDetails.getProductDetails(productId)
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
let productWiseReport = async (req,res) => {
    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
  

module.exports = {
    dashboard,
    adminLogin,
    submitAdminLogin,

    categoryList,
    addCategory,
    submitAddCategory,
    editCategory,
    submitEditCategory,
    deleteCategory,

    subCategoryList,
    addSubCategory,
    submitAddSubCategory,
    editSubCategory,
    submitEditSubCategory,
    deleteSubCategory,

    userList,
    userBlock,

    vendorList,
    vendorVerify,
    productList,
    productDetails,
    orderList,
    orderDetails,

    updateBanners,
    changeMainBanner,
    changeOfferBanner,
    changeSingleBanner,

    addCoupon,
    listCoupon,
    submitAddCoupon,
    editCoupon,
    submitEditCoupon,
    deleteCoupon,

    adminLogout,
    
    getGraphData,
    getDayOrders,
    getOrderCvv,
    getOrderReport,

    productWiseOrder,
    productWiseReport,
}