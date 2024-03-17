const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require('../models/User')

const userAuth = (req, res, next) => {
    const token = req.cookies.user_jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET,async (err, decodedToken)=>{
        if(err){
            res.redirect('/login');
        //   res.render('vendor/vendorLogin',{passError:'Please Login'});
        }else{
          req.user = decodedToken
          let user =  await User.findOne({_id:req.user.id});
          if(user.Blocked){
            return res.render('users/account-login', { passError: 'This Account is Restricted by the admin' });
          }else{
            next()
          }
        }
      });
    }else{
      res.redirect("/login")
    // res.render('vendor/vendorLogin',{passError:''});
    }
  };
  
module.exports = userAuth;