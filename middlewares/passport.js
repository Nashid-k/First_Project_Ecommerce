const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const crypto = require('crypto');
const Wallet = require('../models/walletModel')
dotenv.config();


function generateReferralCode(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') 
        .slice(0, length);
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: process.env.callbackURL,
    passReqToCallback: true
  }, async function (req, accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
  
      if (user && user.block) {
        return done(null, false); 
      }
  
      const hashedPassword = await bcrypt.hash(profile.id, 10);
      const newReferralCode = generateReferralCode();
  
      if (!user) {
        user = new User({
          password: hashedPassword,
          name: profile.displayName,
          email: profile.emails[0].value,
          is_admin: 0,
          is_verified: 1,
          referral_code: newReferralCode,
        });
        await user.save();
  
        const wallet = new Wallet({
          userId: user._id,
          balance: 0,
          transactions: []
        });
        await wallet.save();
      }
  
    
      req.session.userId = user._id;
  
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
  
