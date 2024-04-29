const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    status: {type: String,
        enum: ['Active', 'InActive'],
        default: 'Active'
    },
    startDate: {type: Date,required: true,default : Date.now},
    endDate: {type: Date,required: true,default : Date.now},
    couponCode: {type: String},
    discountProducts: {
        category:{type: String},
        subCategory:{type: String}
    },
    limit: {type: Number,required: true},
    type: {
      type: String,
      enum: ['percentage', 'fixedPrice'],
      default: 'percentage'
    },
    value: {type: Number,required: true}
  });

const adminSchema = new mongoose.Schema({
    adminname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    category: [{
        categoryName: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    subCategory: [{
        subCategoryName: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    banner: {
        mainBanner: {
            type: Array,
            required: true
        },
        offerBanner: [{
            image: {
                type: String,
                required: true
            },
            offerValue: {
                type: String,
            },
            title: {
                type: String,
            }
        }, {
            image: {
                type: String,
                required: true
            },
            offerValue: {
                type: Number,
                required: true
            },
            title: {
                type: String,
                required: true
            }
        }, {
            image: {
                type: String,
                required: true
            },
            offerValue: {
                type: Number,
                required: true
            },
            title: {
                type: String,
                required: true
            }
        }],
        multiplePageBanner: {
            type: Array,
            required: true
        }
    },
    coupons:{
        type:[couponSchema],
        default:[]
    }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;