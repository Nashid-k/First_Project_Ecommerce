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
adminRoute.get('/dashboard/data', adminAuth.is_login,adminController.generateData)
adminRoute.get('/dashboard', adminAuth.is_login,adminController.loadDashboard)





/***************************************************** CUSTOMER ***************************************************************************************/


adminRoute.get('/customer',adminAuth.is_login,adminController.renderCustomer)
adminRoute.post('/block',adminAuth.is_login,adminController.blockUser)
adminRoute.post('/unblock',adminAuth.is_login,adminController.unblockUser)





/***************************************************** CATEGORY ***************************************************************************************/


adminRoute.get('/category',adminAuth.is_login,adminController.renderCategory)
adminRoute.get('/addCategory',adminAuth.is_login,adminController.renderAddCategory)
adminRoute.post('/insertCategory',upload.single('categoryImage'),adminController.insertCategory)
adminRoute.get('/editCategory',adminAuth.is_login,adminController.renderEditCategory)
adminRoute.put('/updateCategory/:id',adminAuth.is_login,adminController.updateCategory)
adminRoute.post('/listCategory',adminAuth.is_login,adminController.listCategory)
adminRoute.post('/unlistCategory',adminAuth.is_login,adminController.unlistCategory)





/***************************************************** PRODUCTS ***************************************************************************************/


adminRoute.get('/products',adminAuth.is_login,adminController.renderProducts)
adminRoute.get('/addProduct',adminAuth.is_login,adminController.renderAddProducts)
adminRoute.post('/insertProduct', productsUpload, adminController.insertProducts);
adminRoute.post('/listProduct',adminAuth.is_login,adminController.listProduct)
adminRoute.post('/unlistProduct',adminAuth.is_login,adminController.unlistProduct)
adminRoute.get('/editProduct',adminAuth.is_login,adminController.renderEditProduct)
adminRoute.put('/updateProduct/:id',adminAuth.is_login,productsUpload,adminController.updateProduct)



adminRoute.get('/sales-report',adminAuth.is_login,adminController.renderSalesReport)
adminRoute.post('/sortReport',adminAuth.is_login,adminController.sortReport)
adminRoute.get('/downloadsalesreport',adminController.downloadSalesReport)
adminRoute.get('/coupons',adminAuth.is_login,adminController.renderCoupons)
adminRoute.post('/addCoupon',adminAuth.is_login,adminController.addCoupons)
adminRoute.delete('/removeCoupon/:couponId',adminAuth.is_login,adminController.removeCoupon)






adminRoute.get('/orders',adminAuth.is_login,adminController.renderOrders)
adminRoute.post('/updateProductStatus',adminAuth.is_login,adminController.updateOrderStatus)
adminRoute.get('/orderDetails',adminAuth.is_login,adminController.orderDetails)


adminRoute.get('/product-offers',adminAuth.is_login,adminController.renderOffers)
adminRoute.get('/category-offers',adminAuth.is_login,adminController.renderCategoryOffer)
adminRoute.get('/addCategoryOffer',adminAuth.is_login,adminController.renderAddCategoryOffer)
adminRoute.post('/addCategoryOffer',adminAuth.is_login,adminController.AddCategoryOffer)
adminRoute.delete('/removeCategoryOffer/:offerId',adminAuth.is_login,adminController.removeCategoryOffer)
adminRoute.get('/addOffer',adminAuth.is_login,adminController.addOffer);
adminRoute.post('/addProductOffer',adminAuth.is_login,adminController.addProductOffer)
adminRoute.delete('/removeProductOffer/:offerId',adminAuth.is_login,adminController.removeProductOffer)

adminRoute.get('/return',adminAuth.is_login,adminController.renderReturnRequest)
adminRoute.post('/acceptReturn', adminAuth.is_login,adminController.acceptReturn);
adminRoute.get('/logout',adminAuth.is_login,adminController.loadLogout)

module.exports = adminRoute