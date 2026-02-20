const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 10 } = req.query;

    const filter = { isSelling: true }; 

    if (category && category !== "all") {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      }
    }
    
    if (keyword) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escapedKeyword, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name _id") 
        .select("-__v") // bỏ field không cần thiết
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(), // giảm RAM
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      products
    });

  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
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
