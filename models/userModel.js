const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
    },
    password: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        required: true
    },
    is_admin: {
        type: Number,
        required: true
    },
    block: {
        type: Boolean,
        default: false
    },
    referral_code: {
        type: String,
    },
    referred_code: {
        type: String,
    },
    referral_bonus_given: {
        type: Boolean,
        default: false
    },
    usedCoupons: {
        type: [String],
        default: []
    },
    availableCoupons: [
        {
            couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
            couponCode: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
