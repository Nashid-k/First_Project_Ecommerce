const User = require("../models/userModel");
const Products = require("../models/productModel");
const Category = require("../models/categoryModel");
const WishlistItem = require("../models/wishlistModel");
const ProductOffer = require("../models/productOffer");
const CategoryOffer = require("../models/categoryOffer");



const renderHome = async (req, res) => {
  try {
    const categories = await Category.find({ is_listed: true });
    const unblockedCategoryIds = categories.map((category) => category._id);

    const productData = await Products.find({
      is_listed: true,
      category: { $in: unblockedCategoryIds },
    });

    const currentProductOffers = await ProductOffer.find();
    const currentCategoryOffers = await CategoryOffer.find();

    const newLabelCountdownDays = 3;

    const calculateDiscountedPrice = (productPrice, discountPercent) => {
      let discountedPrice =
        productPrice - (productPrice * discountPercent) / 100;
      return Math.round(discountedPrice);
    };

    const getOfferTime = (startDate, endDate) => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now < start) {
        return { status: "not_started", timeLeft: null, endDate };
      } else if (now > end) {
        return { status: "ended", timeLeft: null, endDate };
      } else {
        const timeDifference = end - now;
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
        return {
          status: "active",
          timeLeft: { days, hours, minutes, seconds },
          endDate,
        };
      }
    };

    const modifiedProductData = await Promise.all(
      productData.map(async (product) => {
        const isOutOfStock = product.quantity === 0;
        const createdAt = new Date(product.createdAt);
        const today = new Date();
        const daysDifference = Math.floor(
          (today - createdAt) / (1000 * 60 * 60 * 24)
        );
        const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

        const productOffer = currentProductOffers.find(
          (offer) => offer.productId.toString() === product._id.toString()
        );

        let discountedPrice = product.price;
        let discountPercent = 0;
        let offerTime = null;

        if (productOffer) {
          offerTime = getOfferTime(
            productOffer.startDate,
            productOffer.endDate
          );
          if (offerTime.status === "active") {
            discountPercent = productOffer.discountValue;
            discountedPrice = calculateDiscountedPrice(
              product.price,
              discountPercent
            );
          }
        }

        const category = categories.find(
          (cat) => cat._id.toString() === product.category.toString()
        );
        if (category) {
          const categoryOffer = currentCategoryOffers.find(
            (offer) => offer.categoryId.toString() === category._id.toString()
          );
          if (categoryOffer) {
            const categoryOfferTime = getOfferTime(
              categoryOffer.startDate,
              categoryOffer.endDate
            );
            if (
              categoryOfferTime.status === "active" &&
              categoryOffer.discountValue > discountPercent
            ) {
              discountPercent = categoryOffer.discountValue;
              discountedPrice = calculateDiscountedPrice(
                product.price,
                discountPercent
              );
              offerTime = categoryOfferTime;
            }
          }
        }

        product.discount = discountPercent;
        await product.save();

        return {
          ...product.toObject(),
          outOfStock: isOutOfStock,
          isNew,
          discountedPrice,
          offerTime,
          mainImage: `/uploads/products/${product.mainImage}`,
        };
      })
    );

    const modifiedCategoryOffers = currentCategoryOffers
      .map((offer) => {
        const offerCategory = categories.find(
          (category) => offer.categoryId.toString() === category._id.toString()
        );
        if (offerCategory) {
          const randomProduct = productData.find(
            (product) =>
              product.category.toString() === offerCategory._id.toString()
          );
          const offerTime = getOfferTime(offer.startDate, offer.endDate);
          return {
            ...offer.toObject(),
            offerTime,
            randomProductImage: randomProduct
              ? `/uploads/products/${randomProduct.mainImage}`
              : null,
          };
        }
        return null;
      })
      .filter((offer) => offer !== null && offer.offerTime.status === "active");

    const renderData = {
      productData: modifiedProductData,
      categories,
      currentProductOffers,
      modifiedCategoryOffers,
    };

    if (req.session.userId) {
      const userData = await User.findById(req.session.userId);

      if (userData && userData.block) {
        req.session.destroy((err) => {
          if (err) {
          
            return res.status(500).send({ message: "Internal server error" });
          }
          res.redirect("/login");
        });
      } else {
        renderData.userData = userData;
        res.render("home", renderData);
      }
    } else {
      res.render("home", renderData);
    }
  } catch (error) {

    res.status(500).send({ message: "Internal server error" });
  }
};

