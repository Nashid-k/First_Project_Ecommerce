const Category = require("../models/categoryModel");
const Products = require("../models/productModel");
const renderCategory = async (req, res) => {
    try {
        const categoryData = await Category.find();

        return res.render("category", { categoryData });
    } catch (error) {
      return res.status(500).send({ error: "Internal server error" });
    }
};

const renderAddCategory = async (req, res) => {
    try {
        const categoryData = await Category.find();

        return res.render("addcategory");
    } catch (error) {
      return res.status(500).send({ error: "Internal server error" });
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
      name: normalizedName, 
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


    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      _id: { $ne: id } 
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      { name: normalizedName }, 
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
  
    return res.status(500).json({ error: "An error occurred while updating the category" });
  }
};

const updateCategoryAndProducts = async (categoryId, update) => {
  try {
      const categoryData = await Category.findByIdAndUpdate(
          categoryId,
          { $set: update },
          { new: true }
      );

      if (!categoryData) {
          throw new Error("Category not found");
      }

      const updatedProducts = await Products.updateMany(
          { category: categoryId },
          { $set: update }
      );

      return { category: categoryData, message: "Category and associated products updated successfully" };
  } catch (error) {
      throw new Error(`Error updating category and products: ${error.message}`);
  }
};


const listCategory = async (req, res) => {
  try {
      const { categoryId } = req.body;
      const result = await updateCategoryAndProducts(categoryId, { is_listed: true });
      res.status(200).json({ category: result.category, success: result.message });
  } catch (error) {

      res.status(500).json({ error: "Internal server error" });
  }
};


const unlistCategory = async (req, res) => {
  try {
      const { categoryId } = req.body;
      const result = await updateCategoryAndProducts(categoryId, { is_listed: false });
      res.status(200).json({ category: result.category, success: result.message });
  } catch (error) {

      res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = {
    renderCategory,
    renderAddCategory,
    insertCategory,
    renderEditCategory,
    updateCategory,
    listCategory,
    unlistCategory,
}