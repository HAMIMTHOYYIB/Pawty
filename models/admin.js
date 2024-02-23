const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminname:{
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
    }
    // otp:{
    //     type:String
    // },
    // otpExpiration:{
    //     type:Date
    // }
});

const Admin = mongoose.model('Admin',adminSchema);

module.exports = Admin;