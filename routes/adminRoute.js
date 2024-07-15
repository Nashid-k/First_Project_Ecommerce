const express = require('express')
const adminRoute = express()


//multer
const upload = require('../middlewares/categoryConfig');
const productsUpload = require('../middlewares/productConfig');




const adminAuth = require('../middlewares/adminAuth')

const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productsController')
const salesReportController = require('../controllers/salesReportController')
const offerController = require('../controllers/offerController')
const orderController = require('../controllers/orderController')

adminRoute.set('views','./views/admin')

/***************************************************** LOGIN , LOGOUT & DASHBOARD ***************************************************************************************/


adminRoute.get('/',adminController.renderLogin)
adminRoute.post('/login',adminController.verifyLogin)
adminRoute.get('/login',adminController.loadLogin)
adminRoute.get('/dashboard/data', adminAuth.is_login,adminController.generateData)
adminRoute.get('/dashboard', adminAuth.is_login,adminController.loadDashboard)
adminRoute.get('/logout',adminAuth.is_login,adminController.loadLogout)




/***************************************************** CUSTOMER ***************************************************************************************/


adminRoute.get('/customer',adminAuth.is_login,adminController.renderCustomer)
adminRoute.post('/block',adminAuth.is_login,adminController.blockUser)
adminRoute.post('/unblock',adminAuth.is_login,adminController.unblockUser)





/***************************************************** CATEGORY ***************************************************************************************/


adminRoute.get('/category',adminAuth.is_login,categoryController.renderCategory)
adminRoute.get('/addCategory',adminAuth.is_login,categoryController.renderAddCategory)
adminRoute.post('/insertCategory',upload.single('categoryImage'),categoryController.insertCategory)
adminRoute.get('/editCategory',adminAuth.is_login,categoryController.renderEditCategory)
adminRoute.put('/updateCategory/:id',adminAuth.is_login,categoryController.updateCategory)
adminRoute.post('/listCategory',adminAuth.is_login,categoryController.listCategory)
adminRoute.post('/unlistCategory',adminAuth.is_login,categoryController.unlistCategory)





/***************************************************** PRODUCTS ***************************************************************************************/


adminRoute.get('/products',adminAuth.is_login,productController.renderProducts)
adminRoute.get('/addProduct',adminAuth.is_login,productController.renderAddProducts)
adminRoute.post('/insertProduct', productsUpload, productController.insertProducts);
adminRoute.post('/listProduct',adminAuth.is_login,productController.listProduct)
adminRoute.post('/unlistProduct',adminAuth.is_login,productController.unlistProduct)
adminRoute.get('/editProduct',adminAuth.is_login,productController.renderEditProduct)
adminRoute.put('/updateProduct/:id',adminAuth.is_login,productsUpload,productController.updateProduct)



/***************************************************** SALES REPORT ***************************************************************************************/

adminRoute.get('/sales-report',adminAuth.is_login,salesReportController.renderSalesReport)
adminRoute.post('/sortReport',adminAuth.is_login,salesReportController.sortReport)
adminRoute.get('/downloadsalesreport',salesReportController.downloadSalesReport)



/***************************************************** COUPONS AND OFFERS ***************************************************************************************/

adminRoute.get('/coupons',adminAuth.is_login,offerController.renderCoupons)
adminRoute.post('/addCoupon',adminAuth.is_login,offerController.addCoupons)
adminRoute.delete('/removeCoupon/:couponId',adminAuth.is_login,offerController.removeCoupon)
adminRoute.get('/product-offers',adminAuth.is_login,offerController.renderOffers)
adminRoute.get('/category-offers',adminAuth.is_login,offerController.renderCategoryOffer)
adminRoute.get('/addCategoryOffer',adminAuth.is_login,offerController.renderAddCategoryOffer)
adminRoute.post('/addCategoryOffer',adminAuth.is_login,offerController.AddCategoryOffer)
adminRoute.delete('/removeCategoryOffer/:offerId',adminAuth.is_login,offerController.removeCategoryOffer)
adminRoute.get('/addOffer',adminAuth.is_login,offerController.addOffer);
adminRoute.post('/addProductOffer',adminAuth.is_login,offerController.addProductOffer)
adminRoute.delete('/removeProductOffer/:offerId',adminAuth.is_login,offerController.removeProductOffer)



/***************************************************** ORDERS  ***************************************************************************************/

adminRoute.get('/orders',adminAuth.is_login,orderController.renderOrders)
adminRoute.post('/updateProductStatus',adminAuth.is_login,orderController.updateOrderStatus)
adminRoute.get('/orderDetails',adminAuth.is_login,orderController.orderDetails)
adminRoute.get('/return',adminAuth.is_login,orderController.renderReturnRequest)
adminRoute.post('/acceptReturn',adminAuth.is_login,orderController.acceptReturn);


module.exports = adminRoute