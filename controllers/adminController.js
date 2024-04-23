
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
}

let adminLogin = (req, res) => {
    if(req.cookies.admin_jwt){
        res.redirect('/Dashboard')
    }else{
        res.render('admin/admin-login', { passError: '' });
    }
}

let submitAdminLogin = async (req,res) => {
    const {email, password} = req.body;
    if(email && password){
        try {
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
        } catch (error) {
            console.log("Error on Login Submit.",error);
            res.status(500).send("Internal Server Error");
        }  
    }else{
        res.render('admin/admin-login',{passError:'Please Complete the fields :'})
    }
}


//Category Managment
let categoryList = async (req,res) => {
    let admin = await Admin.find();
    if(!admin){
        res.status(400).send('Admin not found');
    }
    let category = admin[0].category.map(category => category);
    res.render('admin/categorie-list',{category});
}

let addCategory = (req,res) => {
    res.render('admin/categories-add');
}
let submitAddCategory = async (req,res) => {
    let {categoryName} =req.body;
    let admin = await Admin.findOne();
    if(!admin){
        res.status(400).send('Admin not found')
    }
    admin.category.push({categoryName});
    admin.save();
    res.redirect('/categories')
}
let editCategory = async (req,res) => {
    let categoryId = req.params.id;
    console.log('categoryId : ',categoryId);
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let category = admin.category.find(cat => cat.id == categoryId);
        console.log(category);
        if(!category){
            res.status(400).send('Category Not Found')
        }
        res.render('admin/category-edit',{category});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditCategory = async (req,res) => {
    let categoryId = req.params.id;
    console.log("categoryId  : ",categoryId);
    let {categoryName} = req.body;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let categoryInd = await admin.category.findIndex(cat => cat.id == categoryId);
        console.log("categoryInd : ",categoryInd);
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
    let categoryId = req.params.id;
    try {
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
    let admin = await Admin.find();
    if(!admin){
        res.status(400).send('Admin Not Found')
    }
    let subCategory = admin[0].subCategory.map(item => item);
    res.render('admin/subCategoryList',{subCategory})
}

let addSubCategory = (req,res) => {
    res.render('admin/subCategory-add')
}

let submitAddSubCategory = async (req,res) => {
    let {subCategoryName} = req.body;
    let admin = await Admin.findOne();
    if(!admin){
        res.status(400).send('Admin Not Found')
    }
    admin.subCategory.push({subCategoryName});
    admin.save();
    res.redirect('/subCategories');
}

let editSubCategory = async (req,res) => {
    let subCategoryId = req.params.id;
    console.log('subCategoryId : ',subCategoryId);
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategory = admin.subCategory.find(cat => cat.id == subCategoryId);
        console.log(subCategory);
        if(!subCategory){
            res.status(400).send('subCategory Not Found')
        }
        res.render('admin/subCategory-edit',{subCategory});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditSubCategory = async (req,res) => {
    let subCategoryId = req.params.id;
    console.log("subCategoryId  : ",subCategoryId);
    let {subCategoryName} = req.body;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategoryInd = await admin.subCategory.findIndex(cat => cat.id == subCategoryId);
        console.log("subCategoryInd : ",subCategoryInd);
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
    let subCategoryId = req.params.id;
    try {
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
    let user = await User.find();
    res.render('admin/customers',{user});
}

let userBlock = async (req,res) => {
    const userId = req.body.userId;
    try {
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
    let vendor = await Vendor.find();
    res.render('admin/vendors',{vendor})
}
let vendorsPage = (req,res) => {
    res.render('admin/admin-vendorList')
}
let vendorVerify = async (req,res) => {
    const vendorId = req.body.vendorId;
    try {
        const vendor = await Vendor.findOne({_id:vendorId});
        if(vendor){
            console.log("verified Vendor :",vendor);
            vendor.Status = !(vendor.Status);
            await vendor.save();
        }
        res.redirect('/admin/Vendors')
    } catch (error) {
        res.status(500).send('Error on vendor verification')
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

let productList = async (req,res) =>{
    let products = await Vendor.find().populate('products').select('vendorName products');
    res.render('admin/product-grid', {products});
    // console.log("products : ",products);
}

let productDetails = async (req, res) => {
    let productId = req.params.productId;
    try {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log(productId)
        }
        const vendor = await Vendor.findOne({ 'products._id': productId });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        let product = vendor.products.find(prod => prod._id == productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // console.log("vendor :", vendor);
        // console.log("product :", product);
        res.render('admin/productDetails', { product, vendor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// let productList = async (req,res) => {
//     let products =  await Vendor.find().select("products");
//     console.log("products :",products);
//     res.render('users/shop-org',{products})
// };

let orderList = async (req,res) => {
    try {
    
        // Aggregate orders to unwind products array
        let orders= await Order.aggregate([
          {$unwind:'$products'}
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
          if (user) {
            order.userName = user.username;
            order.userEmail = user.email;
          }
        }
        console.log("orders :",orders)
        res.render('admin/orderView', { orders: orders.reverse()});
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get orders' });
      }
}

let updateBanners = async (req,res) => {
    const admin = await Admin.findOne();
    res.render('admin/banners',{admin});
}
let changeMainBanner = async(req,res) => {
    let imageData = req.files;
    console.log("images : ",req.files)
    const imageUrls = [];
    try {
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
    let count = req.params.count;
    console.log("count :",count)
    let imageData = req.file;
    let offerValue = req.body.offerVal;
    let title = req.body.title;

    try {
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
    let imageData = req.file;
    console.log("image : ",req.file)
    const imageUrl = [];
    try {
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
};
let getOrderCvv = async (req, res) => {
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
};

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

    updateBanners,
    changeMainBanner,
    changeOfferBanner,
    changeSingleBanner,

    adminLogout,
    
    getGraphData,
    getDayOrders,
    getOrderCvv,
    getOrderReport,
    vendorsPage,

    productWiseOrder,
    productWiseReport,
}