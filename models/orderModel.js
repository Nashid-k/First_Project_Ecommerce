const mongoose=require('mongoose')

const orderSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    cartId:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Cart_Items',
        required:true
    },
    orderedItem:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Products',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        priceAtPurchase:{
            type:Number,
            required:true
        },
        totalProductAmount:{
            type:Number,
            required:true
        },
        
    }],
    orderAmount: {
        type: Number,
        required: true, 

    },
    orderDate:{
        type:Date
    },
    deliveryAddress: {  
        type: mongoose.Schema.Types.ObjectId,
        ref:"Address",
        required: true,
    },
    orderStatus: {
        type: String,
        required: true,
        default:"pending"
    },
    deliveryDate:{
        type:Date
    },
    shippingDate:{
        type:Date
    },
    paymentMethod: {
        type: String,
        required: true,
   
    },
    coupon: {
        type: Number
    },
    paymentStatus:{
        type:Boolean,
        default:false
    },
    reasonForCancel:{
        type:String,
    }
    
},


{
    timestamps:true

})

module.exports=mongoose.model('Order',orderSchema)