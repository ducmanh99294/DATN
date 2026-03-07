const express = require("express");
const router = express.Router();

const {
  createAppointment,
  cancelAppointment,
  confirmedAppointment,
  getMyAppointments,
  getAppointmentsByDoctor
} = require("../controllers/appointmentController");

const auth = require("../middlewares/authMiddleware");
const doctor = require("../middlewares/doctorMiddleware");

// Bệnh nhân đặt lịch
router.post("/", auth, createAppointment);

// Bệnh nhân xem lịch của mình
router.get("/me", auth, getMyAppointments);

// bác sĩ xem lịch của mình
router.get("/doctor", auth,doctor, getAppointmentsByDoctor);

// Huỷ lịch
router.put("/:id/cancel", auth, cancelAppointment);

//Hoàn thành lịch (admin / bác sĩ)
router.put("/:id/confirm", auth, confirmedAppointment);


module.exports = router;
