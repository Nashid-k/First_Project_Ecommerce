const express = require('express')
const adminRoute = express()


//multer
const upload = require('../middlewares/categoryConfig');
const productsUpload = require('../middlewares/productConfig');




const adminAuth = require('../middlewares/adminAuth')

const adminController = require('../controllers/adminController')




adminRoute.set('views','./views/admin')

/***************************************************** LOGIN & DASHBOARD ***************************************************************************************/


adminRoute.get('/',adminController.renderLogin)
adminRoute.post('/login',adminController.verifyLogin)
adminRoute.get('/login',adminController.loadLogin)
adminRoute.get('/dashboard',adminAuth.is_login,adminController.loadDashboard)





/***************************************************** CUSTOMER ***************************************************************************************/


adminRoute.get('/customer',adminAuth.is_login,adminController.renderCustomer)
adminRoute.post('/block',adminController.blockUser)
adminRoute.post('/unblock',adminController.unblockUser)





/***************************************************** CATEGORY ***************************************************************************************/


adminRoute.get('/category',adminAuth.is_login,adminController.renderCategory)
adminRoute.get('/addCategory',adminAuth.is_login,adminController.renderAddCategory)
adminRoute.post('/insertCategory',upload.single('categoryImage'),adminController.insertCategory)
adminRoute.get('/editCategory',adminAuth.is_login,adminController.renderEditCategory)
adminRoute.put('/updateCategory/:id',adminController.updateCategory)
adminRoute.post('/listCategory',adminController.listCategory)
adminRoute.post('/unlistCategory',adminController.unlistCategory)





/***************************************************** PRODUCTS ***************************************************************************************/


adminRoute.get('/products',adminController.renderProducts)
adminRoute.get('/addProduct',adminController.renderAddProducts)
adminRoute.post('/insertProduct', productsUpload, adminController.insertProducts);
adminRoute.post('/listProduct',adminController.listProduct)
adminRoute.post('/unlistProduct',adminController.unlistProduct)
adminRoute.get('/editProduct',adminController.renderEditProduct)
adminRoute.put('/updateProduct/:id',productsUpload,adminController.updateProduct)



adminRoute.get('/sales-report',adminController.renderSalesReport)
adminRoute.get('/downloadsalesreport',adminController.downloadSalesReport)
adminRoute.get('/coupons',adminController.renderCoupons)
adminRoute.post('/addCoupon',adminController.addCoupons)
adminRoute.delete('/removeCoupon/:couponId',adminController.removeCoupon)






adminRoute.get('/orders',adminController.renderOrders)
adminRoute.post('/updateProductStatus',adminController.updateOrderStatus)
adminRoute.get('/orderDetails',adminController.orderDetails)


adminRoute.get('/product-offers',adminController.renderOffers)
adminRoute.get('/category-offers',adminController.renderCategoryOffer)
adminRoute.get('/addCategoryOffer',adminController.renderAddCategoryOffer)
adminRoute.post('/addCategoryOffer',adminController.AddCategoryOffer)
adminRoute.delete('/removeCategoryOffer/:offerId',adminController.removeCategoryOffer)
adminRoute.get('/addOffer',adminController.addOffer);
adminRoute.post('/addProductOffer',adminController.addProductOffer)
adminRoute.delete('/removeProductOffer/:offerId',adminController.removeProductOffer)
adminRoute.get('/api/dashboard',adminController.generateData)
adminRoute.get('/return',adminController.renderReturnRequest)
adminRoute.post('/acceptReturn', adminController.acceptReturn);

module.exports = adminRoute