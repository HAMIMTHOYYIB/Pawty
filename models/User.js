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
        price : { type : Number }
    }],
    discount : {
        type: Number,
        default : 0
    },
    total: { type: Number,required:true}
});

const wishlistSchema = new mongoose.Schema({
    products:[{
        _id:{type:mongoose.Schema.Types.ObjectId, ref:'Vendor'},
        productName:{ type: String },
        price:{ type: Number },
        images:{ type: Array},
        stockQuantity: {type: Number}
    }]
})


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
    wishlist:{
        type: wishlistSchema,
        default:{ products:[] }
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