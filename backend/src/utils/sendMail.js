const nodemailer = require("nodemailer");

const sendOtpMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Mã xác thực tài khoản",
    html: `
    <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:40px">
    <div style="
        max-width:600px;
        margin:auto;
        background:#ffffff;
        border-radius:12px;
        overflow:hidden;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
    ">
        
        <div style="
        background:linear-gradient(135deg,#0ea5e9,#2563eb);
        color:white;
        padding:30px;
        text-align:center;
        ">
        <h1 style="margin:0;">MediCare</h1>
        <p style="margin-top:10px;">Xác thực tài khoản của bạn</p>
        </div>

        <div style="padding:40px;text-align:center;">
        <h2 style="color:#111827;">Xin chào!</h2>

        <p style="color:#6b7280;font-size:16px;">
            Cảm ơn bạn đã đăng ký tài khoản MediCare.
            Vui lòng sử dụng mã OTP bên dưới:
        </p>

        <div style="
            margin:30px auto;
            display:inline-block;
            background:#eff6ff;
            color:#2563eb;
            font-size:36px;
            font-weight:bold;
            letter-spacing:8px;
            padding:18px 32px;
            border-radius:12px;
        ">
            ${otp}
        </div>

        <p style="color:#ef4444;font-size:14px;">
            Mã có hiệu lực trong 5 phút
        </p>

        <p style="color:#6b7280;font-size:14px;">
            Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
        </p>
        </div>

        <div style="
        background:#f9fafb;
        padding:20px;
        text-align:center;
        font-size:13px;
        color:#9ca3af;
        ">
        © 2026 MediCare. All rights reserved.
        </div>

    </div>
    </div>
    `
  });
};

module.exports = {
  sendOtpMail
};