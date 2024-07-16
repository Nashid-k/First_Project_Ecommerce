const Products = require("../models/productModel");
const Order=require('../models/orderModel')
const Wallet = require('../models/walletModel')


const renderOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    const orderData = await Order.find()
      .populate("orderedItem.productId")
      .populate('userId')
      .skip(skip)
      .limit(limit);

    res.render('order', {
      orderData,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
    });
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
};


  const updateOrderStatus = async (req, res) => {
    const { orderId, productId, productStatus } = req.body;
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      const product = order.orderedItem.find(item => item.productId.toString() === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found in this order' });
      }
  
      product.status = productStatus;
      await order.save();
  
      res.status(200).json({ message: 'Product status updated successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

  



  const orderDetails = async (req, res) => {
    try {
        const { productId, userId } = req.query;

        const order = await Order.findOne({ 'orderedItem.productId': productId, userId: userId })
            .populate('orderedItem.productId')
            .populate('userId')
            .populate('deliveryAddress')
            .populate('deliveryCharge')

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const product = order.orderedItem.find(item => item.productId._id.toString() === productId);
        if (!product) {
            return res.status(404).send("Product not found in this order");
        }

        res.render('orderDetails', { order, product });
    } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
        res.status(500).send("Internal Server Error");
    }
};


const renderReturnRequest = async(req,res)=>{
    try{
     
    const returnRequests= await Order.find({ 'orderedItem.status': 'returnrequested' })
  .populate('userId') 
  .populate('orderedItem.productId'); 
  
  
  res.render('return', { returnRequests});
    }catch(error){
      console.log(error.message);
    }
  }
  
  
  
  const acceptReturn = async (req, res) => {
    
    const { orderId, productId } = req.body;
  
    try {
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      const orderedItem = order.orderedItem.find(item => item.productId.toString() === productId);
  
      if (!orderedItem) {
        return res.status(404).json({ error: 'Product not found in order' });
      }
  
  
      if (orderedItem.status !== 'returnrequested') {
        return res.status(400).json({ error: 'Order item is not in return requested status' });
      }
  
  
      orderedItem.status = 'Returned';
  
      await order.save();
  
      const refundAmount = orderedItem.totalProductAmount;
  
  
      const userId = req.session.userId;
      const userWallet = await Wallet.findOne({ userId });
  
      if (!userWallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
  
      userWallet.balance += refundAmount;
      userWallet.transactions.push({
        amount: refundAmount,
        transactionMethod: "Refund",
        date: new Date(),
      });
  
      await userWallet.save();
  
     
      const product = await Products.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      product.quantity += orderedItem.quantity;
      await product.save();
  
  
      res.status(200).json({ success: 'Return accepted successfully', refundAmount });
  
    } catch (error) {
      console.error('Error accepting return:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };





module.exports={
    renderReturnRequest,
    acceptReturn,
    orderDetails,
    renderOrders,
    updateOrderStatus,
}