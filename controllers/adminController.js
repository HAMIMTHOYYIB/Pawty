
const Admin = require('../models/admin');

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
module.exports = {
    dashboard,
    adminLogin,
    submitAdminLogin
}