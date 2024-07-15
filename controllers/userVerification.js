const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const Otp = require("../models/otpModel");
const bcrypt = require("bcrypt");
const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const CartItem = require("../models/cartModel");
const WishlistItem = require("../models/wishlistModel");
const crypto = require("crypto");
const Wallet = require("../models/walletModel");
const ProductOffer = require("../models/productOffer");
const CategoryOffer = require("../models/categoryOffer");

function generateOTP() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }
  
  function generateReferralCode(length = 8) {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex") // Convert to hexadecimal format
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
    const { name, email, mobile, password, cpassword, referred_code } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email address already exists");
      return res.redirect("/signUp");
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      req.flash(
        "error",
        "Please enter a valid 10-digit mobile number starting with 6-9"
      );
      return res.redirect("/signUp");
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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
      referredUserId: referredUser ? referredUser._id : null,
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
      console.log(
        `Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`
      );
      req.flash("error", "Invalid OTP");
      return res.redirect("/otp");
    }

    const user = new User({
      ...tempUser.userData,
      is_verified: true,
    });
    const userData = await user.save();

    const wallet = new Wallet({
      userId: userData._id,
      balance: 0,
      transactions: [],
    });
    await wallet.save();

    if (tempUser.referredUserId) {
      const referredUser = await User.findById(tempUser.referredUserId);
      if (referredUser) {
        let referredUserWallet = await Wallet.findOne({
          userId: referredUser._id,
        });
        if (!referredUserWallet) {
          referredUserWallet = new Wallet({
            userId: referredUser._id,
            balance: 0,
            transactions: [],
          });
        }
        referredUserWallet.balance += 100;
        referredUserWallet.transactions.push({
          amount: 100,
          transactionMethod: "Referral",
          date: new Date(),
          description: "Referral Bonus for referring " + userData.name,
        });
        await referredUserWallet.save();

        wallet.balance += 100;
        wallet.transactions.push({
          amount: 100,
          transactionMethod: "Referral",
          date: new Date(),
          description: "Referral Bonus for joining via " + referredUser.name,
        });
        await wallet.save();

        referredUser.referral_bonus_given = true;
        await referredUser.save();
      }
    }

    delete req.session.tempUser;
    delete req.session.otpExpiration;

    req.flash(
      "success",
      "Email verified successfully! Login to enjoy shopping"
    );
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

          req.flash(
            "error",
            "Email is not verified. We have sent a new OTP to your email."
          );
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
      console.log(
        `Invalid OTP: Entered OTP ${otp} does not match stored OTP ${storedOtp}`
      );
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

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  renderLogin,
  renderSignUp,
  insertUser,
  verifyOtp,
  renderOtp,
  resendOtp,
  verifyLogin,
  renderForgotPassword,
  findAccount,
  sendOtp,
  verifyResetOtp,
  loadResetotp,
  renderChangePassword,
  changePassword,
  logout,
};
