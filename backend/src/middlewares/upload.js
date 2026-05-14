const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/** Một storage Cloudinary: folder mặc định products; đặt req.cloudinaryFolder trước middleware upload để đổi (vd: prescriptions). */
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: req.cloudinaryFolder || "products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Gắn trước upload.single khi muốn lưu vào folder `prescriptions` (cùng config Cloudinary). */
upload.prescriptionsFolder = (req, res, next) => {
  req.cloudinaryFolder = "prescriptions";
  next();
};

module.exports = upload;
