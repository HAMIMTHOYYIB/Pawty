
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/order')

let accountOrders = (userId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let orders= await Order.aggregate([
              {$unwind:'$products'},
              {$match:{'userId':userId}} 
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
                        status: order.products.status,
                        quantity: order.products.quantity
                    };
                }
                let user = await User.findById(order.userId);
                if (user) {
                    order.userName = user.username;
                    order.userEmail = user.email;
                }
            }
            resolve(orders);
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    accountOrders
}