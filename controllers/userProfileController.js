const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Address = require("../models/userAddress");
const { findById } = require("../models/productModel");
const Order = require('../models/orderModel')
// const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const renderProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        const userData = await User.findById(userId);

        if (!userData) {
            console.log("User not found");
            return res.status(404).send("User not found");
        }

        res.render("profile", { userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const renderEditProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        const userData = await User.findById(userId);

        if (!userData) {
            console.log("User not found");
            return res.status(404).send("User not found");
        }

        res.render("editprofile", { userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, email, mobile } = req.body;

        const updatedProfile = await User.findByIdAndUpdate(userId, { name, email, mobile }, { new: true });

        if (updatedProfile) {
            res.redirect("/profile");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const renderaddress = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        const user = await User.findById(userId);

        if (!user) {
            console.log("User not found");
            return res.status(404).send("User not found");
        }

        const addresses = await Address.find({ userId });

        res.render("address", { userData: user, addresses });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const renderAddNewAddress = async (req, res) => {
    try {
        res.render("addnewaddress");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const insertNewAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { pincode, locality, address, city, state, addresstype } = req.body;

        if (!userId) {
            req.flash("error", "You must be logged in to perform this action");
            return res.redirect("/login");
        }

        if (!pincode || !locality || !address || !city || !state || !addresstype) {
            req.flash("error", "All fields are required");
            return res.redirect("/address");
        }

        const pincodeRegex = /^\d+$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash("error", "Pincode must contain only numbers");
            return res.redirect("/address");
        }


        const allFieldsAreSpaces = Object.values(req.body).every(value => value.trim() === "");
        if (allFieldsAreSpaces) {
            req.flash("error", "All fields cannot be empty or contain only spaces");
            return res.redirect("/add-address");
        }

        const newAddress = new Address({
            userId,
            pincode,
            locality,
            address,
            city,
            state,
            addresstype,
            state
        });

        const userAddress = await newAddress.save();

        req.session.useraddress = userAddress;
        req.flash("success", "Address added successfully");
        res.redirect("/address");
    } catch (error) {
        console.log(error.message);
        req.flash("error", "Internal server error");
        res.redirect("/address");
    }
};


const renderEditAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect("/login");
        }

        const addressId = req.query.id;
        const address = await Address.findById(addressId);

        if (!address || address.userId !== userId) {
            // Handle case where address is not found or does not belong to the user
            return res.status(404).send("Address not found");
        }

        res.render("editaddress", { userData: [address] }); // Pass the address as an array to match the forEach loop in the template
    } catch (error) {
        console.error("Error rendering edit address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
const updateAddress = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash("error", "You must be logged in to perform this action");
            return res.redirect("/login");
        }

        const addressId = req.body.addressId;
        const { pincode, locality, address, city, state, addresstype } = req.body;

        const pincodeRegex = /^\d+$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash("error", "Pincode must contain only numbers");
            return res.redirect("/edit-address");
        }
        const existingAddress = await Address.findOne({ _id: addressId, userId });

        if (!existingAddress) {
            req.flash("error", "Address not found or does not belong to the user");
            return res.status(404).send("Address not found or does not belong to the user");
        }

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { pincode, locality, address, city, state, addresstype },
            { new: true }
        );

        if (updatedAddress) {
            req.flash("success", "Address updated successfully");
            return res.redirect("/address");
        } else {
            req.flash("error", "Failed to update address");
            return res.status(500).send("Failed to update address");
        }
    } catch (error) {
        console.log(error.message);
        req.flash("error", "Internal server error");
        return res.redirect("/edit-address");
    }
};




const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const addressId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const address = await Address.findOne({ _id: addressId, userId });

        if (!address) {
            console.log("Address not found or does not belong to the user");
            return res.status(404).json({ error: "Address not found or does not belong to the user" });
        }

        await Address.findByIdAndDelete(addressId);

        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


const renderMyOrder = async (req, res) => {
    try {
        if (req.session.userId) {
            const userId = req.session.userId;
            const user = await User.findById(userId);
            const orderData = await Order.find({ userId }).populate("orderedItem.productId");        
          
            res.render('myorders', { orderData, userData: user });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

// const renderOrderDetails = async (req, res) => {
//     try {
//         const userId = req.session.userId;
      

        
//         const productId = req.query.productId;
//         const productsId = new mongoose.Types.ObjectId(productId);
      


//         const orderData = await Order.aggregate([
//           { $match:{userId:new mongoose.Types.ObjectId(userId)}},{$unwind:"$orderedItem"},{$match:{"orderedItem._id":productsId}}
//         ])
            
// console.log(orderData);
   
//         res.render('orderdetails', { orderData });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };


const renderOrderDetails = async (req, res) => {
    try {
        
        const userId = req.session.userId;
        const userData = await User.findById(userId)
        const productId = req.params.productId;

        const orderData = await Order.findOne({
            userId,
            "orderedItem.productId": productId
        })
            .populate("orderedItem.productId")
            .populate("deliveryAddress");

        if (!orderData) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        res.render('orderdetails', { orderData,userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
}

module.exports = {
    renderProfile,
    renderEditProfile,
    updateProfile,
    renderaddress,
    renderAddNewAddress,
    insertNewAddress,
    renderEditAddress,
    updateAddress,
    deleteAddress,



    renderOrderDetails,
    renderMyOrder
};
