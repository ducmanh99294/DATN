const TimeSlot = require("../models/TimeSlot");

  const timeToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  exports.generateDoctorSlots = async (req, res) => {
    try {
      const { doctorId, date, startTime, endTime, slotDuration = 30 } = req.body;

      if (!doctorId || !date || !startTime || !endTime) {
        return res.status(400).json({
          message: "Thiếu dữ liệu tạo lịch",
        });
      }

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          message: "Thời gian không hợp lệ",
        });
      }

      const slots = [];
      let current = startMinutes;

      while (current + slotDuration <= endMinutes) {
        slots.push({
          doctorId,
          date: new Date(date),
          startTime: minutesToTime(current),
          endTime: minutesToTime(current + slotDuration),
        });

        current += slotDuration;
      }

      // insert nhiều slot, bỏ qua slot trùng
      const result = await TimeSlot.insertMany(slots, {
        ordered: false,
      });

      res.json({
        message: "Tạo lịch rảnh thành công",
        totalSlots: result.length,
        data: result,
      });
    } catch (error) {
      // trùng slot thì Mongo sẽ throw error nhưng vẫn tạo được slot khác
      if (error.code === 11000) {
        return res.json({
          message: "Một số khung giờ đã tồn tại",
        });
      }

      console.error(error);
      res.status(500).json({
        message: "Tạo lịch rảnh thất bại",
      });
    }
  };
/**
 * Lấy danh sách slot theo bác sĩ + ngày
 */
  exports.getSlotsByDoctorAndDate = async (req, res) => {

    try {
      const { doctorId, date } = req.query;
      
      if (!doctorId || !date) {
        return res.status(400).json({
          message: "Thiếu doctorId hoặc date",
        });
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const slots = await TimeSlot.find({
        doctorId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).sort({ startTime: 1 });

      res.json(slots);
    } catch (error) {
      res.status(500).json({
        message: "Không lấy được TimeSlot",
      });
    }
  };

  exports.getSlotsByDoctorAndWeek = async (req, res) => {
    try {
      const { doctorId, startDate } = req.query;

      if (!doctorId || !startDate) {
        return res.status(400).json({ message: "Thiếu doctorId hoặc startDate" });
      }

      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(start.getDate() + 7);

      const slots = await TimeSlot.find({
        doctorId,
        date: {
          $gte: start,
          $lt: end,
        },
      }).sort({ date: 1, startTime: 1 });

      res.json(slots);
    } catch (error) {
      res.status(500).json({
        message: "Không lấy được TimeSlot theo tuần",
      });
    }
  };

  exports.createTimeSlot = async (req, res) => {
    try {
      const { doctorId, date, startTime, endTime } = req.body;

      if (!doctorId || !date || !startTime || !endTime) {
        return res.status(400).json({ message: "Thiếu dữ liệu" });
      }

      const slot = await TimeSlot.create({
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
      });

      res.status(201).json(slot);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Khung giờ đã tồn tại",
        });
      }

      res.status(500).json({
        message: "Không tạo được TimeSlot",
      });
    }
  };

/**
 * Đánh dấu slot đã được đặt
 */
  exports.bookTimeSlot = async (req, res) => {
    try {
      const { slotId, appointmentId } = req.body;

      const slot = await TimeSlot.findOneAndUpdate(
        {
          _id: slotId,
          status: "available",
        },
        {
          status: "booked",
          appointmentId,
        },
        { new: true }
      );

      if (!slot) {
        return res.status(400).json({
          message: "Slot không khả dụng",
        });
      }

      res.json({
        message: "Đặt lịch thành công",
        data: slot,
      });
    } catch (error) {
      res.status(500).json({
        message: "Đặt slot thất bại",
      });
    }
  };

  exports.updateStatusTimeSlot = async (req, res) => {
    try {
      const { slotId, status } = req.body;

      const slot = await TimeSlot.findOneAndUpdate(
        {
          _id: slotId,
          status: status,
        },
        { new: true }
      );

      if (!slot) {
        return res.status(400).json({
          message: "Slot không khả dụng",
        });
      }

      res.json({
        message: "Đặt lịch thành công",
        data: slot,
      });
    } catch (error) {
      res.status(500).json({
        message: "Đặt slot thất bại",
      });
    }
  };

  exports.deleteTimeSlot = async (req, res) => {
    try {
      const { id } = req.params;

      const slot = await TimeSlot.findById(id);

      if (!slot) {
        return res.status(404).json({
          message: "Không tìm thấy khung giờ",
        });
      }

      //không cho xóa slot đã được đặt
      if (slot.isBooked) {
        return res.status(400).json({
          message: "Không thể xóa khung giờ đã có người đặt",
        });
      }

      await TimeSlot.findByIdAndDelete(id);

      res.json({
        message: "Xóa khung giờ thành công",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Xóa khung giờ thất bại",
      });
    }
  };

// giữ slot (pending)
exports.holdSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(id, userId);

    const now = new Date();
    const expire = new Date(now.getTime() + 5 * 60 * 1000);

    const slot = await TimeSlot.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { status: "available" },
          { status: "pending", lockExpiresAt: { $lt: now } }
        ]
      },
      {
        status: "pending",
        lockedBy: userId,
        lockExpiresAt: expire
      },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: "Slot đang được người khác giữ"
      });
    }

    res.json({ success: true, slot });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Giữ slot thất bại"
    });
  }
};

// huỷ giữ slot
exports.releaseSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const slot = await TimeSlot.findOneAndUpdate(
      {
        _id: id,
        lockedBy: userId, // ✅ chỉ người giữ mới được release
        status: "pending"
      },
      {
        status: "available",
        lockedBy: null,
        lockExpiresAt: null
      },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: "Không thể release slot"
      });
    }

    res.json({
      success: true,
      data: slot
    });

  } catch (err) {
    res.status(500).json({ message: "Release thất bại" });
  }
};