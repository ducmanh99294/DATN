const TimeSlot = require("../models/TimeSlot");
const { emitSlotUpdate } = require("../sockets/index");

setInterval(async () => {
  try {
    const now = new Date();

    const expiredSlots = await TimeSlot.find({
      status: "pending",
      lockExpiresAt: { $lt: now }
    });

    if (!expiredSlots.length) return;

    await TimeSlot.updateMany(
      {
        _id: { $in: expiredSlots.map(s => s._id) }
      },
      {
        status: "available",
        lockedBy: null,
        lockExpiresAt: null
      }
    );

    expiredSlots.forEach(slot => {
      emitSlotUpdate({
        slotId: slot._id,
        status: "available",
        lockedBy: null,
        lockExpiresAt: null
      });
    });

  } catch (err) {
    console.error(err);
  }
}, 5000);