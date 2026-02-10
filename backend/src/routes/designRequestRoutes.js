const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/designRequestController");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

// guest / user
router.post("/", ctrl.createDesignRequest);

// admin
router.get("/", auth, admin, ctrl.getDesignRequests);
router.get("/:id", auth, ctrl.getDesignRequestById);
router.put("/:id", auth, admin, ctrl.updateDesignRequest);
router.delete("/:id", auth, admin, ctrl.deleteDesignRequest);

module.exports = router;
