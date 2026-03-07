const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");

// public
router.get("/", faqController.getAllFaqs);

module.exports = router;
