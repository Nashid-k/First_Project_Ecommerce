const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const Otp = require("../models/otpModel");
const bcrypt = require("bcrypt");
const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const CartItem = require("../models/cartModel");
const WishlistItem = require("../models/wishlistModel");
const crypto = require('crypto');
const Wallet = require('../models/walletModel')
const ProductOffer = require('../models/productOffer')
const CategoryOffer=require('../models/categoryOffer')

function generateOTP() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

function generateReferralCode(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convert to hexadecimal format
        .slice(0, length); // Return the required number of characters
}

const sendPassResetMail = async (name, email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODE_USER,
                pass: process.env.NODE_PASS,
            },
        });
        const mailOptions = {
            from: process.env.NODE_USER,
            to: email,
            subject: "Reset Password OTP",
            html: `
            <p>Dear ${name},</p>
            <p>We received a request to reset the password for your Nashifa account.</p>
            <p>To proceed with resetting your password, please use the following One-Time Password (OTP):</p>
            <h2>OTP: ${otp}</h2>
            <p>This OTP is valid for 1 minute only. If you didn't request this OTP, please ignore this email.</p>
            <p>If you need any assistance, please don't hesitate to contact us at nashifa4u@gmail.com or call us at 8281142958.</p>
            <p>Best regards,<br>Nashifa Team</p>
            `,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(`Generated otp : ${otp}`);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 8);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

const sendVerifyMail = async (name, email, user_id, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODE_USER,
                pass: process.env.NODE_PASS,
            },
        });

        const mailOptions = {
            from: process.env.NODE_USER,
            to: email,
            subject: "Your Nashifa Account Verification OTP",
            html: `
            <p>Dear ${name},</p>
            <p>Welcome to Nashifa, your fashion destination!</p>
            <p>To complete your registration and ensure the security of your account, please use the following One-Time Password (OTP):</p>
            <h2>OTP: ${otp}</h2>
            <p>Please enter this code within 1 minute. If you didn't request this OTP, kindly disregard this email.</p>
            <p>Need help? Reach out to us at nashifa4u@gmail.com or call us at 8281142958.</p>
            <p>Best regards,<br>Nashifa Team</p>
            `,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(`Generated otp : ${otp}`);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
};

