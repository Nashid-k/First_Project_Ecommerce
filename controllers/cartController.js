const Products = require("../models/productModel");

const CartItem = require("../models/cartModel");
const User = require("../models/userModel");
const Address = require("../models/userAddress");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
const ProductOffer = require('../models/productOffer')
const CategoryOffer = require('../models/categoryOffer')
const crypto = require("crypto");
const Coupon = require("../models/couponModel");

const { razorpay_id, razorpay_secret } = process.env;

const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: razorpay_id,
  key_secret: razorpay_secret,
});

const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.query;


    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const price = product.price;
    const discount = product.discount || 0;

 
    const discountedPrice = Math.round(price - price * (discount / 100));


    let cartItem = await CartItem.findOne({
      userId: userId,
      "product.productId": productId,
    });

    if (!cartItem) {

      cartItem = new CartItem({
        userId: userId,
        product: [
          {
            productId: productId,
            quantity: 1,
            offerDiscount: discount,
            totalPrice: discountedPrice,
            price: discountedPrice,
          },
        ],
      });
    } else {
      const existingProductIndex = cartItem.product.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (existingProductIndex !== -1) {
        return res.redirect("/cart");
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
    const cartItems = await CartItem.find({ userId: userId }).populate(
      "product.productId"
    );


    const updatedCartItems = cartItems.map((item) => {
      item.product = item.product.map((prod) => {
        const unitPrice = prod.price / prod.quantity; 
        prod.totalPrice = Math.round(unitPrice * prod.quantity); 
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


    const cartItems = await CartItem.find({ userId }).populate(
      "product.productId"
    );

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(404)
        .json({ message: "No cart items found for the user" });
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
      return res
        .status(400)
        .json({ message: "Quantity cannot be less than 1" });
    }


    const currentProduct = await Products.findById(product.productId);
    if (newQuantity > currentProduct.quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }


    const unitPrice = product.totalPrice / product.quantity; 
    const newTotalPrice = Math.round(unitPrice * newQuantity);

 
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


    const updatedCartItems = await CartItem.find({ userId }).populate(
      "product.productId"
    );

    res.status(200).json({
      message: "Cart items updated successfully",
      cartItems: updatedCartItems,
    });
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.body;
    const cartItem = await CartItem.findOne({
      userId,
      "product.productId": productId,
    }).populate("product.productId");
    const product = cartItem.product[0];
    await CartItem.deleteOne({
      userId: userId,
      "product.productId": productId,
    });
    await Products.updateOne(
      { _id: product.productId },
      { $inc: { quantity: product.quantity } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const cartItems = await CartItem.find({ userId }).populate("product.productId");
    const userData = await User.findById(userId);
    const addressData = await Address.find({ userId });

    let subtotal = 0;
    let totalProductCount = 0;

    cartItems.forEach((cartItem) => {
      cartItem.product.forEach((product) => {
        subtotal += product.totalPrice * product.quantity;
        totalProductCount += product.quantity;
      });
    });

    let deliveryCharge = 0;
    if (totalProductCount === 1) {
      if (subtotal < 10000) {
        deliveryCharge = 25;
      } else if (subtotal < 40000) {
        deliveryCharge = 50;
      } else if (subtotal < 60000) {
        deliveryCharge = 100;
      }
    }

    const total = subtotal + deliveryCharge;

    console.log("Subtotal:", subtotal);
    console.log("Total Product Count:", totalProductCount);
    console.log("Delivery Charge:", deliveryCharge);
    console.log("Total:", total);

    res.render("checkout", {
      cartItems,
      subtotal,
      total,
      userData,
      addressData,
      razorpay_id: process.env.RAZORPAY_ID,
      deliveryCharge,
      totalProductCount,
    });
  } catch (error) {
    res.status(500).render("error", {
      message: "An error occurred while processing your checkout.",
    });
  }
};


const placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to place an order.",
      });
    }

    const { selectedAddress, paymentMethod, couponCode } = req.body;

    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery address.",
      });
    } else if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please select a payment method.",
      });
    }

    const cartItems = await CartItem.find({ userId }).populate("product.productId");
    const cartId = cartItems.map((item) => item._id);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    let subtotal = 0;
    let totalProductCount = 0;
    const orderedItems = [];

    for (const cartItem of cartItems) {
      for (const productItem of cartItem.product) {
        const product = await Products.findById(productItem.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product not found with ID: ${productItem.productId}`,
          });
        }

        if (product.quantity < productItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product: ${product.name}`,
          });
        }

        // Fetch applicable offers
        const productOffer = await ProductOffer.findOne({
          productId: productItem.productId,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        });

        const categoryOffer = await CategoryOffer.findOne({
          categoryId: product.categoryId,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        });

        // Calculate discounted price
        let priceAtPurchase = product.price;
        if (productOffer) {
          priceAtPurchase -= (priceAtPurchase * productOffer.discountValue) / 100;
        } else if (categoryOffer) {
          priceAtPurchase -= (priceAtPurchase * categoryOffer.discountValue) / 100;
        }

        const itemSubtotal = priceAtPurchase * productItem.quantity;

        subtotal += itemSubtotal;
        totalProductCount += productItem.quantity;

        orderedItems.push({
          productId: productItem.productId,
          quantity: productItem.quantity,
          priceAtPurchase,
          totalProductAmount: itemSubtotal,
        });

        product.quantity -= productItem.quantity;
        await product.save();
      }
    }

    let deliveryCharge = 0;
    if (totalProductCount === 1) {
      if (subtotal < 10000) {
        deliveryCharge = 25;
      } else if (subtotal < 40000) {
        deliveryCharge = 50;
      } else if (subtotal < 60000) {
        deliveryCharge = 100;
      }
    }

    let orderAmount = subtotal + deliveryCharge;

    // Apply coupon discount if coupon code is provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        minPurchaseAmount: { $lte: orderAmount },
        validity: { $gte: new Date() },
      });
      console.log(coupon + ' is the coupon');

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          const couponDiscount = (orderAmount * coupon.discountValue) / 100;
          orderAmount -= couponDiscount; // Deduct the coupon discount from orderAmount
          console.log(orderAmount + 'dfjhdskjlfh');
        } else if (coupon.discountType === 'fixed') {
          orderAmount -= coupon.discountValue; // Deduct the fixed coupon discount from orderAmount
                    console.log(orderAmount + 'dfjhdskjlfh');
        }
      }
    }

    if (paymentMethod === "wallet") {
      const userWallet = await Wallet.findOne({ userId });

      if (!userWallet) {
        return res.status(400).json({
          success: false,
          message: "Wallet not found for user.",
        });
      }

      if (userWallet.balance < orderAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance in wallet.",
        });
      }

      userWallet.balance -= orderAmount;
      userWallet.transactions.push({
        amount: -orderAmount,
        transactionMethod: "Payment",
        date: Date.now(),
      });

      await userWallet.save();
    }

    const orderData = new Order({
      cartId,
      userId,
      orderedItem: orderedItems,
      orderAmount,
      deliveryCharge,
      deliveryAddress: selectedAddress,
      paymentMethod,
      paymentStatus: paymentMethod !== "razorpay",
      orderDate: Date.now(),
      priceAtPurchase: orderedItems.map((item) => item.priceAtPurchase),
    });

    await orderData.save();

    // Add eligible coupons to user's available coupons
    const eligibleCoupons = await Coupon.find({
      minPurchaseAmount: { $lte: orderAmount },
    });

    if (eligibleCoupons.length > 0) {
      const user = await User.findById(userId);

      for (const coupon of eligibleCoupons) {
        const isCouponAvailable = user.availableCoupons.some(
          (c) => c.couponId.toString() === coupon._id.toString()
        );
        if (!isCouponAvailable) {
          user.availableCoupons.push({
            couponId: coupon._id,
            couponCode: coupon.code,
          });
        }
      }

      await user.save();
    }

    // Remove cart items after placing order
    const removeCartItems = async () => {
      await CartItem.deleteMany({ _id: { $in: cartId } });
    };

    // If payment method is Razorpay, create Razorpay order
    if (paymentMethod === "razorpay") {
      const options = {
        amount: orderAmount * 100, // Amount in paisa
        currency: "INR",
        receipt: `order_${orderData._id}`, // Unique order ID
      };

      razorpayInstance.orders.create(options, async (err, order) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Failed to create Razorpay order.",
          });
        }

        await removeCartItems(); // Remove cart items after successful order placement

        res.json({
          success: true,
          orderId: orderData._id,
          razorpayOrderId: order.id,
          amount: orderAmount * 100, // Send the original order amount to Razorpay
          currency: order.currency,
          key_id: razorpay_id,
        });
      });
    } else {
      // If payment method is wallet or other method, just remove cart items
      await removeCartItems();

      res.json({
        success: true,
        message: "Order placed successfully",
      });
    }
  } catch (error) {
    console.error("Error in placeOrder:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while placing the order.",
    });
  }
};



