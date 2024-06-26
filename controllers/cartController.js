const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const CartItem = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/userAddress");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");

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
        req.session.cartItems = cartItems;
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

        const cartItemToUpdate = cartItems.find((item) => item.product[0].productId.toString() === productId);

        if (!cartItemToUpdate) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        const product = cartItemToUpdate.product[0];
        const newQuantity = product.quantity + parseInt(quantityChange);

        if (newQuantity < 1) {
            return res.status(400).json({ message: "Quantity cannot be less than 1" });
        }

        // Check if the updated quantity exceeds available stock
        const currentProduct = await Products.findById(product.productId);
        if (newQuantity > currentProduct.quantity) {
            return res.status(400).json({ message: "Not enough stock available" });
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
        const userId = req.session.userId;
        const { productId } = req.body;
        const cartItem = await CartItem.findOne({ userId, "product.productId": productId }).populate(
            "product.productId"
        );
        const product = cartItem.product[0];
        await CartItem.deleteOne({ userId: userId, "product.productId": productId });
        await Products.updateOne({ _id: product.productId }, { $inc: { quantity: product.quantity } });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login");
        }
        
        const cartItems = await CartItem.find({ userId: userId }).populate("product.productId");

        const userData = await User.findById(userId);
        const addressData = await Address.find({ userId: userId });

        if (!userId) {
            return res.redirect("/login");
        } else {
            let total = 0;
            cartItems.forEach((item) => {
                item.product.forEach((product) => {
                    total += product.totalPrice;
                });
            });

            res.render("checkout", {
                cartItems,
                subtotal: total,
                total: total,
                userData: userData,
                addressData: addressData,
            });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash("error", "Error occurred during order placement. Please login and retry.");
            return res.redirect("/login");
        }

        const { selectedAddress, paymentMethod } = req.body;

        if (!selectedAddress) {
            req.flash("error", "Please select a delivery address.");
            return res.redirect("/checkout");
        } else if (!paymentMethod) {
            req.flash("error", "Please select a payment method.");
            return res.redirect("/checkout");
        }

        const cartItems = await CartItem.find({ userId }).populate("product.productId");
        const cartId = cartItems.map((item) => item._id);
        if (cartItems.length === 0) {
            req.flash("error", "Your cart is empty.");
            return res.redirect("/cart");
        }

        let orderAmount = 0;
        const orderedItems = cartItems.flatMap((item) =>
            item.product.map((product) => {
                const priceAtPurchase = product.price; 
                const totalProductAmount = priceAtPurchase * product.quantity; 

                orderAmount += totalProductAmount;

                return {
                    productId: product.productId,
                    quantity: product.quantity,
                    totalProductAmount: totalProductAmount,
                    priceAtPurchase: priceAtPurchase 
                };
            })
        );
        const pricesAtPurchase = orderedItems.map(item => item.priceAtPurchase);
        const orderData = new Order({
            cartId: cartId,
            userId: userId,
            orderedItem: orderedItems,
            orderAmount: orderAmount, 
            deliveryAddress: selectedAddress,
            paymentMethod: paymentMethod,
            paymentStatus: true,
            orderDate: Date.now(),
            priceAtPurchase:pricesAtPurchase
        });

        await orderData.save();


        for (const item of orderedItems) {
            await Products.updateOne({ _id: item.productId }, { $inc: { quantity: -item.quantity } });
        }

        await CartItem.deleteMany({ userId });

        res.render("orderplaced", { orderId: orderData._id });
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while placing the order.");
        res.redirect("/checkout");
    }
};


const addNewAddress = async(req,res)=>{
try{
    const userId = req.session.userId
    if(!userId){
        res.redirect('/login')
    }else{
        const userData = await User.findById(userId)
        res.render('addCheckoutAddress',{userData})
    }
}catch(error){
    console.log(error.message);
}
}
const     insertCheckoutAddress= async(req,res)=>{
    try {
        const userId = req.session.userId;
        const { pincode, locality, address, city, state, addresstype } = req.body;

        if (!userId) {
            req.flash("error", "You must be logged in to perform this action");
            return res.redirect("/login");
        }

        if (!pincode || !locality || !address || !city || !state || !addresstype) {
            req.flash("error", "All fields are required");
            return res.redirect("/addNewAddress");
        }

        const pincodeRegex = /^\d+$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash("error", "Pincode must contain only numbers");
            return res.redirect("/addNewAddress");
        }


        const allFieldsAreSpaces = Object.values(req.body).every(value => value.trim() === "");
        if (allFieldsAreSpaces) {
            req.flash("error", "All fields cannot be empty or contain only spaces");
            return res.redirect("/addNewAddress");
        }

        const newAddress = new Address({
            userId,
            pincode,
            locality,
            address,
            city,
            state,
            addresstype,
            
        });

        const userAddress = await newAddress.save();

        req.session.useraddress = userAddress;
        req.flash("success", "Address added successfully");
        res.redirect("/checkout");
   
    } catch (error) {
        console.log(error.message);
        req.flash("error", "Internal server error");
        res.redirect("/addNewAddress");
    }
    }
    
module.exports = {
    renderCart,
    addToCart,
    removeCartItem,
    loadCheckout,
    updateCartItem,
    placeOrder,
    addNewAddress,
    insertCheckoutAddress
};
