const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const Otp = require("../models/otpModel");
const bcrypt = require("bcrypt");
const Products = require('../models/productModel')
const Category = require("../models/categoryModel");
const CartItem = require('../models/cartModel')

function generateOTP() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

const sendPassResetMail = async(name,email,otp)=>{
    try{
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "nashifa4u@gmail.com",
                pass: "kdvj hzej eijm oiry",
            },
        });
        const mailOptions = {
            from: "nashifa4u@gmail.com",
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
    }catch(error){
        console.log(error.message);
    }
}

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
                user: "nashifa4u@gmail.com",
                pass: "kdvj hzej eijm oiry",
            },
        });

        const mailOptions = {
            from: "nashifa4u@gmail.com",
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
        const productData = await Products.find({is_listed:true});
       
        if (req.session.userId) {
            let userData = await User.findById(req.session.userId);
            if(userData.block){
                req.session.userId=false
                res.redirect('/login')
            }else{
     
                res.render("home", { userData,productData });
            }
        } else {
            res.render("home",{ productData, });
        }
    } catch (error) {
        console.log(error.message);
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
        const { name, email, mobile, password, cpassword } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            req.flash("error", "Email address already exists");
            return res.redirect("/signUp");
        }

    
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            req.flash("error", "Please enter a valid mobile number");
            return res.redirect("/signUp");
        }

        if (mobile[0] <= "5") {
            req.flash("error", "Please enter a valid mobile number");
            return res.redirect("/signUp");
        }

   
        if (/0{5}/.test(mobile)) {
            req.flash("error", "Please enter a valid mobile number");
            return res.redirect("/signUp");
        }

    
        if (/(\d)\1{9}/.test(mobile)) {
            req.flash("error", "Please enter a valid mobile number");
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

        const hashedPassword = await securePassword(password);

        const user = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            is_verified: false,
            is_admin: 0,
        });

        const userData = await user.save();

        const otp = generateOTP();

        await sendVerifyMail(name, email, userData._id, otp);

       

        const otpDoc = new Otp({
            user_id: userData._id,
            otp,
        });

        req.session.tempUser = {
            userId: userData._id,
            email: userData.email,
            otp: otp,
        };

        await otpDoc.save();

        res.redirect("/otp");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

       
        const tempUser = req.session.tempUser;
        const storedOtp = tempUser.otp;
      
        if (otp !== storedOtp) {
            console.log(`Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`);
            req.flash("error", "Invalid OTP");
            return res.redirect("/otp");
        }

 
        const userId = tempUser.userId;

    
        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/otp");
        }

      
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { is_verified: true } }, { new: true });

      
        delete req.session.tempUser.otp;

        req.flash("success", "Email verified successfully! Login to enjoy shopping");
        res.redirect("/login");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
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

        if (!tempUser || !tempUser.userId || !tempUser.email) {
            req.flash("error", "User session data missing");
            return res.redirect("/otp");
        }

        const userId = tempUser.userId;

     
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/otp");
        }

      
        const newOtp = generateOTP();

      
        await sendVerifyMail(user.name, tempUser.email, user._id, newOtp);

    
        req.session.tempUser.otp = newOtp;

     
        const otpDoc = new Otp({
            user_id: user._id,
            otp: newOtp,
        });
        await otpDoc.save();

        req.flash("success", "New OTP has been sent to your email");
        res.redirect("/otp");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userData = await User.findOne({ email:email });
        if(!userData){
            req.flash("error", "Email or password is incorrect");
            return res.redirect("/login");
        }
