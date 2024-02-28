const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config()

mongoose.connect('mongodb://localhost:27017/Pawty', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes =require('./routes/vendorRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(session({
    resave:false,
    saveUninitialized:true,
    secret:'topssecrett',
    cookie:{
        secure:false,
        httponly:true,
        maxAge:24*60*60*1000
    }
}));
app.use(cookieParser());
// app.use(jwtMiddleware);

const {parsed:config} = require('dotenv').config()
global.config = config

const port = 7003;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.use(express.static('public'));


app.use('/',adminRoutes);
app.use('/',vendorRoutes);
app.use('/',userRoutes);


app.listen(port,()=>{
    console.log(`App is running on : http://localhost:${port}`);
});