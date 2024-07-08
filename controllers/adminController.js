const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const moment = require('moment');
const productsUpload = require("../middlewares/productConfig");
const Order=require('../models/orderModel')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Coupon = require('../models/couponModel')
const ProductOffer = require('../models/productOffer')
const path = require('path');
const productModel = require("../models/productModel");
const CategoryOffer = require("../models/categoryOffer");
const categoryModel = require("../models/categoryModel");
const Wallet = require('../models/walletModel')


const renderLogin = async (req, res) => {
    try {
        return res.redirect("/admin/login");
    } catch (error) {
        console.log(error.message);
    }
};

const loadLogin = async (req, res) => {
    try {
       
        if (req.session.isAdmin) {
      
            return res.redirect("/admin/dashboard");
        } else {
            
            return res.render("login");
        }
    } catch (error) {
        console.log(error.message);
    }
};

const verifyLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      const userData = await User.findOne({ email });
  
      if (!userData) {
        req.flash("error", "User not found");
        return res.redirect("/admin/login");
      }
  
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (!userData.is_admin) {
          req.flash("error", "You are not authorized to login");
          return res.redirect("/admin/login");
        } else {
          req.session.adminId = userData._id;
          req.session.isAdmin = true;  
          return res.redirect("/admin/dashboard");
        }
      } else {
        req.flash("error", "Email or password is incorrect");
        return res.redirect("/admin/login");
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  

 
  


const renderCustomer = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 });
    const formattedUserData = userData.map((user) => {
      const joinedAtFormatted = moment(user.joinedAt).format('DD/MM/YYYY');
      return { ...user.toObject(), joinedAtFormatted };
    });
    return res.render("customers", { userData: formattedUserData });
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log(`google oauth ${userId}`);
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { block: true } }, { new: true });
        console.log(updatedUser);
        return res.status(200).send({ message: "User blocked successfully", redirect: "/admin/customers" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ message: "Internal server error" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { block: false } }, { new: true });
        return res.status(200).send({ message: "User unblocked successfully", redirect: "/admin/customers" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ message: "Internal server error" });
    }
};

const renderCategory = async (req, res) => {
    try {
        const categoryData = await Category.find();

        return res.render("category", { categoryData });
    } catch (error) {
        console.log(error.message);
    }
};

const renderAddCategory = async (req, res) => {
    try {
        const categoryData = await Category.find();

        return res.render("addcategory");
    } catch (error) {
        console.log(error.message);
    }
};

const insertCategory = async (req, res) => {
  try {
    let { name } = req.body;
    name = name.trim();
    const normalizedName = name.toLowerCase();

    if (normalizedName === "") {
      req.flash("error", "Category name cannot be empty. Please enter a valid name.");
      return res.redirect("/admin/addcategory");
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') }
    });

    if (existingCategory) {
      req.flash("error", "Category already exists.");
      return res.redirect("/admin/addcategory");
    }

    const uploadedImageName = req.file ? req.file.filename : '';

    const category = new Category({
      name: normalizedName,  // Store the lowercase version
      categoryImage: uploadedImageName
    });

    await category.save();

    req.flash("success", "Category added successfully!");
    return res.redirect("/admin/category");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "An error occurred while adding the category.");
    return res.redirect("/admin/addcategory");
  }
};

const renderEditCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findOne({ _id: id });
        if (categoryData) {
            res.render("editcategory", { category: categoryData });
        } else {
            req.flash("error", "Category not found");
            res.redirect("/admin/category");
        }
    } catch (error) {
        console.log(error.message);
        req.flash("error", "An error occurred while fetching the category");
        res.redirect("/admin/category");
    }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { name } = req.body;

    name = name.trim();
    const normalizedName = name.toLowerCase();

    if (!normalizedName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check for existing category using case-insensitive search
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      _id: { $ne: id } // Exclude the current category
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      { name: normalizedName }, // Store the lowercase version
      { new: true }
    );

    if (updatedCategory) {
      req.flash("success", "Category updated successfully!");
      return res.status(200).json({ 
        message: "Category updated successfully", 
        redirect: "/admin/category" 
      });
    } else {
      return res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "An error occurred while updating the category" });
  }
};

const listCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const categoryData = await Category.findByIdAndUpdate(
            categoryId,
            { $set: { is_listed: true } },
            { new: true }
        );

        if (categoryData) {
            res.status(200).json({ category: categoryData, success: "Category listed successfully" });
        } else {
            res.status(404).json({ error: "Category not found" });
        }
    } catch (error) {
        console.error("Error listing category:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const unlistCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const categoryData = await Category.findByIdAndUpdate(
            categoryId,
            { $set: { is_listed: false } },
            { new: true }
        );

        if (categoryData) {
            res.status(200).json({ category: categoryData, success: "Category unlisted successfully" });
        } else {
            res.status(404).json({ error: "Category not found" });
        }
    } catch (error) {
        console.error("Error unlisting category:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


const renderProducts = async (req, res) => {
    try {
        const productData = await Products.find();
        res.render("products", { productData });
    } catch (error) {
        console.log(error.message);
    }
};

const renderAddProducts = async (req, res) => {
    try {
        const categoryData = await Category.find({ is_listed: true });

        res.render("addproduct", { categoryData });
    } catch (error) {
        console.log(error.message);
    }
};

const insertProducts = async (req, res) => {
  try {
    let { name, description, price, quantity, size, category } = req.body;

    name = name.trim();
    description = description.trim();

    if (!name || !description || quantity < 0 || price < 0) {
      req.flash('error', 'Invalid entry. Ensure no fields are empty or contain only spaces.');
      return res.redirect('/admin/addproduct');
    }

    const normalizedName = name.toLowerCase();

    const existingProduct = await Products.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') }
    });

    if (existingProduct) {
      req.flash('error', 'Product already exists.');
      return res.redirect('/admin/addproduct');
    }

    const validExtensions = ['jpg', 'jpeg', 'png'];

    const uploadedImageName = req.files.mainImage ? req.files.mainImage[0].filename : '';
    const mainImageExtension = uploadedImageName.split('.').pop().toLowerCase();

    if (req.files.mainImage && !validExtensions.includes(mainImageExtension)) {
      req.flash('error', 'Only image files are allowed for the main image.');
      return res.redirect('/admin/addproduct');
    }

    const uploadedScreenshots = req.files.screenshots
      ? req.files.screenshots.map(file => {
          const extension = file.filename.split('.').pop().toLowerCase();
          if (!validExtensions.includes(extension)) {
            throw new Error('Only image files are allowed for screenshots.');
          }
          return file.filename;
        })
      : [];

    const newProduct = new Products({
      name: normalizedName,
      description,
      price,
      mainImage: uploadedImageName,
      screenshots: uploadedScreenshots,
      quantity,
      size,
      category
    });

    await newProduct.save();
    req.flash('success', 'Product added successfully!');
    res.redirect('/admin/products');
  } catch (error) {
    console.log(error.message);
    req.flash('error', 'An error occurred while adding the product.');
    res.redirect('/admin/addproduct');
  }
};








const listProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const productData = await Products.findByIdAndUpdate(productId, { $set: { is_listed: true } }, { new: true });
        if (productData) {
            return res.status(200).send({ success: "Product listed successfully", redirect: "/admin/product" });
        } else {
            return res.status(404).send({ error: "Product not found" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "Internal server error" });
    }
};

const unlistProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const productData = await Products.findByIdAndUpdate(
            productId,
            { $set: { is_listed: false } },
            { new: true }
        );
        if (productData) {
            return res.status(200).send({ success: "Product unlisted successfully", redirect: "/admin/product" });
        } else {
            return res.status(404).send({ error: "Product not found" });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ error: "Internal server error" });
    }
};

 

const renderEditProduct = async (req, res) => {
    try {
      const productId = req.query.id;
      const productData = await Products.findById(productId).populate('category');
  
      if (productData) {
        const categoryData = await Category.find(); // Fetch category data
        res.render('editproduct', { product:productData, categoryData,productData }); // Pass both productData and categoryData to the template
      } else {
        req.flash('error', 'Product not found');
        res.redirect('/admin/products');
      }
    } catch (error) {
      console.log(error.message);
      req.flash('error', 'An error occurred while fetching the product');
      res.redirect('/admin/products');
    }
};


