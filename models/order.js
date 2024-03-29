const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locality: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  products: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['Pending', 'Delivered', 'Cancelled', 'Out Of Delivery'],
        default:'Pending',
        required : true
      },
      vendorId:{
        type:String,
        required:true
      },
    }
  ],
  total: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  userId: {
    type: String,
    required: true
  },
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash On Delivery', 'Razorpay'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Delivered', 'Cancelled', 'Out Of Delivery'],
    default: 'Pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
