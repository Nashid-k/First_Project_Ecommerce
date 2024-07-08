const mongoose = require('mongoose')
const categorySchema = new mongoose.Schema({
name:{
    type:String,
    required:true
},
is_listed:{
    type:Boolean,
    default:true,
},
categoryImage:{
   type:String,
 
}
},{timestamps:true})


module.exports= mongoose.model("Category",categorySchema)