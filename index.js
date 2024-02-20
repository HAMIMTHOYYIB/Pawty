const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


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
const port = 7003;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','ejs');
app.use(express.static('public'))

// app.use('/admin',adminRoutes);
// app.use('/vendor',vendorRoutes);
app.use('/',userRoutes);


app.listen(port,()=>{
    console.log(`App is running on : http://localhost:${port}`);
});