const Product = require("../models/productModel");
const cloudinary = require("../utils/cloudinary");

// Helper function to upload multiple images
const uploadImages = async (files) => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          ).end(file.buffer);
        })
    )
  );
};

// ✅ CREATE Product
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, rating, category, stock ,mrp,discount} = req.body;

    // Upload images to Cloudinary
    const imageUrls =
      req.files && req.files.length > 0 ? await uploadImages(req.files) : [];

    const product = await Product.create({
      title,
      description,
      price,
      rating,
      category, // single category
      images: imageUrls,
      mrp: mrp ? Number(mrp) : 0,
      discount: discount ? Number(discount) : 0,
      stock: stock ? Number(stock) : 0,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// ✅ READ All Products (with optional category filter)
exports.getProducts = async (req, res) => {
  try {
    const { category, includeDeleted, deletedOnly } = req.query; // optional filter
    const query = {};

    if (category) {
      query.category = category;
    }

    if (deletedOnly === "true") {
      query.isDeleted = true;
    } else if (includeDeleted !== "true") {
      query.isDeleted = { $ne: true };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ✅ READ Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.isDeleted)
      return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ✅ UPDATE Product
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, price, rating, category, stock ,mrp,discount} = req.body;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // Update only provided fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (rating) product.rating = rating;
    if (category) product.category = category;
    if(mrp) product.mrp = Number(mrp);
    if(discount) product.discount = Number(discount);
    if (stock !== undefined) product.stock = Number(stock);

    // Append new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImageUrls = await uploadImages(req.files);
      product.images = product.images.concat(newImageUrls);
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ✅ SOFT DELETE Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.isDeleted) {
      return res.status(400).json({ message: "Product already deleted" });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({ message: "Product moved to deleted list successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ✅ READ deleted products (admin)
exports.getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Error fetching deleted products:", err);
    res.status(500).json({ message: "Failed to fetch deleted products" });
  }
};

// ✅ RESTORE soft deleted product
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isDeleted) {
      return res.status(400).json({ message: "Product is not deleted" });
    }

    product.isDeleted = false;
    product.deletedAt = null;
    await product.save();

    res.json({ message: "Product restored successfully", product });
  } catch (err) {
    console.error("Error restoring product:", err);
    res.status(500).json({ message: "Failed to restore product" });
  }
};

// ✅ SOFT DELETE all products by category
exports.deleteCategoryProducts = async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category || "").trim();
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const result = await Product.updateMany(
      { category, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No active products found in this category" });
    }

    res.json({
      message: "Category products moved to deleted list successfully",
      category,
      affectedProducts: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error deleting category products:", err);
    res.status(500).json({ message: "Failed to delete category products" });
  }
};
