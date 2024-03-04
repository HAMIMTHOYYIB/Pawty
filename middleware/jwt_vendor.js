const jwt = require("jsonwebtoken");
require("dotenv").config();

const vendorAuth = (req, res, next) => {
    const token = req.cookies.vendor_jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{
        if(err){
        //   res.render('vendor/vendorLogin',{passError:'Please Login'});
            res.redirect("/vendor")
        }else{
          req.user = decodedToken
          next()
        }
      });
    }else{
      res.redirect("/vendor")
    // res.render('vendor/vendorLogin',{passError:''});
    }
  };
  
module.exports = vendorAuth;