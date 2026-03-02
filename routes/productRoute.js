const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const { 
  createProduct, getProducts, getProduct, updateProduct, deleteProduct, getDeletedProducts, restoreProduct, deleteCategoryProducts
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authmiddleware");

// CRUD routes
router.post("/", protect, admin, upload.array("images", 5), createProduct);
router.get("/", getProducts); // keep public
router.get("/deleted/list", protect, admin, getDeletedProducts);
router.delete("/deletecategory/:category", protect, admin, deleteCategoryProducts);
router.get("/:id", getProduct); // keep public
router.put("/:id", protect, admin, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.patch("/:id/restore", protect, admin, restoreProduct);

module.exports = router;
