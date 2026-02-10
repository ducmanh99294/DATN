const express = require("express");
const router = express.Router();
const contactCtrl = require("../controllers/contactController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

// Guest & User
router.post("/", contactCtrl.createContact);

// Admin
router.get("/", auth, admin, contactCtrl.getContacts);
router.get("/:id", auth, admin, contactCtrl.getContactById);
router.put("/:id", auth, admin, contactCtrl.updateContact);
router.delete("/:id", auth, admin, contactCtrl.deleteContact);

module.exports = router;
