const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");
const Doctor = require("../models/Doctor");
const {sendNotification} = require("../sockets");

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, specialtyId, slotId, symptoms, description, patientId } = req.body;

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
      price: doctorId.price, 
    })
    .populate("userId")
    .populate({
      path: "doctorId",
      populate: { path: "userId" }
    })
    .populate("slotId");

    // 3. Cập nhật slot
    slot.status = "booked";
    slot.appointmentId = appointment._id;
    await slot.save();

        // thong bao user
    sendNotification(appointment.userId._id, {
      type: "appointment_created",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã được tạo thành công`,
    });

    // thong bao dôctr
    sendNotification(appointment.doctorId.userId._id, {
      type: "appointment_created",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã được tạo thành công`,
    });

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

    const appointment = await Appointment.findById(id)
    .populate("userId")
    .populate({
      path: "doctorId",
      populate: { path: "userId" }
    })
    .populate("slotId");
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

    // thong bao user
    sendNotification(appointment.userId._id, {
      type: "appointment_cancelled",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã bị huỷ. Lý do: ${reason}`,
    });

    // thong bao dôctr
    sendNotification(appointment.doctorId.userId._id, {
      type: "appointment_cancelled",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã bị huỷ. Lý do: ${reason}`,
    });

    res.json({ message: "Đã huỷ lịch hẹn" });
  } catch (error) {
    res.status(500).json({ message: "Huỷ lịch thất bại" });
  }
};

exports.confirmedAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    await Appointment.findByIdAndUpdate(id, {
      status: "confirmed",
    })
    .populate("userId")
    .populate({
      path: "doctorId",
      populate: { path: "userId" }
    })
    .populate("slotId");

    // thong bao user
    sendNotification(appointment.userId._id, {
      type: "appointment_confirmed",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã được xác nhận`,
    });

    // thong bao dôctr
    sendNotification(appointment.doctorId.userId._id, {
      type: "appointment_confirmed",
      message: `Lịch hẹn ngày ${appointment.slotId.date} đã được xác nhận`,
    });
    res.json({ message: "Lịch khám đã được xác nhận" });
  } catch (error) {
    res.status(500).json({ message: "Cập nhật thất bại" });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "image fullName email"
        }
      })
      .populate("specialtyId")
      .populate("slotId")
      .populate("patientId")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Không lấy được lịch hẹn" });
  }
};

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ JWT

    // tìm doctor theo userId
    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    doctorId = doctor._id;

    const appointments = await Appointment.find({ doctorId })
      .populate("patientId")
      .populate("specialtyId")
      .populate("slotId")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Không lấy được lịch hẹn" });
  }
};
