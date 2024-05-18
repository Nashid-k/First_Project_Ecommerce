const mongoose=require('mongoose')
const otpSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User',

    },
    otp:{
        type:Number,
        required:true
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 600 
    }
})

module.exports=mongoose.model("Otp",otpSchema)