const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", razorpay_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: true },
        { new: true }
      );
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const cartItems = await CartItem.find({ userId: updatedOrder.userId });
      const cartItemIds = cartItems.map((item) => item._id);
      await CartItem.deleteMany({ _id: { $in: cartItemIds } });

      res.json({
        success: true,
        message: "Payment verified successfully.",
        orderId: orderId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }
  } catch (error) {
    console.error("Error in verifyRazorpayPayment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying payment.",
    });
  }
};

const addNewAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.redirect("/login");
    } else {
      const userData = await User.findById(userId);
      res.render("addCheckoutAddress", { userData });
    }
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};
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

    const allFieldsAreSpaces = Object.values(req.body).every(
      (value) => value.trim() === ""
    );
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
    req.flash("error", "Internal server error");
    res.redirect("/addNewAddress");
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    await Address.findByIdAndDelete(addressId);
    res.json({ success: true, message: "Address removed successfully" });
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userId;
    const userData = await User.findById(userId);

    if (!userData) res.redirect("/login");

    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const isCouponUsed = userData.usedCoupons.includes(coupon._id.toString());

    if (isCouponUsed) {
      return res.status(400).json({
        success: false,
        message: "Coupon has already been used",
      });
    }

    const cartItems = await CartItem.find({ userId }).populate(
      "product.productId"
    );

    let orderAmount = 0;
    cartItems.forEach((item) => {
      item.product.forEach((product) => {
        orderAmount += product.totalPrice;
      });
    });

    if (orderAmount <= coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Order amount must be greater than ${coupon.minPurchaseAmount} to use this coupon`,
      });
    }

    let discount;
    if (coupon.discountType === "percentage") {
      discount = (coupon.discountValue / 100) * orderAmount;
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    const newTotal = orderAmount - discount;

    userData.usedCoupons.push(coupon._id);
    await userData.save();

    return res.status(200).json({
      success: true,
      newTotal: newTotal,
      discount: discount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const renderOrderPlaced = async (req, res) => {
  try {
    res.render("orderplaced");
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
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
  applyCoupon,
  renderOrderPlaced,
};
