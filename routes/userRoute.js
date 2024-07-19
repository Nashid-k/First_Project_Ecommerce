const express = require('express')
const userRoute = express()
const profileController = require('../controllers/userProfileController')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const walletController =require('../controllers/walletController')
const userVerificationController = require('../controllers/userVerification')
userRoute.set('views','./views/users')

const userAuth = require('../middlewares/userAuth')
const passport = require('passport')

/***************************************************** HOME,SHOP,PRODUCT_DETAILS,WOMEN,WISHLIST ***************************************************************************************/


userRoute.get('/',userController.renderHome)
userRoute.get('/shop',userController.renderShop)
userRoute.get('/productDetails/:productId',userController.renderProductDetails);
userRoute.get('/women',userController.renderWomen)
userRoute.get('/mens',userController.renderMens)
userRoute.get('/sort/:category/:criteria', userController.sortProducts);
userRoute.get('/wishlist',userController.renderWishlist)
userRoute.get('/addToWishlist',userController.addToWishlist)
userRoute.get('/RemoveFromWishlist',userController.RemoveFromWishlist)





/***************************************************** USER SIGNUP,SIGN IN,LOGOUT ,OTP ***************************************************************************************/

userRoute.get('/signUp',userAuth.is_logout,userVerificationController.renderSignUp)
userRoute.post('/signUp',userVerificationController.insertUser)
userRoute.get('/login',userAuth.is_logout,userVerificationController.renderLogin)
userRoute.post('/login',userVerificationController.verifyLogin)
userRoute.get('/logout',userAuth.is_login,userVerificationController.logout)
userRoute.get('/forgotPassword',userVerificationController.renderForgotPassword)
userRoute.post('/findAccount',userVerificationController.findAccount)
userRoute.post('/verifyAccount',userVerificationController.sendOtp)
userRoute.get('/resetotp',userVerificationController.loadResetotp)
userRoute.post('/verifyResetOtp',userVerificationController.verifyResetOtp)
userRoute.get('/changePassword',userVerificationController.renderChangePassword)
userRoute.post('/resetPassword',userVerificationController.changePassword)
userRoute.get('/otp',userAuth.is_logout,userVerificationController.renderOtp)
userRoute.post('/verifyOTP',userVerificationController.verifyOtp);
userRoute.get('/resendOtp',userAuth.is_logout,userVerificationController.resendOtp)


userRoute.get('/orderplaced',userAuth.is_login,cartController.renderOrderPlaced)



const { renderHome } = require('../controllers/userController');


userRoute.get('/auth', passport.authenticate('google', { scope: ['email', 'profile'] }));

userRoute.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }), 
  (req, res) => {
      if (req.flash('error').length > 0) {
          return res.redirect('/login');
      }
      req.session.userId = req.user._id;
      res.redirect('/home');
  }
);

userRoute.get('/home', (req, res) => {
    if (req.user) {
        req.session.userId = req.user._id;
    }
    renderHome(req, res);
});

userRoute.get('/auth/callback/failure', (req, res) => {
   req.flash('error', 'You are not authenticated to log in');
   res.redirect('/login');
});



/***************************************************** USER PROFILE ***************************************************************************************/

userRoute.get('/profile',userAuth.is_login,profileController.renderProfile)
userRoute.get('/edit-profile',userAuth.is_login,profileController.renderEditProfile)
userRoute.post('/edit-profile',userAuth.is_login,profileController.updateProfile)
userRoute.get('/address',userAuth.is_login,profileController.renderaddress)
userRoute.get('/add-address',userAuth.is_login,profileController.renderAddNewAddress)
userRoute.post('/add-address',userAuth.is_login,profileController.insertNewAddress)
userRoute.get('/edit-address',userAuth.is_login,profileController.renderEditAddress)
userRoute.post('/update-address',userAuth.is_login,profileController.updateAddress)
userRoute.delete('/delete-address/:id',userAuth.is_login, profileController.deleteAddress);
userRoute.get('/coupons',userAuth.is_login,profileController.renderCoupon)





/***************************************************** CART ***************************************************************************************/

userRoute.get('/cart',userAuth.is_login,cartController.renderCart)
userRoute.get('/addToCart',userAuth.is_login,cartController.addToCart)

userRoute.get('/checkout',userAuth.is_login,cartController.loadCheckout)
userRoute.post('/updateCartItem',userAuth.is_login,cartController.updateCartItem)
userRoute.post('/removeCartItem',userAuth.is_login,cartController.removeCartItem)
userRoute.post('/placeOrder',userAuth.is_login,cartController.placeOrder)
userRoute.post('/applyCoupon',userAuth.is_login,cartController.applyCoupon)
userRoute.post('/verifyRazorpayPayment',userAuth.is_login, cartController.verifyRazorpayPayment);
userRoute.get('/addNewAddress',userAuth.is_login,cartController.addNewAddress)
userRoute.post('/addCheckoutAddress',userAuth.is_login,cartController.insertCheckoutAddress)
userRoute.delete('/removeAddress/:id',userAuth.is_login,cartController.removeAddress)


userRoute.get('/myOrders',userAuth.is_login,profileController.renderMyOrder)
userRoute.get('/orderDetails',userAuth.is_login,profileController.renderOrderDetails)
userRoute.post('/cancelOrder', userAuth.is_login,profileController.cancelOrder);
userRoute.get('/refferal',userAuth.is_login,profileController.renderRefferal)
userRoute.post('/returnOrder',userAuth.is_login,profileController.returnOrderRequest)



userRoute.get('/Wallet',userAuth.is_login,walletController.renderWallet)
userRoute.post('/add-money',userAuth.is_login,walletController.addMoneyToWallet)

userRoute.post('/initiatePayment',userAuth.is_login,profileController.initiatePayment)
userRoute.post('/verifyPayment', userAuth.is_login,profileController.verifyPayment)
userRoute.get('/invoice/:orderId/:productId', userAuth.is_login,profileController.generateInvoice);
userRoute.post('/addReview',userAuth.is_login,profileController.addReview)


userRoute.get('*', (req, res, next) => {
  if (req.url.startsWith('/admin')) {
    return next();
  }else if (req.url.startsWith('/auth/callback')) {
    return next();
  }
  res.render('404'); 
});


module.exports = userRoute