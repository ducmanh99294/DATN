const express = require("express");
const router = express.Router();

const {
  getSlotsByDoctorAndDate,
  generateDoctorSlots,
  createTimeSlot,
  getSlotsByDoctorAndWeek,
  deleteTimeSlot,
  updateStatusTimeSlot,
  releaseSlot,
  holdSlot
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
router.put("/:id",  auth, doctor, updateStatusTimeSlot);
router.delete("/:id", auth, deleteTimeSlot);
router.put("/release/:id", auth, releaseSlot);
router.put("/hold/:id", auth, holdSlot);
module.exports = router;
