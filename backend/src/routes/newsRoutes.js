const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newController");

const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload");

// public
router.get("/", newsController.getAllNews);
router.get("/slug/:slug", newsController.getNewsBySlug);
router.get("/:id", newsController.getAllNewsById);
router.post("/:id/like", newsController.likeNews);

// admin
router.post("/import", auth, admin, newsController.importNews);

router.post("/", auth, admin,   
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]), newsController.createNews);

router.put("/:id", auth, admin, 
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]), newsController.updateNews);
  
router.delete("/:id", auth, admin, newsController.deleteNews);

module.exports = router;