const renderHome = async (req, res) => {
    try {
        const categories = await Category.find({ is_listed: true });
        const unblockedCategoryIds = categories.map(category => category._id);

        const productData = await Products.find({ 
            is_listed: true, 
            category: { $in: unblockedCategoryIds }
        });

        const currentProductOffers = await ProductOffer.find();
        const currentCategoryOffers = await CategoryOffer.find();

        const newLabelCountdownDays = 3;

        const calculateDiscountedPrice = (productPrice, discountPercent) => {
            let discountedPrice = productPrice - (productPrice * discountPercent / 100);
            return Math.round(discountedPrice);
        };

        const getOfferTime = (startDate, endDate) => {
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (now < start) {
                return { status: 'not_started', timeLeft: null, endDate };
            } else if (now > end) {
                return { status: 'ended', timeLeft: null, endDate };
            } else {
                const timeDifference = end - now;
                const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
                return { 
                    status: 'active', 
                    timeLeft: { days, hours, minutes, seconds },
                    endDate
                };
            }
        };

        const modifiedProductData = await Promise.all(productData.map(async (product) => {
            const isOutOfStock = product.quantity === 0;
            const createdAt = new Date(product.createdAt);
            const today = new Date();
            const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
            const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

            const productOffer = currentProductOffers.find(offer => offer.productId.toString() === product._id.toString());

            let discountedPrice = product.price;
            let discountPercent = 0;
            let offerTime = null;

            if (productOffer) {
                offerTime = getOfferTime(productOffer.startDate, productOffer.endDate);
                if (offerTime.status === 'active') {
                    discountPercent = productOffer.discountValue;
                    discountedPrice = calculateDiscountedPrice(product.price, discountPercent);
                }
            }

            const category = categories.find(cat => cat._id.toString() === product.category.toString());
            if (category) {
                const categoryOffer = currentCategoryOffers.find(offer => offer.categoryId.toString() === category._id.toString());
                if (categoryOffer) {
                    const categoryOfferTime = getOfferTime(categoryOffer.startDate, categoryOffer.endDate);
                    if (categoryOfferTime.status === 'active' && categoryOffer.discountValue > discountPercent) {
                        discountPercent = categoryOffer.discountValue;
                        discountedPrice = calculateDiscountedPrice(product.price, discountPercent);
                        offerTime = categoryOfferTime;
                    }
                }
            }

            product.discount = discountPercent;
            await product.save();

            return {
                ...product.toObject(),
                outOfStock: isOutOfStock,
                isNew,
                discountedPrice,
                offerTime,
                mainImage: `/uploads/products/${product.mainImage}`
            };
        }));

        const modifiedCategoryOffers = currentCategoryOffers.map(offer => {
            const offerCategory = categories.find(category => offer.categoryId.toString() === category._id.toString());
            if (offerCategory) {
                const randomProduct = productData.find(product => product.category.toString() === offerCategory._id.toString());
                const offerTime = getOfferTime(offer.startDate, offer.endDate);
                return {
                    ...offer.toObject(),
                    offerTime,
                    randomProductImage: randomProduct ? `/uploads/products/${randomProduct.mainImage}` : null
                };
            }
            return null;
        }).filter(offer => offer !== null && offer.offerTime.status === 'active');

        const renderData = {
            productData: modifiedProductData,
            categories,
            currentProductOffers,
            modifiedCategoryOffers
        };

        if (req.session.userId) {
            const userData = await User.findById(req.session.userId);

            if (userData && userData.block) {
                req.session.destroy((err) => {
                    if (err) {
                        console.log("Error destroying session:", err);
                        return res.status(500).send({ message: "Internal server error" });
                    }
                    res.redirect("/login");
                });
            } else {
                renderData.userData = userData;
                res.render("home", renderData);
            }
        } else {
            res.render("home", renderData);
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Internal server error" });
    }
};

const renderLogin = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message);
    }
};

const renderSignUp = async (req, res) => {
    try {
        res.render("signUp");
    } catch (error) {
        console.log(error.message);
    }
};

