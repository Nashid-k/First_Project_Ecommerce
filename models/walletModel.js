const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    transactionMethod: {
        type: String,
        required: true,
        enum: ["Debit", "Razorpay", "Referral", "Refund", "Payment", "Credit"]
    },
    date: {
        type: Date,
        default: Date.now
    }
});


const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    balance: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    transactions: [transactionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);


