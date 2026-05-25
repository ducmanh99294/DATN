const mongoose = require("mongoose");

const newsViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
    },

    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

newsViewSchema.index({
  userId: 1,
  newsId: 1,
});

// tự xóa sau 8 giờ
newsViewSchema.index(
  { viewedAt: 1 },
  {
    expireAfterSeconds: 3600,
  }
);

module.exports = mongoose.model(
  "NewsView",
  newsViewSchema
);