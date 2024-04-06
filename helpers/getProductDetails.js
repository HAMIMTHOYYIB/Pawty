
  
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/order')

let getProductDetails = (productId) => {
    return new Promise(async(resolve, reject) => {
            try {
              const vendor = await Vendor.findOne({ 'products._id': productId });
              if (!vendor) {
                throw new Error('Vendor not found');
              }
              const product = vendor.products.find((prod) => prod._id.toString() === productId.toString());
              if (!product) {
                throw new Error('Product not found');
              }
              resolve(product)
            } catch (error) {
                reject(error)

            }
        })
    }
module.exports = {
    getProductDetails
}