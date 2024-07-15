
const Category = require("../models/categoryModel");
const Products = require("../models/productModel");





const renderProducts = async (req, res) => {
    try {
        const productData = await Products.find();
        res.render("products", { productData });
    } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
    }
};

const renderAddProducts = async (req, res) => {
    try {
        const categoryData = await Category.find({ is_listed: true });

        res.render("addproduct", { categoryData });
    } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
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
    return res.status(500).send({ error: "Internal server error" });
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

























module.exports={
    renderProducts,
    renderAddProducts,
    insertProducts,
    listProduct,
    unlistProduct,
    renderEditProduct,
    updateProduct,
}