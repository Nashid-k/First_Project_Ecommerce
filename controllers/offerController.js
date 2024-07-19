const User = require("../models/userModel");
const Coupon = require('../models/couponModel')
const ProductOffer = require('../models/productOffer')
const productModel = require("../models/productModel");
const CategoryOffer = require("../models/categoryOffer");
const categoryModel = require("../models/categoryModel");




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
  
 
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        req.flash('error', 'Coupon code already exists');
        return res.redirect('/admin/coupons');
      }
  
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(currentDate.getDate() + parseInt(validity));
  
      if (discountValue > minPurchaseAmount) {
        req.flash('error', 'Discount cannot exceed minimum purchase amount');
        return res.redirect('/admin/coupons');
      }
  
      const newCoupon = new Coupon({
        code,
        discountType,
        discountValue,
        minPurchaseAmount,
        validity: expiryDate
      });
  
      await newCoupon.save();
  
      req.flash('success', 'Coupon added successfully');
      res.redirect('/admin/coupons');
    } catch (error) {
      console.error('Error adding coupon:', error);
      req.flash('error', 'An error occurred while adding the coupon');
      res.redirect('/admin/coupons');
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
    return res.status(500).send({ error: "Internal server error" });
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

module.exports = {
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
}