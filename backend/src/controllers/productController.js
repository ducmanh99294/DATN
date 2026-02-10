const Product = require("../models/Product");

/**
 * 📦 GET ALL PRODUCTS (PUBLIC)
 */
exports.getProducts = async (req, res) => {
  const { category, keyword } = req.query;

  const filter = { isActive: true };

  if (category) filter.category = category;
  if (keyword) {
    filter.name = { $regex: keyword, $options: "i" };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
};

/**
 * 🔍 GET PRODUCT DETAIL
 */
exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

/**
 * ➕ ADMIN CREATE PRODUCT
 */
exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

/**
 * ✏️ ADMIN UPDATE PRODUCT
 */
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(product);
};

/**
 * 🛑 ADMIN SOFT DELETE
 */
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false }
  );

  res.json({ message: "Product disabled" });
};
