const DoctorAvailability = require("../models/DoctorAvailability");

/**
 * Bác sĩ tạo lịch rảnh
 */
exports.createAvailability = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Thiếu thông tin lịch rảnh",
      });
    }

    const availability = await DoctorAvailability.create({
      doctorId,
      date,
      startTime,
      endTime,
    });

    res.status(201).json({
      message: "Tạo lịch rảnh thành công",
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      message: "Tạo lịch rảnh thất bại",
      error: error.message,
    });
  }
};

/**
 * Lấy lịch rảnh theo bác sĩ
 */
exports.getAvailabilityByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const data = await DoctorAvailability.find({
      doctorId,
      isActive: true,
    }).sort({ date: 1, startTime: 1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Không lấy được lịch rảnh",
    });
  }
};

/**
 * Xóa (hoặc disable) lịch rảnh
 */
exports.deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    await DoctorAvailability.findByIdAndUpdate(id, {
      isActive: false,
    });

    res.json({ message: "Đã xóa lịch rảnh" });
  } catch (error) {
    res.status(500).json({
      message: "Xóa lịch rảnh thất bại",
    });
  }
};
