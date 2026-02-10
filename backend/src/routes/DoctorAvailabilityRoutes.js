const express = require("express");
const router = express.Router();

const {
  createAvailability,
  getAvailabilityByDoctor,
  deleteAvailability,
} = require("../controllers/DoctorAvailableController");

const auth = require("../middlewares/authMiddleware");
const doctor = require("../middlewares/doctorMiddleware");

/**
 * Bác sĩ tạo lịch rảnh
 */
router.post("/", auth, doctor, createAvailability);

/**
 * Lấy lịch rảnh theo bác sĩ
 */
router.get("/doctor/:doctorId", auth, getAvailabilityByDoctor);

/**
 * Xóa lịch rảnh
 */
router.delete("/:id", auth, doctor, deleteAvailability);

module.exports = router;
