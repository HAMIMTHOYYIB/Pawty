const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName:{type:String},
    description:{type:String},
    price:{type:String},
    brand:{type:String},
    category:{type:String},
    subCategory:{type:String},
    stockQuantity:{type:String},
    addedOn:{type:Date,default:Date.now},
    images:{type:Array},
});

  

const vendorSchema = new mongoose.Schema({
    vendorName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    JoinedAt:{
        type:Date,
        default:Date.now
    },
    Status:{
        type:Boolean,
        default:false
    },
    products:[productSchema],
    // coupons:{
    //     type:[couponSchema],
    //     default:[]
    // }
});

const Vendor = mongoose.model('Vendor',vendorSchema);

module.exports = Vendor