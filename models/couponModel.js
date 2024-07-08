const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  minPurchaseAmount: {
    type: Number,
    required: true
  },
  validity: {
    type: Date,
    required: true
  }
});


const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
