const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const CartItem = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/userAddress");
const mongoose = require('mongoose')

const addToCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.query;
        const product = await Products.findById(productId);
        const price = product.price;
     

        let cartItem = await CartItem.findOne({ userId: userId, "product.productId": productId });

        if (!cartItem) {
            cartItem = new CartItem({
                userId: userId,
                product: {
                    productId: productId,
                    quantity: 1,
                    offerDiscount: 0,
                    totalPrice: price,
                    price: price,
                },
            });
        } else {
       
            res.redirect("/cart");
            return;
        }
        await cartItem.save();
        res.redirect("/cart");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const renderCart = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        const userData = await User.findById(userId);
        const cartItems = await CartItem.find({ userId: userId }).populate("product.productId");
        req.session.cartItems = cartItems
        res.render("cart", { cartItems: cartItems, userData: userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};













const updateCartItem = async (req, res) => {
  try {
      const userId = req.session.userId;
      const { productId, quantityChange } = req.body;
      const cartItems = await CartItem.find({ userId }).populate("product.productId");
      if (!cartItems || cartItems.length === 0) {
          return res.status(404).json({ message: "No cart items found for the user" });
      }

      const cartItemToUpdate = cartItems.find(
          (item) => item.product[0].productId.toString() === productId
      );

      if (!cartItemToUpdate) {
          return res.status(404).json({ message: "Cart item not found" });
      }

      const product = cartItemToUpdate.product[0];
      const newQuantity = product.quantity + parseInt(quantityChange); 

      if (newQuantity < 1) {
          return res.status(400).json({ message: "Quantity cannot be less than 1" });
      }

      const newPrice = product.price * newQuantity;

      await CartItem.findOneAndUpdate(
          { _id: cartItemToUpdate._id, "product.productId": product.productId },
          {
              $inc: { "product.$.quantity": parseInt(quantityChange) }, 
              $set: { "product.$.totalPrice": newPrice },
          },
          { new: true }
      );

      const updatedCartItems = await CartItem.find({ userId }).populate("product.productId");
      res.status(200).json({
          message: "Cart items updated successfully",
          cartItems: updatedCartItems,
      });
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
};






const removeCartItem = async (req, res) => {
  try {
      
      const userId = req.session.userId
      const {productId} = req.body
     await CartItem.deleteOne({ userId: userId, "product.productId": productId });
      res.status(200).json({success:true})

     
  } catch (error) {
   
      console.error(error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
}



const loadCheckout = async(req,res)=>{
  try{
const userId = req.session.userId
const cartItems = req.session.cartItems
console.log(cartItems);


    if (!userId) {
      return res.redirect("/login");
    }



    // Calculate the subtotal and total
  
  

  }catch(error){
    console.log(error.message);
  }
}


module.exports = {
    renderCart,
    addToCart,
    removeCartItem,
    loadCheckout,
   
    updateCartItem,
};

