const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const CartItem = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/userAddress");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
// const { sendGooglePayTokenToGateway } = require('../utils/googlePayHelper');
const crypto = require('crypto');
const Coupon = require('../models/couponModel')

const { razorpay_id, razorpay_secret } = process.env

const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
    key_id: razorpay_id,
    key_secret: razorpay_secret
})

const addToCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.query;
        
        // Retrieve product details
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found");
        }

        const price = product.price;
        const discount = product.discount || 0;
        
        // Calculate discounted price and round to nearest integer
        const discountedPrice = Math.round(price - (price * (discount / 100)));

        // Check if the product already exists in the cart for the user
        let cartItem = await CartItem.findOne({ userId: userId, "product.productId": productId });

        if (!cartItem) {
            // If no cart item exists, create a new one
            cartItem = new CartItem({
                userId: userId,
                product: [{
                    productId: productId,
                    quantity: 1,
                    offerDiscount: discount,
                    totalPrice: discountedPrice,
                    price: discountedPrice,
                }]
            });
        } else {
         
            const existingProductIndex = cartItem.product.findIndex(item => item.productId.toString() === productId);
            if (existingProductIndex !== -1) {
              return  res.redirect('/cart');
            } else {
                cartItem.product.push({
                    productId: productId,
                    quantity: 1,
                    offerDiscount: discount,
                    totalPrice: discountedPrice,
                    price: price,
                });
            }
        }

        // Save the updated or new cart item
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

        // Recalculate the total price for each cart item and round to nearest integer
        const updatedCartItems = cartItems.map(item => {
            item.product = item.product.map(prod => {
                const unitPrice = prod.price / prod.quantity; // Get the unit price
                prod.totalPrice = Math.round(unitPrice * prod.quantity); // Recalculate and round total price
                return prod;
            });
            return item;
        });

        req.session.cartItems = updatedCartItems;
        return res.render("cart", { 
            cartItems: updatedCartItems, 
            userData: userData,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};





const updateCartItem = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId, quantityChange } = req.body;

        // Find all cart items for the user
        const cartItems = await CartItem.find({ userId }).populate("product.productId");

        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ message: "No cart items found for the user" });
        }

        // Find the cart item to update
        const cartItemToUpdate = cartItems.find(item => item.product[0].productId.toString() === productId);

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

        // Calculate new total price based on the updated quantity and round to nearest integer
        const unitPrice = product.totalPrice / product.quantity; // Calculate unit price
        const newTotalPrice = Math.round(unitPrice * newQuantity);

        // Update the cart item
        await CartItem.findOneAndUpdate(
            { _id: cartItemToUpdate._id, "product.productId": product.productId },
            {
                $set: {
                    "product.$.quantity": newQuantity,
                    "product.$.totalPrice": newTotalPrice,
                },
            },
            { new: true }
        );

        // Fetch updated cart items after update
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

        let total = 0;
        cartItems.forEach((item) => {
            item.product.forEach((product) => {
                total += product.totalPrice;
            });
        });

        let deliveryCharge;
        if (total < 10000) {
            deliveryCharge = 25;
        } else if (total < 40000) {
            deliveryCharge = 50;
        } else if (total < 60000) {
            deliveryCharge = 100;
        } else {
            deliveryCharge = 0;
        }

        
        res.render("checkout", {
            cartItems,
            subtotal: total,
            total: (total + deliveryCharge),
            userData: userData,
            addressData: addressData,
            razorpay_id: process.env.RAZORPAY_ID, // Assuming razorpay_id is an environment variable
            deliveryCharge
        });
    } catch (error) {
        console.log(error.message);
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to place an order."
            });
        }

        const { selectedAddress, paymentMethod, deliveryCharge } = req.body;
        console.log("Delivery Charge:", deliveryCharge);

        if (!selectedAddress) {
            return res.status(400).json({
                success: false,
                message: "Please select a delivery address."
            });
        } else if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Please select a payment method."
            });
        }

        // Retrieve cart items for the user
        const cartItems = await CartItem.find({ userId }).populate("product.productId");
        const cartId = cartItems.map(item => item._id);

        // Check if the cart is empty
        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        // Calculate total order amount and prepare ordered items
        let subtotal = 0;
        const orderedItems = [];

        for (const cartItem of cartItems) {
            for (const productItem of cartItem.product) {
                const product = await Products.findById(productItem.productId);

                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: `Product not found with ID: ${productItem.productId}`
                    });
                }

                if (product.quantity < productItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product: ${product.name}`
                    });
                }

                const priceAtPurchase = product.price;
                const itemSubtotal = priceAtPurchase * productItem.quantity;

                subtotal += itemSubtotal;

                orderedItems.push({
                    productId: productItem.productId,
                    quantity: productItem.quantity,
                    priceAtPurchase,
                    itemSubtotal
                });

                // Update product quantity
                product.quantity -= productItem.quantity;
                await product.save();
            }
        }

        // Calculate final order amount after deducting delivery charge
        const orderAmount = Math.max(0, subtotal + deliveryCharge);

        // Adjust individual product amounts proportionally
        const adjustmentFactor = orderAmount / subtotal;
        orderedItems.forEach(item => {
            item.totalProductAmount = Number((item.itemSubtotal * adjustmentFactor).toFixed(2));
            delete item.itemSubtotal; // Remove the temporary subtotal
        });

        // Check if payment method is wallet and user wallet has enough balance
        if (paymentMethod === 'wallet') {
            const userWallet = await Wallet.findOne({ userId });

            if (!userWallet) {
                return res.status(400).json({
                    success: false,
                    message: "Wallet not found for user."
                });
            }

            if (userWallet.balance < orderAmount) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient balance in wallet."
                });
            }

            const transaction = {
                amount: -orderAmount,
                transactionMethod: "Payment",
                date: Date.now()
            };

            userWallet.balance -= orderAmount;
            userWallet.transactions.push(transaction);

            await userWallet.save();
        }

        // Create new order document
        const orderData = new Order({
            cartId,
            userId,
            orderedItem: orderedItems,
            orderAmount,
            deliveryCharge,
            deliveryAddress: selectedAddress,
            paymentMethod,
            paymentStatus: paymentMethod !== 'razorpay',
            orderDate: Date.now(),
            priceAtPurchase: orderedItems.map(item => item.priceAtPurchase)
        });

        await orderData.save();

        // Process eligible coupons
        const eligibleCoupons = await Coupon.find({ minPurchaseAmount: { $lte: orderAmount } });

        if (eligibleCoupons.length > 0) {
            const user = await User.findById(userId);

            for (const coupon of eligibleCoupons) {
                const isCouponAvailable = user.availableCoupons.some(c => c.couponId.toString() === coupon._id.toString());
                if (!isCouponAvailable) {
                    user.availableCoupons.push({
                        couponId: coupon._id,
                        couponCode: coupon.code
                    });
                }
            }

            await user.save();
        }

        // If payment method is Razorpay, create Razorpay order
        if (paymentMethod === "razorpay") {
            const options = {
                amount: orderAmount * 100, // Amount in paisa
                currency: "INR",
                receipt: `order_${orderData._id}`
            };

            razorpayInstance.orders.create(options, (err, order) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to create Razorpay order."
                    });
                }

                res.json({
                    success: true,
                    orderId: orderData._id,
                    razorpayOrderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    key_id: razorpay_id
                });
            });
        } else {
            res.json({
                success: true,
                message: "Order placed successfully.",
                orderId: orderData._id
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while placing the order."
        });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // Construct the expected signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto.createHmac("sha256", razorpay_secret)
            .update(sign.toString())
            .digest("hex");

        // Check if the received signature matches the expected signature
        if (razorpay_signature === expectedSign) {
            // Update the order's payment status
            const updatedOrder = await Order.findByIdAndUpdate(orderId, { paymentStatus: true }, { new: true });
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            // Clear the cart items after successful order placement
            const cartItems = await CartItem.find({ userId: updatedOrder.userId });
            const cartItemIds = cartItems.map(item => item._id);
            await CartItem.deleteMany({ _id: { $in: cartItemIds } });

            res.json({
                success: true,
                message: "Payment verified successfully.",
                orderId: orderId
            });
        } else {
            // Handle invalid signature
            res.status(400).json({
                success: false,
                message: "Payment verification failed. Invalid signature."
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while verifying payment."
        });
    }
};


const addNewAddress = async (req, res) => {
    try {
        const userId = req.session.userId
        if (!userId) {
            res.redirect('/login')
        } else {
            const userData = await User.findById(userId)
            res.render('addCheckoutAddress', { userData })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const insertCheckoutAddress = async (req, res) => {
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

const removeAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await Address.findByIdAndDelete(addressId);
        res.json({ success: true, message: 'Address removed successfully' });
    } catch (error) {
        console.log(error.message);
    }
}



const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userId;
        const userData = await User.findById(userId);

       if(!userData) res.redirect('/login')

        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        const isCouponUsed = userData.usedCoupons.includes(coupon._id.toString());

        if (isCouponUsed) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has already been used'
            });
        }

       

        
        const cartItems = await CartItem.find({ userId }).populate("product.productId");

        let orderAmount = 0;
        cartItems.forEach((item) => {
            item.product.forEach((product) => {
                orderAmount += product.totalPrice;
            });
        });

        if (orderAmount <= coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Order amount must be greater than ${coupon.minPurchaseAmount} to use this coupon`
            });
        }

        let discount;
        if (coupon.discountType === 'percentage') {
            discount = (coupon.discountValue / 100) * orderAmount;
        } else if (coupon.discountType === 'fixed') {
            discount = coupon.discountValue;
        }

        const newTotal = orderAmount - discount;


        userData.usedCoupons.push(coupon._id);
        await userData.save();

        return res.status(200).json({
            success: true,
            newTotal: newTotal,
            discount: discount
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};








module.exports = {
    renderCart,
    addToCart,
    removeCartItem,
    loadCheckout,
    updateCartItem,
    placeOrder,
    verifyRazorpayPayment,
    addNewAddress,
    insertCheckoutAddress,
    removeAddress,
    applyCoupon
};
