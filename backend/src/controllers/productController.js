const Product = require("../models/Product");
const Order = require("../models/Order");
const Category = require("../models/Category");

  exports.getProducts = async (req, res) => {
    try {
      const { category, search, minPrice, maxPrice, sortBy, page = 1, limit = 9 } = req.query;

      const filter = { isSelling: true }; 

      let sortOption = { createdAt: -1 }; // mặc định mới nhất

      switch (sortBy) {
        case "name-asc":
          sortOption = { name: 1 };
          break;
        case "name-desc":
          sortOption = { name: -1 };
          break;
        case "price-asc":
          sortOption = { price: 1 };
          break;
        case "price-desc":
          sortOption = { price: -1 };
          break;
        case "rating":
          sortOption = { rating: -1 };
          break;
      }

      if (category && category !== "all") {
        filter.category = category;
      }
      
      if (search && search.trim() !== "") {
        const escapedKeyword = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.name = { $regex: escapedKeyword, $options: "i" };
      }

      if (minPrice || maxPrice) {
        filter.price = {};

        if (minPrice) {
          filter.price.$gte = Number(minPrice);
        }

        if (maxPrice) {
          filter.price.$lte = Number(maxPrice);
        }
      }
      const skip = (Number(page) - 1) * Number(limit);

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate("category", "name _id") 
          .select("-__v") // bỏ field không cần thiết
          .sort(sortOption)
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

  exports.getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  };

  exports.createProduct = async (req, res) => {
    try {
      let imageUrls = [];

      // 🔥 Nếu có upload ảnh
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => file.path);
      }

      // 🔥 Nếu frontend gửi images dạng JSON
      if (!imageUrls.length && req.body?.images) {
        imageUrls = Array.isArray(req.body.images)
          ? req.body.images
          : [req.body.images];
      }

      const product = await Product.create({ ...req.body, images: imageUrls });

      res.status(201).json(product);

    } catch (error) {
      console.error("Create product error:");
      console.error(error);
      res.status(500).json({
        message: error.message
      });
    }
  };

exports.updateProduct = async (req, res) => {
  try {
    console.log(req.body)
    console.log(req.files)
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    let imageUrls = [...product.images]; 

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      imageUrls = [...imageUrls, ...newImages];
    }

    if (!req.files?.length && req.body?.images) {
      imageUrls = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
    }

    const updateData = { ...req.body, images: imageUrls };

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

  exports.deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      // 🔥 Kiểm tra có order chưa hoàn thành chứa sản phẩm này không
      const activeOrder = await Order.findOne({
        status: { $in: ["pending", "confirmed"] },
        "items.product": id
      });

      // Nếu có order chưa hoàn thành
      if (activeOrder) {
        product.isSelling = false;
        await product.save();

        return res.status(400).json({
          success: false,
          message:
            "Product is in active orders. Selling disabled instead of deleting."
        });
      }

      if (product.isSelling) {
        product.isSelling = false;
        await product.save();

        return res.status(400).json({
          success: false,
          message:
            "Product is currently selling. Selling disabled instead of deleting."
        });
      }

      await Product.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Product permanently deleted"
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };

  exports.updateStatus = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      // 🔥 Đảo trạng thái
      product.isSelling = !product.isSelling;

      await product.save();

      res.status(200).json({
        success: true,
        message: `Product is now ${product.isSelling ? "selling" : "stopped"}`,
        isSelling: product.isSelling
      });

    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };

  exports.importProducts = async (req, res) => {
    try {
      const { products: productsPayload } = req.body;
      if (!Array.isArray(productsPayload) || productsPayload.length === 0) {
        return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ" });
      }
      const created = [];
      for (const row of productsPayload) {
        const { name, category, description, price, discount, stock, useFors, uses, sideEffects } = row;
        if (!name || !category) continue;
        const cat = await Category.findById(category);
        if (!cat) continue;
        const product = await Product.create({
          name: String(name).trim(),
          category: cat._id,
          description: description ? String(description) : "",
          price: Number(price) || 0,
          discount: Number(discount) || 0,
          stock: Number(stock) || 0,
          useFors: useFors ? String(useFors) : "",
          uses: uses ? String(uses) : "",
          sideEffects: sideEffects ? String(sideEffects) : "",
          images: [],
        });
        created.push(product._id);
      }
      res.status(201).json({ message: `Đã thêm ${created.length} sản phẩm`, count: created.length, ids: created });
    } catch (error) {
      console.error("Import products error:", error);
      res.status(500).json({ message: error.message || "Lỗi nhập sản phẩm" });
    }
  };