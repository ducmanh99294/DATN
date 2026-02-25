const News = require("../models/News");
const Category = require("../models/Category");
const slugify = require("slugify");

//create
exports.createNews = async (req, res) => {
  try {
    const { title, summary, content, category } = req.body;

    // kiểm tra category tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category không tồn tại" });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const news = await News.create({
      title,
      slug,
      summary,
      content,
      category,
      thumbnail: req.file ? req.file.filename : undefined,
      author: req.user?.id,
    });

    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get
exports.getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const news = await News.find({ isPublished: true })
      .populate("author", "fullName")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments({ isPublished: true });

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: news,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get by slug
exports.getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({
      slug: req.params.slug,
      isPublished: true,
    })
      .populate("author", "fullName image")
      .populate("category", "name slug");

    if (!news) {
      return res.status(404).json({
        message: "Không tìm thấy bài viết",
      });
    }

    // tăng lượt xem
    news.views += 1;
    await news.save();

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update
exports.updateNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    const { title, summary, content, category, isPublished } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
      news.category = category;
    }

    if (title) {
      news.title = title;
      news.slug = slugify(title, { lower: true, strict: true });
    }

    news.summary = summary ?? news.summary;
    news.content = content ?? news.content;
    news.isPublished = isPublished ?? news.isPublished;

    if (req.file) {
      news.thumbnail = req.file.filename;
    }

    await news.save();

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    res.json({ message: "Xóa bài viết thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🟢 Like bài viết
 */
exports.likeNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    news.like += 1;
    await news.save();

    res.json({
      message: "Đã thích bài viết",
      like: news.like,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};