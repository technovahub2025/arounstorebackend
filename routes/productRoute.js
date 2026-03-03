const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const { 
  createProduct, getProducts, getProduct, updateProduct, deleteProduct, getDeletedProducts, restoreProduct, deleteCategoryProducts, permanentDeleteProduct, bulkPermanentDeleteProducts
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authmiddleware");

// CRUD routes
router.post("/", protect, admin, upload.array("images", 5), createProduct);
router.get("/", getProducts); // keep public
router.get("/deleted/list", protect, admin, getDeletedProducts);
router.delete("/deleted/permanent", protect, admin, bulkPermanentDeleteProducts);
router.delete("/deletecategory/:category", protect, admin, deleteCategoryProducts);
router.get("/:id", getProduct); // keep public
router.put("/:id", protect, admin, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.patch("/:id/restore", protect, admin, restoreProduct);
router.delete("/:id/permanent", protect, admin, permanentDeleteProduct);

module.exports = router;
