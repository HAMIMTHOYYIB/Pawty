const mongoose = require('mongoose');

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
    otp:{
        type:String
    },
    otpExpiration:{
        type:Date
    },
    Blocked:{
        type:Boolean,
        default:false
    }
});

const User = mongoose.model('User',userSchema);

module.exports = User;