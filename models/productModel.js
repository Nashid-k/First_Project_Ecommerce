const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewText: {
    type: String,
    required: true
  },
  starRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  is_listed: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: true
  },
  mainImage: {
    type: String,
    required: true
  },
  screenshots: {
    type: [String],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  discount: {
    type: Number
  },
  reviews: [reviewSchema]
}, { timestamps: true });

module.exports = mongoose.model("Products", productSchema);
