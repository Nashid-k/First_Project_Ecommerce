const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
name:{
    type:String,
    required:true
},
is_listed:{
    type:Boolean,
    default:true
},
description:{
    type:String,
    requied:true
},
mainImage:{
    type:String,
    required:true
},
screenshots:{
    type:[String],
    required:true
},
price:{
    type:Number,
    required:true
},
quantity:{
    type:Number,
    required:true
},
size:{
    type:String,
    required:true
},
category: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Category',
      required: true 
}


},{timestamps:true})


module.exports= mongoose.model("Products",productSchema)