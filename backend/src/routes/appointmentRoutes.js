const express = require("express");
const router = express.Router();

const {
  createAppointment,
  cancelAppointment,
  completeAppointment,
  getMyAppointments,
} = require("../controllers/appointmentController");

const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

/**
 * Bệnh nhân đặt lịch
 */
router.post("/", auth, createAppointment);

/**
 * Bệnh nhân xem lịch của mình
 */
router.get("/me", auth, getMyAppointments);

/**
 * Huỷ lịch
 */
router.put("/:id/cancel", auth, cancelAppointment);

/**
 * Hoàn thành lịch (admin / bác sĩ)
 */
router.put("/:id/complete", auth, completeAppointment);

module.exports = router;
