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
    password:{
        type:String,
    },
    address:[addressSchema],
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