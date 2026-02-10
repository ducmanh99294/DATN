const express = require("express");
const router = express.Router();

const {
  getSlotsByDoctorAndDate,
  generateDoctorSlots,
  createTimeSlot,
  getSlotsByDoctorAndWeek,
  deleteTimeSlot
} = require("../controllers/timeSlotController");

const auth = require("../middlewares/authMiddleware");
const doctor = require("../middlewares/doctorMiddleware");

/**
 * Lấy slot theo bác sĩ + ngày
 * ?doctorId=xxx&date=2026-02-01
 */
router.get("/", auth, getSlotsByDoctorAndDate);

// Đặt slot
router.post("/generate", auth, doctor, generateDoctorSlots);
router.post("/",  auth, doctor, createTimeSlot);
router.get("/week", auth, getSlotsByDoctorAndWeek);
router.delete("/:id", auth, deleteTimeSlot);
module.exports = router;
