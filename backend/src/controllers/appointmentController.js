const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, specialtyId, slotId, symptoms, description, duration } = req.body;
    const patientId = req.user.id;

    // 1. Kiểm tra slot
    const slot = await TimeSlot.findOne({
      _id: slotId,
      status: "available",
    });

    if (!slot) {
      return res.status(400).json({
        message: "Khung giờ không còn trống",
      });
    }

    // 2. Tạo appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      specialtyId,
      slotId,
      symptoms, 
      description, 
      duration,
    });

    // 3. Cập nhật slot
    slot.status = "booked";
    slot.appointmentId = appointment._id;
    await slot.save();

    res.status(201).json({
      message: "Đặt lịch thành công",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Đặt lịch thất bại",
      error: error.message,
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {reason} = req.body

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // trả slot về available
    await TimeSlot.findByIdAndUpdate(appointment.slotId, {
      status: "available",
      appointmentId: null,
    });

    res.json({ message: "Đã huỷ lịch hẹn" });
  } catch (error) {
    res.status(500).json({ message: "Huỷ lịch thất bại" });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    await Appointment.findByIdAndUpdate(id, {
      status: "completed",
    });

    res.json({ message: "Lịch khám đã hoàn thành" });
  } catch (error) {
    res.status(500).json({ message: "Cập nhật thất bại" });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId")
      .populate("specialtyId")
      .populate("slotId")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Không lấy được lịch hẹn" });
  }
};