const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password, cpassword, referred_code } = req.body;

       
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error", "Email address already exists");
            return res.redirect("/signUp");
        }

       
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            req.flash("error", "Please enter a valid 10-digit mobile number starting with 6-9");
            return res.redirect("/signUp");
        }

        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            req.flash(
                "error",
                "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character."
            );
            return res.redirect("/signUp");
        }

        
        if (password !== cpassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/signUp");
        }

        const hashedPassword = await securePassword(password);
        const newReferralCode = generateReferralCode();

        let referredUser = null;
        if (referred_code) {
            referredUser = await User.findOne({ referral_code: referred_code });
            if (!referredUser) {
                req.flash("error", "Invalid referral code");
                return res.redirect("/signUp");
            }
            if (referredUser.referral_bonus_given) {
                req.flash("error", "Referral code has already been used");
                return res.redirect("/signUp");
            }
            if (referred_code === newReferralCode) {
                req.flash("error", "You cannot use your own referral code");
                return res.redirect("/signUp");
            }
        }

      
        const tempUserData = {
            name,
            email,
            mobile,
            password: hashedPassword,
            is_verified: false,
            is_admin: 0,
            referral_code: newReferralCode,
            referred_code: referred_code || null,
            referral_bonus_given: false,
        };

        
        const otp = generateOTP();

    
        await sendVerifyMail(name, email, null, otp);

        req.session.tempUser = {
            userData: tempUserData,
            email: email,
            otp: otp,
            referredUserId: referredUser ? referredUser._id : null
        };


        req.session.otpExpiration = Date.now() + 5 * 60 * 1000;

        res.redirect("/otp");

    } catch (error) {
        console.error("Error in insertUser:", error.message);
        req.flash("error", "An unexpected error occurred. Please try again.");
        res.redirect("/signUp");
    }
};


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        const tempUser = req.session.tempUser;
        if (!tempUser || !tempUser.userData || !tempUser.otp) {
            req.flash("error", "Session expired. Please sign up again.");
            return res.redirect("/signUp");
        }

        const storedOtp = tempUser.otp;
        const otpExpiration = req.session.otpExpiration;

    
        if (Date.now() > otpExpiration) {
            delete req.session.tempUser;
            delete req.session.otpExpiration;
            req.flash("error", "OTP has expired. Please sign up again.");
            return res.redirect("/signUp");
        }

        if (otp !== storedOtp) {
            console.log(`Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`);
            req.flash("error", "Invalid OTP");
            return res.redirect("/otp");
        }

   
        const user = new User({
            ...tempUser.userData,
            is_verified: true
        });
        const userData = await user.save();

    
        const wallet = new Wallet({ 
            userId: userData._id, 
            balance: 0, 
            transactions: [] 
        });
        await wallet.save();

        
        if (tempUser.referredUserId) {
            const referredUser = await User.findById(tempUser.referredUserId);
            if (referredUser) {
            
                let referredUserWallet = await Wallet.findOne({ userId: referredUser._id });
                if (!referredUserWallet) {
                    referredUserWallet = new Wallet({ userId: referredUser._id, balance: 0, transactions: [] });
                }
                referredUserWallet.balance += 100;
                referredUserWallet.transactions.push({
                    amount: 100,
                    transactionMethod: "Referral",
                    date: new Date(),
                    description: "Referral Bonus for referring " + userData.name
                });
                await referredUserWallet.save();

               
                wallet.balance += 100;
                wallet.transactions.push({
                    amount: 100,
                    transactionMethod: "Referral",
                    date: new Date(),
                    description: "Referral Bonus for joining via " + referredUser.name
                });
                await wallet.save();

             
                referredUser.referral_bonus_given = true;
                await referredUser.save();
            }
        }

        delete req.session.tempUser;
        delete req.session.otpExpiration;

        req.flash("success", "Email verified successfully! Login to enjoy shopping");
        res.redirect("/login");
    } catch (error) {
        console.log(error.message);
        req.flash("error", "An unexpected error occurred. Please try again.");
        res.redirect("/signUp");
    }
};

const renderOtp = async (req, res) => {
    try {
        res.render("otp");
    } catch (error) {
        console.log(error.message);
    }
};

