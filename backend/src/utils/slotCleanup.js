const TimeSlot = require("../models/TimeSlot");

setInterval(async () => {
  const now = new Date();

  await TimeSlot.updateMany(
    {
      status: "pending",
      lockExpiresAt: { $lt: now }
    },
    {
      status: "available",
      lockedBy: null,
      lockExpiresAt: null
    }
  );

  console.log("Clean expired slots");
}, 60000);