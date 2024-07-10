const express = require('express')
const userRoute = express()
const profileController = require('../controllers/userProfileController')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const walletController =require('../controllers/walletController')

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
userRoute.get('/orderplaced',cartController.renderOrderPlaced)



const { renderHome } = require('../controllers/userController'); // Adjust the path as necessary

// Google OAuth Routes
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
userRoute.get('/coupons',profileController.renderCoupon)





/***************************************************** CART ***************************************************************************************/

userRoute.get('/cart',cartController.renderCart)
userRoute.get('/addToCart',cartController.addToCart)

userRoute.get('/checkout',cartController.loadCheckout)
userRoute.post('/updateCartItem',cartController.updateCartItem)
userRoute.post('/removeCartItem',cartController.removeCartItem)
userRoute.post('/placeOrder',cartController.placeOrder)
userRoute.post('/applyCoupon',cartController.applyCoupon)
userRoute.post('/verifyRazorpayPayment', cartController.verifyRazorpayPayment);
userRoute.get('/addNewAddress',cartController.addNewAddress)
userRoute.post('/addCheckoutAddress',cartController.insertCheckoutAddress)
userRoute.delete('/removeAddress/:id',cartController.removeAddress)


userRoute.get('/myOrders',userAuth.is_login,profileController.renderMyOrder)
userRoute.get('/orderDetails',userAuth.is_login,profileController.renderOrderDetails)
userRoute.post('/cancelOrder', profileController.cancelOrder);
userRoute.get('/refferal',profileController.renderRefferal)
userRoute.post('/returnOrder',profileController.returnOrderRequest)



userRoute.get('/Wallet',walletController.renderWallet)
userRoute.post('/add-money',walletController.addMoneyToWallet)

userRoute.post('/initiatePayment',profileController.initiatePayment)
userRoute.post('/verifyPayment', profileController.verifyPayment)
userRoute.get('/invoice/:orderId', profileController.generateInvoice);
userRoute.post('/addReview',profileController.addReview)


userRoute.get('*', (req, res, next) => {
  if (req.url.startsWith('/admin')) {
    return next();
  }else if (req.url.startsWith('/auth/callback')) {
    return next();
  }
  res.render('404'); 
});


module.exports = userRoute