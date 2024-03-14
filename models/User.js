const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    name: {type: String,required: true},
    locality: {type: String,required: true},
    street: {type: String,required: true},
    city: {type: String,required: true},
    state: {type: String,required: true},
    phone: {type: String,required: true},
    pincode: {type: String,required: true}
});

const cartSchema = new mongoose.Schema({
    products: [{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        quantity: { type: Number },
        productName: { type: String },
        price: { type: Number },
        images: { type: Array }
    }],
    total: { type: Number }
});


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:Number
    },
    password:{
        type:String
    },
    address:[addressSchema],
    cart:{
        type: cartSchema,
        default: { products: [], total: 0 }
    },
    otp:{
        type:String
    },
    otpExpiration:{
        type:Date
    },
    Blocked:{
        type:Boolean,
        default:false
    },
    signedAt:{
        type:Date,
        default:Date.now
    }
});

const User = mongoose.model('User',userSchema);

module.exports = User;