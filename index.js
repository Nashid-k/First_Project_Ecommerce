const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/Nashifa_ecommerce')





const express = require('express')
const app = express()



const bodyParser = require('body-parser')
const nocache=require('nocache')
const session = require('express-session')
const flash = require('express-flash')
app.use(session({
    secret:'thisissecret',
    resave:false,
    saveUninitialized:true
}))

app.use(flash())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(nocache())

const path = require('path')
// app.use(express.static('public'))
app.use(express.static(__dirname+'/public'))
app.use('/productImages',express.static('upload'))
const userRoute = require('./routes/userRoute')

const adminRoute = require('./routes/adminRoute')
app.use('/',userRoute)
app.use('/admin',adminRoute)

app.listen(3000,()=>{
    console.log(`http://localhost:3000`);
})