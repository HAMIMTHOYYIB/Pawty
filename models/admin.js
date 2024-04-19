const mongoose = require('mongoose');

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
        offerBanner: {
            type: Array,
            required: true
        },
        multiplePageBanner: {
            type: Array,
            required: true
        }
    }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