const renderShop = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = userId ? await User.findById(userId) : null;

    const categories = await Category.find({ is_listed: true });

    const unblockedCategoryIds = categories.map((category) => category._id);

    const productData = await Products.find({
      is_listed: true,
      category: { $in: unblockedCategoryIds },
    });

    const currentProductOffers = await ProductOffer.find();
    const currentCategoryOffers = await CategoryOffer.find();

    const newLabelCountdownDays = 3;

    const calculateDiscountedPrice = (productPrice, discountPercent) => {
      let discountedPrice =
        productPrice - (productPrice * discountPercent) / 100;
      return Math.round(discountedPrice);
    };

    const modifiedProductData = await Promise.all(
      productData.map(async (product) => {
        const isOutOfStock = product.quantity === 0;
        const createdAt = new Date(product.createdAt);
        const today = new Date();
        const daysDifference = Math.floor(
          (today - createdAt) / (1000 * 60 * 60 * 24)
        );
        const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

        const productOffer = currentProductOffers.find(
          (offer) => offer.productId.toString() === product._id.toString()
        );

        let discountedPrice = product.price;
        let discountPercent = 0;

        if (productOffer) {
          discountPercent = productOffer.discountValue;
          discountedPrice = calculateDiscountedPrice(
            product.price,
            discountPercent
          );
        }

        const category = categories.find(
          (cat) => cat._id.toString() === product.category.toString()
        );
        if (category) {
          const categoryOffer = currentCategoryOffers.find(
            (offer) => offer.categoryId.toString() === category._id.toString()
          );
          if (categoryOffer) {
            discountPercent = Math.max(
              discountPercent,
              categoryOffer.discountValue
            );
            discountedPrice = calculateDiscountedPrice(
              product.price,
              discountPercent
            );
          }
        }

        product.discount = discountPercent;
        await product.save();

        const totalReviews = product.reviews.length;
        const averageRating =
          totalReviews > 0
            ? (
                product.reviews.reduce(
                  (acc, review) => acc + review.starRating,
                  0
                ) / totalReviews
              ).toFixed(1)
            : 0;

        return {
          ...product.toObject(),
          outOfStock: isOutOfStock,
          isNew,
          discountedPrice,
          averageRating: parseFloat(averageRating),
          totalReviews,
        };
      })
    );

    const renderData = {
      productData: modifiedProductData,
      categories,
    };

    if (userData) {
      renderData.userData = userData;
    }

    res.render("shop", renderData);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const renderProductDetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = userId ? await User.findById(userId) : null;
    const productId = req.params.productId;
    const product = await Products.findById(productId);

    if (!product) {
   
      return res.render("productDetails", { product: null });
    }

    const productOffer = await ProductOffer.findOne({ productId: product._id });

    const categoryOffer = await CategoryOffer.findOne({
      categoryId: product.category,
    });

    let discountedPrice = null;
    if (productOffer) {
      discountedPrice =
        product.price - (product.price * productOffer.discountValue) / 100;
      discountedPrice = Math.round(discountedPrice);
    }

    if (categoryOffer) {
      let categoryDiscountedPrice =
        product.price - (product.price * categoryOffer.discountValue) / 100;
      categoryDiscountedPrice = Math.round(categoryDiscountedPrice);

      if (!discountedPrice || categoryDiscountedPrice < discountedPrice) {
        discountedPrice = categoryDiscountedPrice;
      }
    }

    let renderData = {
      product,
      discountedPrice,
    };

    if (userData) {
      renderData.userData = userData;
    }

    return res.render("productDetails", renderData);
  } catch (error) {
    
    res.status(500).send("Internal Server Error");
  }
};

