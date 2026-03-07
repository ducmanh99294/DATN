const News = require("../models/News");
const Category = require("../models/Category");
const slugify = require("slugify");

//create
exports.createNews = async (req, res) => {
  console.log("file:", req.file);
  console.log("files:", req.files);
  try {
    const { title, summary, content, category } = req.body;

    // kiểm tra category tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {1
      return res.status(400).json({ message: "Category không tồn tại" });
    }
    
    const thumbnail =
      req.files?.thumbnail?.[0]?.path || null;

    const imageUrls =
      req.files?.images?.map(file => file.path) || [];

    const slug = slugify(title, { lower: true, strict: true });

    const news = await News.create({
      title,
      slug,
      summary,
      content,
      category,
      thumbnail,
      images: imageUrls,
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
    const { page = 1, limit = 10, status, date, category, search } = req.query;
        const query = {};
    
        //Lọc theo trạng thái
        if (status && status !== "all") {
          query.status = status;
        }
    
        if (category && category !== "all") {
          query.category = category;
        }

        if (date && date !== "all") {
          let startDate;
          const now = new Date();
    
          if (date === "today") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          }
    
          if (date === "7days") {
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
          }
    
          if (date === "30days") {
            startDate = new Date();
            startDate.setDate(now.getDate() - 30);
          }
    
          if (date === "thisMonth") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          }
    
          if (startDate) {
            query.createdAt = { $gte: startDate };  // 🔥 đúng phải là createdAt
          }
        }
    
        // tìm theo mã đơn hoặc tên người dùng
        if (search && search.trim() !== "") {
    
          const users = await User.find({
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } }
            ]
          }).select("_id");
    
          const userIds = users.map(user => user._id);
    
            query.$or = [
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$_id" },
                  regex: search,
                  options: "i"
                }
              }
            },
    
            { user: { $in: userIds } },
            { title: { $regex: search, $options: "i" } }
          ];
        }
    
      const skip = (page - 1) * limit;
    
    const news = await News.find(query)
      .populate("author", "fullName")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments({ isPublished: true });

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      news,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllNewsById = async (req, res) => {
  try {
    const news = await News.find({ _id: req.params.id })
      .populate("author", "fullName")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.json(news);
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

    // kiểm tra category
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Category không tồn tại" });
      }
      news.category = category;
    }

    // update title + slug
    if (title) {
      news.title = title;
      news.slug = slugify(title, { lower: true, strict: true });
    }

    // update các field khác
    news.summary = summary ?? news.summary;
    news.content = content ?? news.content;
    news.isPublished = isPublished ?? news.isPublished;

    if (req.files?.thumbnail?.length > 0) {
      news.thumbnail = req.files.thumbnail[0].path;
    }

    if (req.files?.images?.length > 0) {
      news.images = req.files.images.map(file => file.path);
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

//Like bài viết
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

// Import tin tức từ Excel (admin)
exports.importNews = async (req, res) => {
  try {
    const { news: newsPayload } = req.body;
    if (!Array.isArray(newsPayload) || newsPayload.length === 0) {
      return res.status(400).json({ message: "Dữ liệu tin tức không hợp lệ" });
    }
    const created = [];
    for (const row of newsPayload) {
      const { title, summary, content, category } = row;
      if (!title || !category) continue;
      const categoryExists = await Category.findById(category);
      if (!categoryExists) continue;
      const slug = slugify(String(title), { lower: true, strict: true });
      const news = await News.create({
        title: String(title).trim(),
        slug,
        summary: summary ? String(summary) : "",
        content: content ? String(content) : "",
        category: categoryExists._id,
        author: req.user?.id,
        thumbnail: "",
        images: [],
      });
      created.push(news._id);
    }
    res.status(201).json({ message: `Đã thêm ${created.length} tin tức`, count: created.length, ids: created });
  } catch (error) {
    console.error("Import news error:", error);
    res.status(500).json({ message: error.message || "Lỗi nhập tin tức" });
  }
};