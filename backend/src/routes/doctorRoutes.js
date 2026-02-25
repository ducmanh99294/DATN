const express = require("express");
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// middleware giả định
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const doctor = require("../middlewares/doctorMiddleware");

// Admin tạo hồ sơ bác sĩ
router.post(
  '/',
  auth,
  admin,
  doctorController.createDoctorProfile
);

// Lấy danh sách bác sĩ (public)
router.get('/', doctorController.getAllDoctorProfiles);

// Lấy chi tiết bác sĩ
router.get('/:userId', doctorController.getDoctorProfileByUserId);

// Lấy bác sĩ theo chuyên khoa
router.get('/specialty/:specialtyId', doctorController.getDoctorsBySpecialty);

// Admin cập nhật hồ sơ
router.put(
  '/:id',
  auth,
  doctor,
  doctorController.updateDoctorProfile
);

// Admin bật / tắt bác sĩ
router.patch(
  '/:id/toggle-status',
  auth,
  admin,
  doctorController.toggleDoctorStatus
);

module.exports = router;
