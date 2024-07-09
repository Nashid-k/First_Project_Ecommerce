const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const nocache = require('nocache');
const passport = require('passport');
require('./middlewares/passport');

dotenv.config();

mongoose.connect(process.env.mongo_url);


// const mongoUrl = 'mongodb+srv://nashifa4u:6hUkUU62IeOAq7Xg@nashifa.9gfjeop.mongodb.net/?retryWrites=true&w=majority&appName=Nashifa';

// mongoose.connect(mongoUrl)
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));



const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

const app = express();
app.set('view engine','ejs')

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
    secret: 'thisissecret',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());
app.use(nocache());

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(__dirname + '/public'));
app.use('/productImages', express.static('upload'));

// Routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

// Google OAuth Routes
app.get('/auth', passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/auth/callback', passport.authenticate('google', {
    successRedirect: '/auth/callback/success',
    failureRedirect: '/auth/callback/failure'
}));

app.get('/auth/callback/success', (req, res) => {
    if (req.user) {
        res.redirect('/home'); 
    } else {
        res.redirect('/login'); 
    }
});

app.get('/auth/callback/failure', (req, res) => {
    res.send("Error");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`********************* CONNECTED TO DB **********************************`);
    console.log(`Server is running on http://localhost:${port}`);
});