if(userData.block){
    req.flash('error','You are not authenticated to log in')
 return   res.redirect('/login')
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
      const userId = req.session.userId;
      const userData = await User.findById(userId);
  
     
      const productData = await Products.find({ is_listed: true })
     
  
      const categories = await Category.find();
  
      
      const newLabelCountownDays = 3;
      const modifiedProductData = productData.map((product) => {
      const isOutOfStock = product.quantity === 0;
      const createdAt = new Date(product.createdAt);
      const today = new Date();
      const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      const isNew = daysDifference <= newLabelCountownDays && !isOutOfStock;

      return {
        ...product.toObject(),
        outOfStock: isOutOfStock,
        isNew,
      };
    });
  
      
      if (req.session.userId) {
        res.render('shop', { productData: modifiedProductData, categories, userData });
      } else {
        res.render('shop', { productData: modifiedProductData, categories });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  
const renderProductDetails = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId);
        if (!product) {
            console.log('Product not found');
            return res.render('productDetails', { product: null });
        }
   
        res.render('productDetails', { product });
    } catch (error) {
        console.log(error.message);
        // Handle the error case
        res.status(500).send('Internal Server Error');
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
      const productData = await Products.find();
      const categories = await Category.find({name:'Women'});
      console.log(categories);
      res.render('women', { productData, categories });
    } catch (error) {
      console.log(error.message);
    }
  };

  const sortProducts = async (req, res) => {
    try {
      const { criteria } = req.params;
      let productData;
      switch (criteria) {
        case 'nameAZ':
          productData = await Products.find().collation({ locale: "en" }).sort({ name: 1 });
          break;
        case 'nameZA':
          productData = await Products.find().collation({ locale: "en" }).sort({ name: -1 });
          break;
        case 'newArrivals':
          productData = await Products.find().sort({ createdAt: -1 });
          break;
        case 'priceLowToHigh':
          productData = await Products.find().sort({ price: 1 });
          break;
        case 'priceHighToLow':
          productData = await Products.find().sort({ price: -1 });
          break;
        default:
          res.status(400).json({ error: 'Invalid sorting criteria' });
          return;
      }
  
      
        const newLabelCountownDays = 3;
        const modifiedProductData = productData.map((product) => {
        const isOutOfStock = product.quantity === 0;
        const createdAt = new Date(product.createdAt);
        const today = new Date();
        const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
        const isNew = daysDifference <= newLabelCountownDays && !isOutOfStock;
  
        return {
          ...product.toObject(),
          outOfStock: isOutOfStock,
          isNew,
        };
      });
  
 
      res.json({ productData: modifiedProductData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const renderForgotPassword =async(req,res)=>{
    try{
res.render('forgotPassword')
    }catch(error){
        console.log(error.message);
    }
}

const findAccount = async(req,res)=>{
    try{
        const {email} = req.body
        req.session.resetMail = email
     const existingUser = await User.findOne({email:email})
     if(existingUser){
        res.render('verifyAccount',{users:existingUser})
     }else{
        req.flash('error','User not found ')
        res.redirect('/forgotPassword')
     }
    }catch(error){
        console.log(error.message);
    }
}
 

const sendOtp = async (req, res) => {
    try {
        const email = req.session.resetMail;
        console.log('Email from session:', email);

        const userData = await User.findOne({ email: email });
        if (!userData) {
            console.log('User not found for the provided email');
         
            return;
        }

        const name = userData.name;
      

        const otp = generateOTP();
      

        await sendPassResetMail(name, email, otp);
       
        const resetOtp = new Otp ({
            user_id:userData._id,
            otp
        })
        req.session.tempReset ={
            userId:userData._id,
            email:userData.email,
            otp:otp
        }
        await resetOtp.save()
        res.redirect('/resetotp')
    } catch (error) {
        console.log(error.message);
    }
};

const loadResetotp = async(req,res)=>{
    try{
res.render('resetotp')
    }catch(error){
        console.log(error.message);
    }
}

const verifyResetOtp = async(req,res)=>{
    try{
  const {otp} = req.body
  const tempUser  = req.session.tempReset
  const storedOtp = tempUser.otp
  if(otp!==storedOtp){
    console.log(`Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`);
    req.flash("error", "Invalid OTP");
    return res.redirect("/resetotp");
  }
       const userId = tempUser.userId;


        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/resetotp");
        }else{
            res.redirect('/changePassword')
        }
    }catch(error){
        console.log(error.message);
    }
}

const changePassword = async(req,res)=>{
    try{
     const {newPassword,confirmPassword} = req.body
     const tempUser = req.session.tempReset
     const userId = tempUser.userId;
     console.log(userId);

     const user = await User.findById(userId);
     if(!user){
        req.flash('error', "An error occured while changing password")
        res.redirect('/forgotPassword')
     }
        
        if(newPassword!==confirmPassword){
      
            req.flash('error','Passwords do not match')
            res.redirect('/changePassword')
        }else{
            const hashedPassword = await securePassword(confirmPassword);
           const updatedPassword =  await User.findByIdAndUpdate(userId,{$set:{password: hashedPassword}},{new:true})
            req.flash('success','password changed Successfully,Login to continue')
            res.redirect('/login')
        }
     

    }catch(error){
        console.log(error.message);
    }
}


const renderChangePassword = async(req,res)=>{
    try{
res.render('changePassword')
    }catch(error){
        console.log('error.message');
    }
}
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
    changePassword
   
   
};
