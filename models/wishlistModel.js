const mongoose = require('mongoose')
const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },  
    product: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products'
        },
        discountedPrice: {
            type: Number
        },
        discountPercent: {
            type: Number
        }
    }]
},{timestamps:true})

module.exports = mongoose.model('WishlistItem',wishlistSchema)