const renderWomen = async (req, res) => {
  try {
    const womenCategory = await Category.findOne({ name: "women" });

    if (!womenCategory) {
      return res.status(404).send("Women category not found");
    }

    const productData = await Products.find({
      category: womenCategory._id,
      is_listed: true,
      is_blocked: false,
    }).populate("category");

    const categories = [womenCategory];

    res.render("women", { productData, categories });
  } catch (error) {

    res.status(500).send("Internal Server Error");
  }
};

const renderMens = async (req, res) => {
  try {
    const womenCategory = await Category.findOne({ name: "men" });

    if (!womenCategory) {
      return res.status(404).send("Women category not found");
    }

    const productData = await Products.find({
      category: womenCategory._id,
      is_listed: true,
      is_blocked: false,
    }).populate("category");

    const categories = [womenCategory];

    res.render("women", { productData, categories });
  } catch (error) {

    res.status(500).send("Internal Server Error");
  }
};

const sortProducts = async (req, res) => {
  try {
    const { category, criteria } = req.params;
    const { query, page = 1 } = req.query;
    const limit = 9;
    let filter = { is_listed: true };

  
    if (query) {
      filter.name = { $regex: query, $options: "i" };
    }


    if (category !== "all") {
      const categoryData = await Category.findById(category);
      if (!categoryData || !categoryData.is_listed) {
        return res.status(404).json({ error: "Category not found or not listed" });
      }
      filter.category = category;
    } else {
      const listedCategories = await Category.find({ is_listed: true }).select("_id");
      filter.category = { $in: listedCategories.map((cat) => cat._id) };
    }


    const productData = await Products.find(filter).collation({ locale: "en" });

    
    const newLabelCountdownDays = 3;
    const currentOffers = await ProductOffer.find();
    const currentCategoryOffers = await CategoryOffer.find();


    const modifiedProductData = await Promise.all(
      productData.map(async (product) => {
        const isOutOfStock = product.quantity === 0;
        const createdAt = new Date(product.createdAt);
        const today = new Date();
        const daysDifference = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
        const isNew = daysDifference <= newLabelCountdownDays && !isOutOfStock;

        let discountedPrice = product.price;
        let appliedDiscount = 0;

        const productOffer = currentOffers.find(
          (offer) => offer.productId.toString() === product._id.toString()
        );
        if (productOffer) {
          appliedDiscount = Math.max(appliedDiscount, productOffer.discountValue);
        }

        const categoryOffer = currentCategoryOffers.find(
          (offer) => offer.categoryId.toString() === product.category.toString()
        );
        if (categoryOffer) {
          appliedDiscount = Math.max(appliedDiscount, categoryOffer.discountValue);
        }

        if (appliedDiscount > 0) {
          discountedPrice = Math.ceil(
            product.price - (product.price * appliedDiscount) / 100
          );
        }

        const totalReviews = product.reviews.length;
        const averageRating = totalReviews > 0
          ? (
              product.reviews.reduce((acc, review) => acc + review.starRating, 0) / totalReviews
            ).toFixed(1)
          : 0;

        return {
          ...product.toObject(),
          outOfStock: isOutOfStock,
          isNew,
          discountedPrice,
          discountPercentage: appliedDiscount,
          averageRating: parseFloat(averageRating),
          totalReviews,
        };
      })
    );

   
    let sortOption = {};
    switch (criteria) {
      case "nameAZ":
        sortOption = { name: 1 };
        break;
      case "nameZA":
        sortOption = { name: -1 };
        break;
      case "newArrivals":
        sortOption = { createdAt: -1 };
        break;
      case "priceLowToHigh":
        sortOption = { discountedPrice: 1 };
        break;
      case "priceHighToLow":
        sortOption = { discountedPrice: -1 };
        break;
      case "sizeS":
        filter.size = "small";
        break;
      case "sizeM":
        filter.size = "medium";
        break;
      case "sizeL":
        filter.size = "large";
        break;
    }

   
    const sortedProductData = modifiedProductData.sort((a, b) => {
      if (sortOption.discountedPrice === 1) {
        return a.discountedPrice - b.discountedPrice;
      } else if (sortOption.discountedPrice === -1) {
        return b.discountedPrice - a.discountedPrice;
      } else {
        return 0;
      }
    });

    const totalProducts = sortedProductData.length;
    const totalPages = Math.ceil(totalProducts / limit);


    const paginatedProducts = sortedProductData.slice((page - 1) * limit, page * limit);

    res.json({
      productData: paginatedProducts,
      totalPages: totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};



const calculateDiscountedPrice = async (product) => {
  const currentProductOffers = await ProductOffer.find();
  const currentCategoryOffers = await CategoryOffer.find();
  const categories = await Category.find({ is_listed: true });

  let discountedPrice = product.price;
  let discountPercent = 0;

  const productOffer = currentProductOffers.find(
    (offer) => offer.productId.toString() === product._id.toString()
  );

  if (productOffer) {
    discountPercent = productOffer.discountValue;
    discountedPrice = product.price - (product.price * discountPercent) / 100;
  }

  const category = categories.find(
    (cat) => cat._id.toString() === product.category.toString()
  );
  if (category) {
    const categoryOffer = currentCategoryOffers.find(
      (offer) => offer.categoryId.toString() === category._id.toString()
    );
    if (categoryOffer) {
      discountPercent = Math.max(discountPercent, categoryOffer.discountValue);
      discountedPrice = product.price - (product.price * discountPercent) / 100;
    }
  }

  return {
    discountedPrice: Math.round(discountedPrice),
    discountPercent
  };
};



const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.query;
    const product = await Products.findById(productId);
    
    const { discountedPrice, discountPercent } = await calculateDiscountedPrice(product);

    let wishlistItem = await WishlistItem.findOne({
      userId: userId,
      "product.productId": productId,
    });
    
    if (!wishlistItem) {
      wishlistItem = new WishlistItem({
        userId: userId,
        product: [{
          productId: productId,
          discountedPrice: discountedPrice,
          discountPercent: discountPercent
        }],
      });
    } else {
      wishlistItem.product[0].discountedPrice = discountedPrice;
      wishlistItem.product[0].discountPercent = discountPercent;
    }
    
    await wishlistItem.save();
    res.redirect("/wishlist");
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const renderWishlist = async (req, res) => {
  try {
    if (req.session.userId) {
      const userData = await User.findById(req.session.userId);
      let wishlistItems = await WishlistItem.find({
        userId: req.session.userId,
      }).populate("product.productId");

      // Update prices for each item
      for (let item of wishlistItems) {
        const { discountedPrice, discountPercent } = await calculateDiscountedPrice(item.product[0].productId);
        item.product[0].discountedPrice = discountedPrice;
        item.product[0].discountPercent = discountPercent;
        await item.save();
      }

      res.render("wishlist", {
        wishlistItems: wishlistItems,
        userData: userData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const RemoveFromWishlist = async (req, res) => {
  try {
    const { productId } = req.query;
    if (req.session.userId) {
      await WishlistItem.findOneAndDelete({
        userId: req.session.userId,
        "product.productId": productId,
      });
      res.status(200).json({ message: "Item removed from wishlist" });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {

    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  renderHome,
  renderShop,
  sortProducts,
  renderProductDetails,
  renderWomen,
  renderWishlist,
  addToWishlist,
  RemoveFromWishlist,
  renderMens,
};
