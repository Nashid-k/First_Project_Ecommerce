const express = require('express')
const userRoute = express()
const profileController = require('../controllers/userProfileController')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')

userRoute.set('view engine','ejs')
userRoute.set('views','./views/users')

const userAuth = require('../middlewares/userAuth')

/***************************************************** HOME,SHOP,PRODUCT_DETAILS,WOMEN ***************************************************************************************/


userRoute.get('/',userController.renderHome)
userRoute.get('/shop',userController.renderShop)
userRoute.get('/productDetails/:productId',userController.renderProductDetails);
userRoute.get('/women',userController.renderWomen)
userRoute.get('/sort/:criteria',userController.sortProducts);






/***************************************************** USER SIGNUP,SIGN IN,LOGOUT ***************************************************************************************/

userRoute.get('/signUp',userAuth.is_logout,userController.renderSignUp)
userRoute.post('/signUp',userController.insertUser)
userRoute.get('/login',userAuth.is_logout,userController.renderLogin)
userRoute.post('/login',userController.verifyLogin)
userRoute.get('/logout',userAuth.is_login,userController.logout)
userRoute.get('/forgotPassword',userController.renderForgotPassword)
userRoute.post('/findAccount',userController.findAccount)




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







module.exports = userRoute