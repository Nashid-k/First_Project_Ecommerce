const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const moment = require('moment');
const productsUpload = require("../middlewares/productConfig");
const Order=require('../models/orderModel')



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
          req.session.isAdmin = true;  // Add a flag to indicate admin login
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
  

  const loadDashboard = async (req, res) => {
    try {
      if (!req.session.isAdmin) {
        return res.redirect("/admin/login");  
      }
      res.set('Cache-control', 'no-store')
      const adminName = req.session.adminId ? (await User.findById(req.session.adminId)).name : "Admin";
      return res.render("dashboard", { adminName });
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
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { block: true } }, { new: true });
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
        const { name } = req.body;
        const inputCat = name.trim().toLowerCase().replace(/\s+/g, "");

        if (inputCat === "") {
            req.flash("error", "Category name cannot be empty. Please enter a valid name.");
            return res.redirect("/admin/addcategory");
        }

        const existingCategory = await Category.findOne({ name: inputCat });

        if (existingCategory) {
            req.flash("error", "Category already exists.");
            return res.redirect("/admin/addcategory");
        }
        const uploadedImageName = req.file?req.file.filename:''

        const category = new Category({ name,categoryImage: uploadedImageName });
        const categoryData = await category.save();

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
        const { name } = req.body;

        const existingCategory = await Category.findOne({name})
        if(existingCategory){
          
            return res.status(400).json({ error: "Category allready exist" });
        }

        // Check for empty spaces, numbers, and special characters
        // if (/\s|[0-9~`!@#$%^&*()_\-+={}[\]:;"'<>,.?/\\|]+/.test(name)) {
        //     return res.status(400).json({ error: "Invalid category name. Please enter a valid name." });
        // }

        if (!name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });

        if (updatedCategory) {
            req.flash("success", "Category updated successfully!"); // Set flash message
            return res.status(200).json({ message: "Category updated successfully", redirect: "/admin/category" });
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
   
        const { name, description, price, quantity, size, category } = req.body;
    
        const existingProduct = await Products.findOne({ name: name.trim().toLowerCase() });
        if (existingProduct) {
          req.flash('error', 'Product already exists');
          return res.redirect('/admin/addproduct');
        }
    
        const uploadedImageName = req.files.mainImage ? req.files.mainImage[0].filename : '';
        const uploadedScreenshots = req.files.screenshots ? req.files.screenshots.map(file => file.filename) : [];
    
        const newProduct = new Products({
          name,
          description,
          price,
          mainImage: uploadedImageName,
          screenshots: uploadedScreenshots,
          quantity,
          size,
          category
        });
    
        const productData = await newProduct.save();
        req.flash('success', 'Product added successfully');
        res.redirect('/admin/products');
      } catch (error) {
        console.log(error.message);
        req.flash('error', 'An error occurred while adding the product');
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

 
// const renderEditProduct = async (req, res) => {
//     try {
//       const productId = req.query.id;
//       const productData = await Products.findById(productId).populate('category');
  
//       if (productData) {
       
//         if (productData.mainImageFile) {
//           const imagePath = path.join(__dirname, 'uploads', productData.mainImageFile);
//           const imageData = fs.readFileSync(imagePath);
//           productData.mainImage = `data:image/jpeg;base64,${imageData.toString('base64')}`;
//         }
  
//         const categoryData = await Category.find();
//         res.render('editproduct', { productData, categoryData });
//       } else {
//         req.flash('error', 'Product not found');
//         res.redirect('/admin/products');
//       }
//     } catch (error) {
//       console.log(error.message);
//       req.flash('error', 'An error occurred while fetching the product');
//       res.redirect('/admin/products');
//     }
//   };
  



const renderEditProduct = async (req, res) => {
    try {
      const productId = req.query.id;
      const productData = await Products.findById(productId).populate('category');
  
      if (productData) {
        const categoryData = await Category.find(); // Fetch category data
        res.render('editproduct', { productData, categoryData }); // Pass both productData and categoryData to the template
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
        const { productId, name, category, description, quantity, price, size, mainImage, screenshots } = req.body;

        // Check if the product exists
        const existingProduct = await Products.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Update the product details
        existingProduct.name = name;
        existingProduct.category = category;
        existingProduct.description = description;
        existingProduct.quantity = quantity;
        existingProduct.price = price;
        existingProduct.size = size;

        // Update main image if provided
        if (mainImage) {
            existingProduct.mainImage = mainImage;
        }

        // Update screenshots if provided
        if (screenshots) {
            existingProduct.screenshots = screenshots;
        }

        // Save the updated product
        const updatedProduct = await existingProduct.save();

        // Redirect to the product page with a success message
        req.flash("success", "Product updated successfully");
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error.message);
        req.flash("error", "An error occurred while updating the product");
        res.redirect("/admin/products");
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
    
    const { orderId, orderStatus } = req.body;
 
    console.log(`order id ${orderId} is ${orderStatus}`);
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.orderStatus = orderStatus;
        await order.save();
        res.status(200).json({ message: 'Order status updated successfully'});
        // res.redirect('/admin/orderDetails');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}



  const orderDetails = async (req, res) => {
    try {
      const orderId = req.query.orderId;
      const order = await Order.findById(orderId).populate("orderedItem.productId").populate('userId');
      if (!order) {
        return res.status(404).send("Order not found");
      }
      res.render('orderDetails', { order });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
  
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


};
