const passport  = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy
const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const dotenv = require('dotenv')
dotenv.config()
passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    done(null,user)
})


passport.use(new GoogleStrategy({
clientID:process.env.clientID,
clientSecret:process.env.clientSecret,
callbackURL:process.env.callbackURL,
passReqToCallback:true
},
async function(req,accessTokern,refreshToken,profile,done){
    try{
let user =  await User.findOne({email:profile.emails[0].value})
const hashedPassword = await bcrypt.hash(profile.id, 10);
if(!user){
 user = new User({
        password:hashedPassword,
        name: profile.displayName,
        email: profile.emails[0].value,
        is_admin:0,
        is_verified:1
    });
    await user.save();
}
done(null,user)
    }catch(error){
       done(error);
    }

}
))

