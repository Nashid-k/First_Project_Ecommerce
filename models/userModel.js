const mongoose = require('mongoose')
const userSchema = new  mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },

    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_verified:{
        type:Boolean,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    block:{
        type:Boolean,
        default:false
    }
  

}, { timestamps: true})

module.exports = mongoose.model("User",userSchema)