const jwt = require("jsonwebtoken");
require("dotenv").config();

const adminAuthMiddleware = (req, res, next) => {
    const token = req.cookies.admin_jwt;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{
        if(err){
          res.redirect('/admin')
        }else{
          req.user = decodedToken
          next();
        }
      });
    }else{
      res.redirect("/admin")
    }
  };
  
module.exports = adminAuthMiddleware;