const DesignRequest = require("../models/DesignRequest");

/**
 * 📝 CREATE DESIGN REQUEST (guest / user)
 */
exports.createDesignRequest = async (req, res) => {
  const {
    name,
    email,
    phone,
    spaceType,
    area,
    style,
    budget,
    message,
    attachments
  } = req.body;

  if (!name || !email || !spaceType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const request = await DesignRequest.create({
    user: req.user?.id || null,
    name,
    email,
    phone,
    spaceType,
    area,
    style,
    budget,
    message,
    attachments
  });

  res.status(201).json({
    message: "Design request submitted successfully",
    data: request
  });
};

/**
 * 📋 ADMIN: GET ALL REQUESTS
 */
exports.getDesignRequests = async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const requests = await DesignRequest.find(filter)
    .populate("user", "email")
    .sort({ createdAt: -1 });

  res.json(requests);
};

/**
 * 🔍 GET DESIGN REQUEST DETAIL
 */
exports.getDesignRequestById = async (req, res) => {
  const request = await DesignRequest.findById(req.params.id)
    .populate("user", "email");

  if (!request) {
    return res.status(404).json({ message: "Design request not found" });
  }

  // user chỉ xem request của mình
  if (
    request.user &&
    request.user._id.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(request);
};

/**
 * ✏️ ADMIN UPDATE STATUS / NOTE
 */
exports.updateDesignRequest = async (req, res) => {
  const { status, adminNote } = req.body;

  const request = await DesignRequest.findByIdAndUpdate(
    req.params.id,
    { status, adminNote },
    { new: true }
  );

  res.json(request);
};

/**
 * 🗑 ADMIN DELETE REQUEST
 */
exports.deleteDesignRequest = async (req, res) => {
  await DesignRequest.findByIdAndDelete(req.params.id);
  res.json({ message: "Design request deleted" });
};
