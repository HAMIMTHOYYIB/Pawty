const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/order');
const Admin = require('../models/admin');


let getclients = async (vendorId) => {
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
    return orders;
};

let orderOfVendor = async (vendorId) => {
    let orders = await Order.aggregate([
        { $unwind: '$products' },
        { $match: { 'products.vendorId': vendorId } }
    ]);

    let orderIds = orders.map(order => order._id);
    let singleOrders = await Order.find({ _id: { $in: orderIds } });

    let vendorProductIds = orders.map(order => order.products._id);
    let vendors = await Vendor.find({ 'products._id': { $in: vendorProductIds } });

    let userMap = {};
    for (let order of orders) {
        let singleOrder = singleOrders.find(so => so._id.equals(order._id));
        let singleD = Math.round(singleOrder.discount / singleOrder.products.length);
        order.products = { ...order.products, discount: singleD };

        let vendor = vendors.find(v => v.products.some(p => p._id.equals(order.products._id)));
        if (vendor) {
            let product = vendor.products.find(p => p._id.equals(order.products._id));
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
                status: order.products.status,
                quantity: order.products.quantity
            };
        }

        if (!userMap[order.userId]) {
            let user = await User.findById(order.userId);
            if (user) {
                userMap[order.userId] = { userName: user.username, userEmail: user.email };
            }
        }
        order.userName = userMap[order.userId].userName;
        order.userEmail = userMap[order.userId].userEmail;
    }

    return orders;
};

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