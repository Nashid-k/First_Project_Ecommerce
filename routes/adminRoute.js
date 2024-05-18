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






adminRoute.get('/orders',adminAuth.is_login,adminController.renderOrders)
adminRoute.post('/updateOrderStatus',adminAuth.is_login,adminController.updateOrderStatus)
adminRoute.get('/orderDetails',adminAuth.is_login,adminController.orderDetails)

module.exports = adminRoute