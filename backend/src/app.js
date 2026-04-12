const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const contactRoutes = require('./routes/contactRoutes')
const cartRoutes = require('./routes/cartRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const checkoutRoutes = require('./routes/checkoutRoutes')
const designRequestRoutes = require('./routes/designRequestRoutes')
const doctorAvailabilityRoutes = require('./routes/DoctorAvailabilityRoutes')
const timeSlotRoutes = require('./routes/timeSlotRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const doctorRoutes = require('./routes/doctorRoutes')
const speciallyRoutes = require('./routes/speciallyRoutes')
const newsRoutes = require('./routes/newsRoutes')
const faqRoutes = require('./routes/faqRoutes')

const categoryRoutes =  require("./routes/categoryRoutes");
const chatRoutes =  require("./routes/chatRoutes");
const app = express()
app.set("trust proxy", 1);
const passport = require("./controllers/passport");

app.use(passport.initialize());
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: ['http://localhost:5173', 'https://datn-khaki-xi.vercel.app'],
  credentials: true
}))

app.use('/api/auth', authRoutes)
app.use("/api/contacts", contactRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/design-requests", designRequestRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/doctor-availability", doctorAvailabilityRoutes);
app.use("/api/timeSlot", timeSlotRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/specially", speciallyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/chatbot", chatRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running')
})

module.exports = app