const resendOtp = async (req, res) => {
    try {
        const tempUser = req.session.tempUser;

        if (!tempUser || !tempUser.userData || !tempUser.email) {
            req.flash("error", "Session expired. Please sign up again.");
            return res.redirect("/signUp");
        }

        const newOtp = generateOTP();

        await sendVerifyMail(tempUser.userData.name, tempUser.email, null, newOtp);

      
        req.session.tempUser.otp = newOtp;

        req.session.otpExpiration = Date.now() + 5 * 60 * 1000;


        const otpDoc = new Otp({
            email: tempUser.email,
            otp: newOtp,
        });
        await otpDoc.save();

        req.flash("success", "New OTP has been sent to your email");
        res.redirect("/otp");
    } catch (error) {
        console.log("Error in resendOtp:", error.message);
        req.flash("error", "Failed to resend OTP. Please try again.");
        res.redirect("/otp");
    }
};

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });
        if (!userData) {
            req.flash("error", "Email or password is incorrect");
            return res.redirect("/login");
        }
        if (userData.block) {
            req.flash("error", "You are not authenticated to log in");
            return res.redirect("/login");
        }
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (!userData.is_verified) {
                    const otp = generateOTP();

                    await sendVerifyMail(userData.name, email, userData._id, otp);

                    storedOTP = otp;

                    req.session.tempUser = {
                        userId: userData._id,
                        email: userData.email,
                        name: userData.name,
                        otp: otp,
                    };

                    const otpDoc = {
                        userId: userData._id,
                        email: userData.email,
                        name: userData.name,
                        otp: otp,
                    };

                    req.flash("error", "Email is not verified. We have sent a new OTP to your email.");
                    res.redirect("/otp");
                } else {
                    req.session.userId = userData._id;

                    res.redirect("/");
                }
            } else {
                req.flash("error", "Email or password is incorrect");
                res.redirect("/login");
            }
        } else {
            req.flash("error", "Email or password is incorrect");
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const renderShop = async (req, res) => {
    try {
        console.log('hi');
        const userId = req.session.userId;
        const userData = userId ? await User.findById(userId) : null;

        const categories = await Category.find({ is_listed: true });
        console.log('Categories:', categories);

        const unblockedCategoryIds = categories.map(category => category._id);
        console.log('Unblocked Category IDs:', unblockedCategoryIds);

        const productData = await Products.find({ 
            is_listed: true,
            category: { $in: unblockedCategoryIds }
        });
    

        const currentProductOffers = await ProductOffer.find();
        const currentCategoryOffers = await CategoryOffer.find();

        const newLabelCountdownDays = 3;

        const calculateDiscountedPrice = (productPrice, discountPercent) => {
            let discountedPrice = productPrice - (productPrice * discountPercent / 100);
            return Math.round(discountedPrice);
        };

        const modifiedProductData = await Promise.all(productData.map(async (product) => {
            console.log('hello');
            const isOutOfStock = product.quantity === 0;
            const createdAt = new Date(product.createdAt);
            const today = new Date();
            const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
            const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

            const productOffer = currentProductOffers.find(offer => offer.productId.toString() === product._id.toString());

            let discountedPrice = product.price;
            let discountPercent = 0;

            if (productOffer) {
                discountPercent = productOffer.discountValue;
                discountedPrice = calculateDiscountedPrice(product.price, discountPercent);
            }

            const category = categories.find(cat => cat._id.toString() === product.category.toString());
            if (category) {
                const categoryOffer = currentCategoryOffers.find(offer => offer.categoryId.toString() === category._id.toString());
                if (categoryOffer) {
                    discountPercent = Math.max(discountPercent, categoryOffer.discountValue);
                    discountedPrice = calculateDiscountedPrice(product.price, discountPercent);
                }
            }

            product.discount = discountPercent;
            await product.save();

            // Calculate average star rating and number of reviews
            const totalReviews = product.reviews.length;
            const averageRating = totalReviews > 0 ? (product.reviews.reduce((acc, review) => acc + review.starRating, 0) / totalReviews).toFixed(1) : 0;

            console.log(totalReviews, 'total reviews');
            console.log(averageRating, 'average rating');
            return {
                ...product.toObject(),
                outOfStock: isOutOfStock,
                isNew,
                discountedPrice,
                averageRating: parseFloat(averageRating),
                totalReviews
            };
        }));

      

        const renderData = {
            productData: modifiedProductData,
            categories
        };

        if (userData) {
            renderData.userData = userData;
        }

        res.render("shop", renderData);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};






const renderProductDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userData = userId ? await User.findById(userId) : null;
        const productId = req.params.productId;
        const product = await Products.findById(productId);

        if (!product) {
            console.log("Product not found");
            return res.render("productDetails", { product: null });
        }


        const productOffer = await ProductOffer.findOne({ productId: product._id });

        const categoryOffer = await CategoryOffer.findOne({ categoryId: product.category });

        let discountedPrice = null;
        if (productOffer) {
            discountedPrice = product.price - (product.price * productOffer.discountValue / 100);
            discountedPrice = Math.round(discountedPrice); 
        }

        if (categoryOffer) {
            let categoryDiscountedPrice = product.price - (product.price * categoryOffer.discountValue / 100);
            categoryDiscountedPrice = Math.round(categoryDiscountedPrice); 
            
            if (!discountedPrice || categoryDiscountedPrice < discountedPrice) {
                discountedPrice = categoryDiscountedPrice;
            }
        }

        let renderData = {
            product,
            discountedPrice,
        };

        if (userData) {
            renderData.userData = userData;
        }

        return res.render("productDetails", renderData);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
};

const renderWomen = async (req, res) => {
    try {
      
        const womenCategory = await Category.findOne({ name: "women" });
 

        if (!womenCategory) {
            return res.status(404).send("Women category not found");
        }

        
        const productData = await Products.find({ 
            category: womenCategory._id, 
            is_listed: true, 
            is_blocked: false 
        }).populate('category');

       
        const categories = [womenCategory];

        res.render("women", { productData, categories });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};





const renderMens= async (req, res) => {
    try {
      
        const womenCategory = await Category.findOne({ name: "men" });
 

        if (!womenCategory) {
            return res.status(404).send("Women category not found");
        }

        
        const productData = await Products.find({ 
            category: womenCategory._id, 
            is_listed: true, 
            is_blocked: false 
        }).populate('category');

       
        const categories = [womenCategory];

        res.render("women", { productData, categories });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const sortProducts = async (req, res) => {
    try {
        const { category, criteria } = req.params;
        const { query, page = 1 } = req.query;
        const limit = 9;
        let filter = { is_listed: true };

        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }

        if (category !== "all") {
            const categoryData = await Category.findById(category);
            if (!categoryData || !categoryData.is_listed) {
                return res.status(404).json({ error: "Category not found or not listed" });
            }
            filter.category = category;
        } else {
            const listedCategories = await Category.find({ is_listed: true }).select('_id');
            filter.category = { $in: listedCategories.map(cat => cat._id) };
        }

        let sortOption = {};

        switch (criteria) {
            case "nameAZ":
                sortOption = { name: 1 };
                break;
            case "nameZA":
                sortOption = { name: -1 };
                break;
            case "newArrivals":
                sortOption = { createdAt: -1 };
                break;
            case "priceLowToHigh":
                sortOption = { price: 1 };
                break;
            case "priceHighToLow":
                sortOption = { price: -1 };
                break;
            case "sizeS":
                filter.size = "small";
                break;
            case "sizeM":
                filter.size = "medium";
                break;
            case "sizeL":
                filter.size = "large";
                break;
        }

        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        const productData = await Products.find(filter)
            .collation({ locale: "en" })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        const newLabelCountdownDays = 3;
        const currentOffers = await ProductOffer.find();
        const currentCategoryOffers = await CategoryOffer.find();

        const modifiedProductData = await Promise.all(productData.map(async (product) => {
            const isOutOfStock = product.quantity === 0;
            const createdAt = new Date(product.createdAt);
            const today = new Date();
            const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
            const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

            let discountedPrice = product.price;
            let appliedDiscount = 0;

            const productOffer = currentOffers.find(offer => offer.productId.toString() === product._id.toString());
            if (productOffer) {
                appliedDiscount = Math.max(appliedDiscount, productOffer.discountValue);
            }

            const categoryOffer = currentCategoryOffers.find(offer => offer.categoryId.toString() === product.category.toString());
            if (categoryOffer) {
                appliedDiscount = Math.max(appliedDiscount, categoryOffer.discountValue);
            }

            if (appliedDiscount > 0) {
                discountedPrice = Math.ceil(product.price - (product.price * appliedDiscount / 100));
            }

            // Calculate average star rating and number of reviews
            const totalReviews = product.reviews.length;
            const averageRating = totalReviews > 0 ? (product.reviews.reduce((acc, review) => acc + review.starRating, 0) / totalReviews).toFixed(1) : 0;

            return {
                ...product.toObject(),
                outOfStock: isOutOfStock,
                isNew,
                discountedPrice,
                discountPercentage: appliedDiscount,
                averageRating: parseFloat(averageRating),
                totalReviews
            };
        }));

        res.json({
            productData: modifiedProductData,
            totalPages: totalPages,
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const renderForgotPassword = async (req, res) => {
    try {
        res.render("forgotPassword");
    } catch (error) {
        console.log(error.message);
    }
};

const findAccount = async (req, res) => {
    try {
        const { email } = req.body;
        req.session.resetMail = email;
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            res.render("verifyAccount", { users: existingUser });
        } else {
            req.flash("error", "User not found ");
            res.redirect("/forgotPassword");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const sendOtp = async (req, res) => {
    try {
        const email = req.session.resetMail;
        console.log("Email from session:", email);

        const userData = await User.findOne({ email: email });
        if (!userData) {
            console.log("User not found for the provided email");

            return;
        }

        const name = userData.name;

        const otp = generateOTP();

        await sendPassResetMail(name, email, otp);

        const resetOtp = new Otp({
            user_id: userData._id,
            otp,
        });
        req.session.tempReset = {
            userId: userData._id,
            email: userData.email,
            otp: otp,
        };
        await resetOtp.save();
        res.redirect("/resetotp");
    } catch (error) {
        console.log(error.message);
    }
};

const loadResetotp = async (req, res) => {
    try {
        res.render("resetotp");
    } catch (error) {
        console.log(error.message);
    }
};

const verifyResetOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const tempUser = req.session.tempReset;
        const storedOtp = tempUser.otp;
        if (otp !== storedOtp) {
            console.log(`Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`);
            req.flash("error", "Invalid OTP");
            return res.redirect("/resetotp");
        }
        const userId = tempUser.userId;

        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/resetotp");
        } else {
            res.redirect("/changePassword");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const tempUser = req.session.tempReset;
        const userId = tempUser.userId;
        console.log(userId);

        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "An error occured while changing password");
            res.redirect("/forgotPassword");
        }

        if (newPassword !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            res.redirect("/changePassword");
        } else {
            const hashedPassword = await securePassword(confirmPassword);
            const updatedPassword = await User.findByIdAndUpdate(
                userId,
                { $set: { password: hashedPassword } },
                { new: true }
            );
            req.flash("success", "password changed Successfully,Login to continue");
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const renderChangePassword = async (req, res) => {
    try {
        res.render("changePassword");
    } catch (error) {
        console.log(error.message);
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.query;
        const product = await Products.findById(productId);
        let wishlistItem = await WishlistItem.findOne({ userId: userId, "product.productId": productId });
        if (!wishlistItem) {
            wishlistItem = new WishlistItem({
                userId: userId,
                product: {
                    productId: productId,
                },
            });
        } else {
          
            res.redirect("/wishlist");
        }
        await wishlistItem.save();
        res.redirect("/wishlist");
    } catch (error) {
        console.log(error.message);
    }
};

const renderWishlist = async (req, res) => {
    try {
        if (req.session.userId) {
            const userData = await User.findById(req.session.userId);
            const wishlistItem = await WishlistItem.find({ userId: req.session.userId }).populate("product.productId");
            console.log(wishlistItem);

            res.render("wishlist", { wishlistItems: wishlistItem, userData: userData });
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const RemoveFromWishlist = async (req, res) => {
    try {
        const { productId } = req.query;
        if (req.session.userId) {
            await WishlistItem.findOneAndDelete({ userId: req.session.userId, "product.productId": productId });
            res.status(200).json({ message: "Item removed from wishlist" });
        } else {
            res.status(401).json({ message: "Unauthorized" });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    renderHome,
    renderLogin,
    renderSignUp,
    insertUser,
    verifyOtp,
    renderOtp,
    resendOtp,
    verifyLogin,
    renderShop,
    sortProducts,
    renderProductDetails,
    logout,
    renderWomen,
    renderForgotPassword,
    findAccount,
    sendOtp,
    verifyResetOtp,
    loadResetotp,
    renderChangePassword,
    changePassword,
    renderWishlist,
    addToWishlist,
    RemoveFromWishlist,
    renderMens,
};
