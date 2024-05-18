const express = require('express')
const userRoute = express()
const profileController = require('../controllers/userProfileController')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')

userRoute.set('views','./views/users')

const userAuth = require('../middlewares/userAuth')
const passport = require('passport')

/***************************************************** HOME,SHOP,PRODUCT_DETAILS,WOMEN ***************************************************************************************/


userRoute.get('/',userController.renderHome)
userRoute.get('/shop',userController.renderShop)
userRoute.get('/productDetails/:productId',userController.renderProductDetails);
userRoute.get('/women',userController.renderWomen)
userRoute.get('/sort/:category/:criteria', userController.sortProducts);






/***************************************************** USER SIGNUP,SIGN IN,LOGOUT ***************************************************************************************/

userRoute.get('/signUp',userAuth.is_logout,userController.renderSignUp)
userRoute.post('/signUp',userController.insertUser)
userRoute.get('/login',userAuth.is_logout,userController.renderLogin)
userRoute.post('/login',userController.verifyLogin)
userRoute.get('/logout',userAuth.is_login,userController.logout)
userRoute.get('/forgotPassword',userController.renderForgotPassword)
userRoute.post('/findAccount',userController.findAccount)
userRoute.post('/verifyAccount',userController.sendOtp)
userRoute.get('/resetotp',userController.loadResetotp)
userRoute.post('/verifyResetOtp',userController.verifyResetOtp)
userRoute.get('/changePassword',userController.renderChangePassword)
userRoute.post('/resetPassword',userController.changePassword)



// Google OAuth Routes
userRoute.get('/auth', passport.authenticate('google', { scope: ['email', 'profile'] }));
userRoute.get("/home",(req,res)=> {
    if (req.user) {
      req.session.userId = req.user
        res.render("home", { userData: req.user });
      } else {
        res.redirect("/login");
      }
  })
  

  userRoute.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login",successRedirect:"/home"}))
/***************************************************** OTP ***************************************************************************************/

userRoute.get('/otp',userAuth.is_logout,userController.renderOtp)
userRoute.post('/verifyOTP',userController.verifyOtp);
userRoute.get('/resendOtp',userAuth.is_logout,userController.resendOtp)




/***************************************************** USER PROFILE ***************************************************************************************/

userRoute.get('/profile',profileController.renderProfile)
userRoute.get('/edit-profile',profileController.renderEditProfile)
userRoute.post('/edit-profile',profileController.updateProfile)
userRoute.get('/address',profileController.renderaddress)
userRoute.get('/add-address',profileController.renderAddNewAddress)
userRoute.post('/add-address',profileController.insertNewAddress)
userRoute.get('/edit-address',profileController.renderEditAddress)
userRoute.post('/update-address',profileController.updateAddress)
userRoute.delete('/delete-address/:id', profileController.deleteAddress);





/***************************************************** CART ***************************************************************************************/

userRoute.get('/cart',cartController.renderCart)
userRoute.get('/addToCart',cartController.addToCart)

userRoute.get('/checkout',cartController.loadCheckout)
userRoute.post('/updateCartItem',cartController.updateCartItem)
userRoute.post('/removeCartItem',cartController.removeCartItem)
userRoute.post('/placeOrder',cartController.placeOrder)
userRoute.get('/addNewAddress',cartController.addNewAddress)
userRoute.post('/addCheckoutAddress',cartController.insertCheckoutAddress)



userRoute.get('/myOrders',userAuth.is_login,profileController.renderMyOrder)
userRoute.get('/orderDetails/:productId',userAuth.is_login,profileController.renderOrderDetails)




userRoute.get('*', (req, res, next) => {
  if (req.url.startsWith('/admin')) {
    return next();
  }else if (req.url.startsWith('/auth/callback')) {
    return next();
  }
  res.render('404'); 
});


module.exports = userRoute