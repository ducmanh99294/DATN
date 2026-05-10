const express = require("express");
const router = express.Router();
const reportCtrl = require("../controllers/reportController");
const auth = require("../middlewares/authMiddleware");

router.get("/", auth, reportCtrl.getReport);

module.exports = router;
