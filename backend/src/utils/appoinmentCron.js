const cron = require("node-cron");
const Appointment = require("../models/Appointment");

const startAppointmentCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const result = await Appointment.updateMany(
        {
          createAt: { $lt: now },
          status: { $in: ["pending", "confirmed"] }
        },
        {
          $set: { status: "cancelled" }
        }
      );

      console.log(`Auto cancelled: ${result.modifiedCount} appointments`);
    } catch (error) {
      console.error("Cron error:", error);
    }
  });
};

module.exports = startAppointmentCron;