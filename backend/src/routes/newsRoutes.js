const express = require("express");
const router = express.Router();
const newsController = require("../controllers/news.controller");

const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const upload = require("../middlewares/upload");

// public
router.get("/", newsController.getAllNews);
router.get("/:slug", newsController.getNewsBySlug);
router.post("/:id/like", newsController.likeNews);

// admin
router.post("/", auth, admin, upload.single("thumbnail"), newsController.createNews);
router.put("/:id", auth, admin, upload.single("thumbnail"), newsController.updateNews);
router.delete("/:id", auth, admin, newsController.deleteNews);

module.exports = router;