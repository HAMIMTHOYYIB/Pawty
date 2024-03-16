const jwt = require("jsonwebtoken");
require("dotenv").config();

const userAuth = (req, res, next) => {g
    const token = req.cookies.user_jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{
        if(err){
            res.redirect('/login');
        //   res.render('vendor/vendorLogin',{passError:'Please Login'});
        }else{
          req.user = decodedToken
          next()
        }
      });
    }else{
      res.redirect("/login")
    // res.render('vendor/vendorLogin',{passError:''});
    }
  };
  
module.exports = userAuth;