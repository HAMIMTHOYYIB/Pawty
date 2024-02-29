
const Admin = require('../models/admin');
const User = require('../models/User');

let dashboard = (req,res) => {
    res.render('admin/index')
}
let adminLogin = (req,res) => {
    res.render('admin/admin-login',{passError:''})
}

let submitAdminLogin = async (req,res) => {
    console.log("req.body : ", req.body);
    const {email, password} = req.body;
    if(email && password){
        try {
            const loginAdmin = await Admin.findOne({email: email});
            if (!loginAdmin) {
                return res.status(404).render('admin/admin-login', { passError: 'Admin Not Found' });             //send('User Not Found');
            }
            console.log("loginAdmin : ", loginAdmin);
        
            if(password !== loginAdmin.password){
                return res.status(401).render('admin/admin-login',{passError : 'Wrong Password'});
            }else{
                res.render('admin/index');
            }
        } catch (error) {
            console.log("Error on Login Submit",error);
            res.status(500).send("Internal Server Error");
        }  
    }else{
        res.render('admin/admin-login',{passError:'Please Complete the fields :'})
    }
}


//Category Managment
let categoryList = async (req,res) => {
    let admin = await Admin.find();
    if(!admin){
        res.status(400).send('Admin not found');
    }
    let category = admin[0].category.map(category => category);
    res.render('admin/categorie-list',{category});
}

let addCategory = (req,res) => {
    res.render('admin/categories-add');
}
let submitAddCategory = async (req,res) => {
    let {categoryName} =req.body;
    let admin = await Admin.findOne();
    if(!admin){
        res.status(400).send('Admin not found')
    }
    admin.category.push({categoryName});
    admin.save();
    res.redirect('/categories')
}
let editCategory = async (req,res) => {
    let categoryId = req.params.id;
    console.log('categoryId : ',categoryId);
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let category = admin.category.find(cat => cat.id == categoryId);
        console.log(category);
        if(!category){
            res.status(400).send('Category Not Found')
        }
        res.render('admin/category-edit',{category});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditCategory = async (req,res) => {
    let categoryId = req.params.id;
    console.log("categoryId  : ",categoryId);
    let {categoryName} = req.body;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let categoryInd = await admin.category.findIndex(cat => cat.id == categoryId);
        console.log("categoryInd : ",categoryInd);
        if(categoryInd == -1){
            res.status(400).send('Category Not Found')
        }else{
            admin.category[categoryInd].categoryName = categoryName ; 
            // if i add more things to edit in category i can change it here...
            await admin.save()
            res.redirect('/categories');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let deleteCategory = async (req,res) => {
    let categoryId = req.params.id;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        admin.category = admin.category.filter(cat => cat.id != categoryId);
        admin.save();
        res.redirect('/categories')
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server Error')
    }
}


// SubCategory Managment
let subCategoryList = async (req,res) => {
    let admin = await Admin.find();
    if(!admin){
        res.status(400).send('Admin Not Found')
    }
    let subCategory = admin[0].subCategory.map(item => item);
    res.render('admin/subCategoryList',{subCategory})
}

let addSubCategory = (req,res) => {
    res.render('admin/subCategory-add')
}

let submitAddSubCategory = async (req,res) => {
    let {subCategoryName} = req.body;
    let admin = await Admin.findOne();
    if(!admin){
        res.status(400).send('Admin Not Found')
    }
    admin.subCategory.push({subCategoryName});
    admin.save();
    res.redirect('/subCategories');
}

let editSubCategory = async (req,res) => {
    let subCategoryId = req.params.id;
    console.log('subCategoryId : ',subCategoryId);
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategory = admin.subCategory.find(cat => cat.id == subCategoryId);
        console.log(subCategory);
        if(!subCategory){
            res.status(400).send('subCategory Not Found')
        }
        res.render('admin/subCategory-edit',{subCategory});
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}
let submitEditSubCategory = async (req,res) => {
    let subCategoryId = req.params.id;
    console.log("subCategoryId  : ",subCategoryId);
    let {subCategoryName} = req.body;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        let subCategoryInd = await admin.subCategory.findIndex(cat => cat.id == subCategoryId);
        console.log("subCategoryInd : ",subCategoryInd);
        if(subCategoryInd == -1){
            res.status(400).send('Category Not Found')
        }else{
            admin.subCategory[subCategoryInd].subCategoryName = subCategoryName ; 
            // if i add more things to edit in category i can change it here...
            await admin.save()
            res.redirect('/subCategories');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error')
    }
}

let deleteSubCategory = async (req,res) => {
    let subCategoryId = req.params.id;
    try {
        let admin = await Admin.findOne();
        if(!admin){
            res.status(400).send('Admin Not Found')
        }
        admin.subCategory = admin.subCategory.filter(sub => sub.id != subCategoryId)
        admin.save()
        res.redirect('/subCategories');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error')
    }
}


// User Management
let userList =async (req,res) => {
    let user = await User.find();
    res.render('admin/customers',{user});
}

let userBlock = async (req,res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findOne({_id:userId});
        console.log(user);
        if(user){
            console.log("user");
            user.Blocked = !user.Blocked;
            await user.save();
        }
        res.redirect('/Customers');
    } catch (error) {
        res.status(500).send('Error on admin Changing User status');
    }
}

// Vendor Management
// let userList =async (req,res) => {
//     let user = await User.find();
//     res.render('admin/customers',{user});
// }


module.exports = {
    dashboard,
    adminLogin,
    submitAdminLogin,

    categoryList,
    addCategory,
    submitAddCategory,
    editCategory,
    submitEditCategory,
    deleteCategory,

    subCategoryList,
    addSubCategory,
    submitAddSubCategory,
    editSubCategory,
    submitEditSubCategory,
    deleteSubCategory,

    userList,
    userBlock
}