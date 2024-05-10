const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/order');
const Admin = require('../models/admin');


let getclients = (vendorId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let orders = await Order.aggregate([
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$userId',
                        orders: {
                            $push: {
                                _id: '$_id',
                                products: '$products',
                                total: '$total',
                                discount: '$discount',
                                shippingAddress: '$shippingAddress',
                                paymentMethod: '$paymentMethod',
                                orderDate: '$orderDate'
                            }
                        }
                    }
                }
            ]);
    
            // Map the orders array to include userId
            orders = orders.map(order => {
                return {
                    userId: order._id,
                    orders: order.orders
                };
            });
    
            for (let userOrder of orders) {
                let user = await User.findById(userOrder.userId);
                if (user) {
                    userOrder.userName = user.username;
                    userOrder.userEmail = user.email;
                }
            }
            resolve(orders);
        } catch (error) {
            reject(error);
        }
    }); 
}
let orderOfVendor = (vendorId) => {
    return new Promise(async(resolve,reject) => {
        try {
            let orders= await Order.aggregate([
                {$unwind:'$products'},
                {$match:{'products.vendorId':vendorId}}
              ]);
              for (let order of orders) {
                let singleOrder = await Order.findById(order._id);
                let singleD = Math.round(singleOrder.discount/singleOrder.products.length)
                const vendor = await Vendor.findOne({ 'products._id': order.products._id });
                if (vendor) {
                  const product = vendor.products.find(p => p._id.equals(order.products._id));
                  order.products = {
                    _id: product._id,
                    productName: product.productName,
                    description: product.description,
                    price: product.price,
                    discount:singleD,
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
              resolve(orders)
        } catch (error) {
            reject(error)
        }
    })
}
const orderCountByCategory = (vendorId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let orders= await Order.aggregate([
                {$unwind:'$products'},
                {$match:{'products.vendorId':vendorId}}
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
            let categoryCounts = {};
            for (let order of orders) {
                let category = order.products.category;
                if (categoryCounts[category]) {
                    categoryCounts[category]++;
                } else {
                    categoryCounts[category] = 1;
                }
            }

            let categories = [];
            for (let category in categoryCounts) {
                categories.push({ category: category, count: categoryCounts[category] });
            }
            resolve(categories)
        } catch (error) {
            reject(error)
        }
    });
};

module.exports = {
    getclients,
    orderOfVendor,
    orderCountByCategory
}