const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, quantity, price, size } = req.body;
        
       
        if (quantity < 0 || price <0) {
            return res.status(400).json({ error: 'Invalid Entry' });
        }
 
        const existingProduct = await Products.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ error: "Product not found" });
        }


        existingProduct.name = name;
        existingProduct.category = category;
        existingProduct.description = description;
        existingProduct.quantity = quantity;
        existingProduct.price = price;
        existingProduct.size = size;

     
        if (req.files && req.files['mainImage']) {
            const mainImage = req.files['mainImage'][0];
            existingProduct.mainImage = mainImage.filename;
        }

        if (req.files && req.files['screenshots']) {
            const screenshots = req.files['screenshots'].map(file => file.filename);
            existingProduct.screenshots = screenshots;
        }

      
        await existingProduct.save();

    
        return res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ error: "An error occurred while updating the product" });
    }
};




  const renderOrders = async(req,res)=>{
    try{
  const orderData = await Order.find().populate("orderedItem.productId").populate('userId')

    res.render('order',{orderData})
    }catch(error){
        console.log(error.message);
    }
  }



  const updateOrderStatus = async (req, res) => {
    const { orderId, productId, productStatus } = req.body;
  
    // console.log(`Order ID: ${orderId}, Product ID: ${productId}, Status: ${productStatus}`);
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
            .populate('deliveryAddress');

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const product = order.orderedItem.find(item => item.productId._id.toString() === productId);
        if (!product) {
            return res.status(404).send("Product not found in this order");
        }

        res.render('orderDetails', { order, product });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



  const renderSalesReport = async (req, res) => {
    try {
      const orders = await Order.find({ orderStatus: 'delivered' }).populate('orderedItem.productId').populate('userId');
  
      const salesData = orders.flatMap(order => 
        order.orderedItem.map(item => ({
          saleId: order._id,
          customerName: order.userId?.name || 'Unknown',
          productName: item.productId?.name || 'No Product Name',
          productImage: item.productId?.mainImage || '',
          quantity: item.quantity,
          totalPrice: (item.quantity * (item.productId?.price || 0)),
          saleDate: order.createdAt
        }))
      );
  
      res.render('salesReport', { salesData, moment });
    } catch (error) {
      console.error("Error in renderSalesReport:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
 



  
  const downloadSalesReport = async (req, res) => {
    try {
      const orders = await Order.find({ orderStatus: 'delivered' }).populate('orderedItem.productId').populate('userId');
  
      const salesData = orders.flatMap(order =>
        order.orderedItem.map(item => ({
          saleId: order._id,
          customerName: order.userId?.name || 'Unknown',
          productName: item.productId?.name || 'No Product Name',
          quantity: item.quantity,
          price: item.productId?.price || 0,
          totalAmount: (item.quantity * (item.productId?.price || 0)),
          saleDate: order.createdAt
        }))
      );
  
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const reportsDir = path.join(__dirname, '../public/reports');
      
      await fsPromises.mkdir(reportsDir, { recursive: true });
      
      const filePath = path.join(reportsDir, `salesReport_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
  
      // Helper functions
      const generateHr = (y) => {
        doc.strokeColor("#aaaaaa")
           .lineWidth(1)
           .moveTo(50, y)
           .lineTo(550, y)
           .stroke();
      }
  
      const formatCurrency = (amount) => {
        return "Rs. " + amount.toFixed(2);
      }
  
      const formatDate = (date) => {
        return moment(date).format('DD/MM/YYYY');
      }
  
      // Add page numbers
      let pageNumber = 1;
      doc.on('pageAdded', () => {
        pageNumber++;
        doc.text(`Page ${pageNumber}`, 50, 750, { align: 'center' });
      });
  
      // Report header
      doc.fillColor("#444444")
         .fontSize(28)
         .text("Nashifa", 50, 50, { align: 'center' })
         .fontSize(20)
         .text("Sales Report", 50, 80, { align: 'center' })
         .fontSize(10)
         .text(`Generated on: ${moment().format('MMMM Do YYYY, h:mm:ss a')}`, 50, 100, { align: 'center' });
  
      generateHr(120);
  
      // Report details
      const reportDetailsTop = 140;
      const startDate = formatDate(salesData[0]?.saleDate);
      const endDate = formatDate(salesData[salesData.length - 1]?.saleDate);
      doc.fontSize(10)
         .text("Report Period:", 50, reportDetailsTop)
         .text(`From: ${startDate}`, 150, reportDetailsTop)
         .text(`To: ${endDate}`, 300, reportDetailsTop)
         .text("Total Orders:", 50, reportDetailsTop + 20)
         .text(orders.length.toString(), 150, reportDetailsTop + 20)
         .text("Total Products Sold:", 50, reportDetailsTop + 40)
         .text(salesData.reduce((sum, sale) => sum + sale.quantity, 0).toString(), 150, reportDetailsTop + 40);
  
      generateHr(reportDetailsTop + 60);
  
      // Sales table
      const tableTop = 240;
      let y = tableTop;
  
      const generateTableRow = (y, saleId, customer, product, qty, price, total, date) => {
        doc.fontSize(9)
           .text(saleId, 50, y, { width: 70 })
           .text(customer, 120, y, { width: 100 })
           .text(product, 220, y, { width: 100 })
           .text(qty, 320, y, { width: 50, align: 'right' })
           .text(price, 370, y, { width: 60, align: 'right' })
           .text(total, 430, y, { width: 60, align: 'right' })
           .text(date, 510, y, { width: 60 });
      };
  
      // Table headers
      doc.font('Helvetica-Bold');
      generateTableRow(y, 'Sale ID', 'Customer', 'Product', 'Qty', 'Price', 'Total', 'Date');
      generateHr(y + 20);
      y += 30;
  
      // Table rows
      doc.font('Helvetica');
      let totalSales = 0;
      salesData.forEach((sale) => {
        generateTableRow(
          y,
          sale.saleId.toString().slice(-6),
          sale.customerName.slice(0, 15),
          sale.productName.slice(0, 15),
          sale.quantity.toString(),
          formatCurrency(sale.price),
          formatCurrency(sale.totalAmount),
          formatDate(sale.saleDate)
        );
        totalSales += sale.totalAmount;
        y += 20;
        generateHr(y);
        y += 10;
  
        if (y > 700) {
          doc.addPage();
          y = 50;
          generateHr(y - 10);
        }
      });
  
      // Total row
      y += 10;
      doc.font('Helvetica-Bold');
      generateTableRow(y, '', '', '', '', 'Total Sales:', formatCurrency(totalSales), '');
  
      // Footer
      doc.fontSize(10)
         .text(
          "© 2024 Nashifa. All rights reserved.",
          50,
          730,
          { align: "center", width: 500 }
        );
  
      doc.end();
  
      writeStream.on('finish', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Error downloading PDF");
          }
          
        });
      });
  
      writeStream.on('error', (err) => {
        console.error("Error writing PDF:", err);
        res.status(500).send("Error generating PDF");
      });
  
    } catch (error) {
      console.error("Error in downloadSalesReport:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  






  const renderCoupons = async(req,res)=>{
    try {
     
      const coupons = await Coupon.find();
  
     
      res.render('coupons', { coupons });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  
  }

  const addCoupons = async (req, res) => {
    try {
   
      const { code, discountType, discountValue, minPurchaseAmount, validity } = req.body;
  

      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(currentDate.getDate() + parseInt(validity));
  

      const newCoupon = new Coupon({
        code,
        discountType,
        discountValue,
        minPurchaseAmount,
        validity: expiryDate
      });
  
 
      await newCoupon.save();
  
  
      res.redirect('/admin/coupons');
    } catch (error) {

      console.error('Error adding coupon:', error);
      res.status(500).send('An error occurred while adding the coupon');
    }
  };
  



  const removeCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;


        const usersWithAvailableCoupon = await User.find({ "availableCoupons.couponId": couponId });
        const usersWithUsedCoupon = await User.find({ "usedCoupons": couponId });

  
        for (const user of usersWithAvailableCoupon) {
            user.availableCoupons = user.availableCoupons.filter(coupon => coupon.couponId.toString() !== couponId);
            await user.save(); 
        }


        for (const user of usersWithUsedCoupon) {
            user.usedCoupons = user.usedCoupons.filter(id => id.toString() !== couponId);
            await user.save(); 
        }

        await Coupon.findByIdAndDelete(couponId);

        res.status(200).json({ message: 'Coupon removed successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to remove coupon' });
    }
}



const renderOffers = async(req,res)=>{
  try{
    const offers = await ProductOffer.find().populate('productId');

    res.render('productOffer', { offers }); 
  }catch(error){
    console.log(error.message);
  }
}
  



const addOffer = async (req, res) => {
  try {
   const products = await productModel.find({})
   res.render('addProductOffer',{products})
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).json({ error: 'An error occurred while adding the offer' });
  }
};

const addProductOffer = async (req, res) => {
  try {
    const { description, selectedProduct, discountValue, startDate, endDate } = req.body;


    if(discountValue>50){
      req.flash('error','offer should be below 50 %')
      return res.redirect('/admin/addOffer')
    }
    const productOffer = new ProductOffer({
      description: description,
      discountValue: discountValue,
      startDate: startDate,
      endDate: endDate,
      productId: selectedProduct
    });

    await productOffer.save();
    res.redirect('/admin/product-offers');
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const removeProductOffer  = async(req,res)=>{
  try{
 const {offerId} = req.params

 const productWithId = await ProductOffer.findById(offerId)

 await productWithId.deleteOne()
 res.json(200)
  }catch(error){
    console.log(error.message)
  }
}


const renderCategoryOffer = async(req,res)=>{
  try{
    const offers = await CategoryOffer.find().populate('categoryId'); 
res.render('categoryOffers',{offers})
  }catch(error){
    console.log(error.message);
  }
}

const renderAddCategoryOffer =  async (req, res) => {
  try {
   const categories = await categoryModel.find({})
   res.render('addCategoryOffer',{categories})
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).json({ error: 'An error occurred while adding the offer' });
  }
};

const AddCategoryOffer = async(req,res)=>{
  try{
  const { description, selectedCategory, discountValue, startDate, endDate } = req.body;
  if(discountValue>50){
    req.flash('error','offer should be below 50 %')
    return res.redirect('/admin/addCategoryOffer')
  }
  const categoryOffer = new CategoryOffer({
    description: description,
    discountValue: discountValue,
    startDate: startDate,
    endDate: endDate,
    categoryId: selectedCategory,
  });

  await categoryOffer.save();
  res.redirect('/admin/category-offers');
} catch (error) {
  console.log(error.message);
  res.status(500).send("Internal Server Error");
}
}




const removeCategoryOffer = async(req,res)=>{
  try{
 const {offerId} = req.params

 const categroyWithId = await CategoryOffer.findById(offerId)

 await categroyWithId.deleteOne()
 res.json(200)
  }catch(error){
    console.log(error.message)
  }
}


const loadDashboard = async (req, res) => {
  try {
    // Fetch all orders
    const allOrders = await Order.find();

    let deliveredOrders = [];
    let returnedOrders = [];
    let cancelledOrders = [];

    let totalRevenue = 0;
    let currentMonthEarnings = 0;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    allOrders.forEach(order => {
      const orderDate = new Date(order.orderDate);

      order.orderedItem.forEach(item => {
        if (item.status === 'delivered') {
          deliveredOrders.push(order);
        } else if (item.status === 'returned') {
          returnedOrders.push(order);
        } else if (item.status === 'cancelled') {
          cancelledOrders.push(order);
        }

        if (item.status !== 'cancelled' && item.status !== 'returned') {
          totalRevenue += item.priceAtPurchase * item.quantity;
          if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
            currentMonthEarnings += item.priceAtPurchase * item.quantity;
          }
        }
      });
    });

    // Calculate total number of orders, including all statuses
    const totalOrders = allOrders.length;

    // Calculate returns and cancellations
    const totalReturns = returnedOrders.length;
    const totalCancellations = cancelledOrders.length;

    // Prepare chart data including delivered, returned, and cancelled items
    const chartData = {
      sales: {
        labels: ['Total Revenue'],
        data: [totalRevenue]
      },
      orders: {
        labels: ['Delivered', 'Returned', 'Cancelled'],
        data: [deliveredOrders.length, returnedOrders.length, cancelledOrders.length]
      },
      totalOrders: totalOrders
    };

    // Render dashboard view
    res.render('dashboard', {
      deliveredOrders,
      totalOrders,
      totalRevenue,
      totalReturns,
      totalCancellations,
      monthlyEarning: currentMonthEarnings,
      chartData: JSON.stringify(chartData)
    });
  } catch (error) {
    console.log("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
};





const generateData = async (req, res) => {
  const reportType = req.query.reportType;
  try {
    const totalOrders = await Order.countDocuments();
    const now = new Date();
    let labels = [];
    let salesData = [];
    let ordersData = [];

    switch (reportType) {
      case 'daily':
        // Logic for daily data
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        for (let i = 0; i < 24; i++) {
          const startHour = new Date(now);
          startHour.setHours(i, 0, 0, 0);
          const endHour = new Date(now);
          endHour.setHours(i + 1, 0, 0, 0);

          const orders = await Order.find({
            createdAt: { $gte: startHour, $lt: endHour }
          });

          ordersData.push(orders.length);
          salesData.push(orders.reduce((sum, order) => sum + order.orderAmount, 0));
        }
        break;

      case 'weekly':
        // Logic for weekly data
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

          const startDay = new Date(date);
          startDay.setHours(0, 0, 0, 0);
          const endDay = new Date(date);
          endDay.setHours(23, 59, 59, 999);

          const orders = await Order.find({
            createdAt: { $gte: startDay, $lte: endDay }
          });

          ordersData.push(orders.length);
          salesData.push(orders.reduce((sum, order) => sum + order.orderAmount, 0));
        }
        break;

      case 'monthly':
        // Logic for monthly data
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          labels.push(i.toString());

          const startDay = new Date(date);
          startDay.setHours(0, 0, 0, 0);
          const endDay = new Date(date);
          endDay.setHours(23, 59, 59, 999);

          const orders = await Order.find({
            createdAt: { $gte: startDay, $lte: endDay }
          });

          ordersData.push(orders.length);
          salesData.push(orders.reduce((sum, order) => sum + order.orderAmount, 0));
        }
        break;

      case 'yearly':
        // Logic for yearly data
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          labels.push(date.toLocaleDateString('en-US', { month: 'short' }));

          const startMonth = new Date(now.getFullYear(), i, 1);
          const endMonth = new Date(now.getFullYear(), i + 1, 0);

          const orders = await Order.find({
            createdAt: { $gte: startMonth, $lte: endMonth }
          });

          ordersData.push(orders.length);
          salesData.push(orders.reduce((sum, order) => sum + order.orderAmount, 0));
        }
        break;

      default:
        break;
    }

    const data = {
      sales: { labels: labels, data: salesData },
      orders: { labels: labels, data: ordersData },
      totalOrders: totalOrders
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Error fetching dashboard data');
  }
};



const renderReturnRequest = async(req,res)=>{
  try{
   
  const returnRequests= await Order.find({ 'orderedItem.status': 'Return requested' })
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




module.exports = {
    renderLogin,
    verifyLogin,
    loadLogin,
    loadDashboard,
    renderCustomer,
    blockUser,
    unblockUser,
    renderCategory,
    renderAddCategory,
    insertCategory,
    renderEditCategory,
    updateCategory,
    listCategory,
    unlistCategory,
    renderProducts,
    renderAddProducts,
    insertProducts,
    listProduct,
    unlistProduct,
    renderEditProduct,
    updateProduct,
    orderDetails,
    renderOrders,
    updateOrderStatus,
    renderSalesReport,
    downloadSalesReport,
    renderCoupons,
    addCoupons,
    removeCoupon,
    renderOffers,
    addOffer,
    addProductOffer,
    removeProductOffer,
    renderCategoryOffer,
    renderAddCategoryOffer,
    AddCategoryOffer,
    removeCategoryOffer,
    generateData,
    renderReturnRequest,
    acceptReturn
  

};
