const Specialty = require("../models/Speciatly");
const Doctor = require("../models/Doctor");
const TimeSlot = require("../models/TimeSlot");
const {detectSpecialtyFromDB} = require("./detectIntent");
const rewriteWithAI = require("./generateReply");

async function handleBookingContext(entities, userId, conversationContext) {
  let specialty = null;
  if (entities && entities.length > 0) {
    specialty = await Specialty.findOne({
      // Tìm chuyên khoa khớp với các từ khóa AI nhả ra (VD: "da liễu")
      name: { $regex: entities.join("|"), $options: "i" } 
    });
  }

  if (!specialty && conversationContext?.specialtyId) { 
    specialty = await Specialty.findById(conversationContext.specialtyId);
  };

  if(!specialty){
    return {
      type:"booking",
      error:"no_specialty"
    };
  }

  const doctor = await Doctor.findOne({
    specialtyId: specialty._id
  }).populate("userId");

  // Nếu khoa "da liễu" chưa có bác sĩ nào
  if (!doctor) return { specialty, error: "no_doctor" };

  const slot = await TimeSlot.findOne({
    doctorId: doctor._id,
    status: "available",
    date: { $gte: new Date() }
  }).sort({ date: 1 });

  // Nếu bác sĩ đó hết lịch rảnh
  if (!slot) return { specialty, doctor, error: "no_slot" };

  // 🔥 HOLD SLOT
  let holdSuccess = false;

  try {
    // Giả sử bạn đã có hàm holdSlotByAI
    // const held = await holdSlotByAI(slot._id, userId);
    // holdSuccess = !!held;
  } catch (e) {
    holdSuccess = false;
  }

  return {
    type: "booking",
    specialty,
    doctor,
    slot,
    holdSuccess
  };
}

async function handleMedicalContext(entities) {
  let specialty = null;

  if (entities && entities.length > 0) {
    const regexArray = entities.map(
      keyword => new RegExp(keyword, "i")
    );

    specialty = await Specialty.findOne({
      $or: [
        { name: { $in: regexArray } },
        { keywords: { $in: regexArray } }
      ]
    });
  }

  // fallback AI
  if (!specialty && entities?.length > 0) {

    const specialties = await Specialty.find(
      {},
      "name description"
    );

    const prompt = `
Người dùng có triệu chứng:
${entities.join(", ")}

Danh sách chuyên khoa:
${specialties
.map(
(s,i)=>`${i+1}. ${s.name}: ${s.description}`
)
.join("\n")}

Chỉ trả về tên chuyên khoa phù hợp nhất.
`;

    const aiResult =
      await rewriteWithAI(
        prompt,
`
Bạn là AI phân loại triệu chứng.

- Chỉ trả về tên chuyên khoa
- Không giải thích
- Không thêm nội dung khác
`
      );

    specialty =
      await Specialty.findOne({
        name:{
          $regex: aiResult.trim(),
          $options:"i"
        }
      });
  }

  if (!specialty) {
    return {
      type:"medical",
      symptoms: entities, // thêm
      error:"no_specialty"
    };
  }

  const doctor =
    await Doctor.findOne({
      specialtyId:specialty._id
    }).populate("userId");

  const slot =
    await TimeSlot.findOne({
      doctorId:doctor?._id,
      status:"available",
      date:{
        $gte:new Date()
      }
    }).sort({
      date:1,
      startTime:1
    });

  return {
    type:"medical",
    symptoms: entities, // thêm
    specialty,
    doctor,
    slot
  };
}

// Thêm hàm này vào file buildContext.js
async function handleFAQContext(message) {
  // Ở mức độ đồ án, bạn có thể hardcode (viết cứng) tài liệu hướng dẫn vào một chuỗi như thế này. 
  // Nếu hệ thống lớn hơn, bạn có thể lưu đoạn text này trong Database.
  
  const systemManual = `
  TÀI LIỆU HƯỚNG DẪN SỬ DỤNG WEBSITE BỆNH VIỆN:
  
  1. Cách đặt lịch hẹn khám:
  - Khách hàng có thể chat trực tiếp với AI để đặt lịch, hoặc vào mục "Đặt Lịch" trên thanh menu.
  - Sau đó chọn Chuyên khoa -> Chọn Bác sĩ -> Chọn Ngày giờ còn trống -> Bấm "Xác nhận".

  2. Cách xem lịch hẹn đã đặt:
  - Đăng nhập vào tài khoản.
  - Bấm vào Avatar góc phải màn hình -> Chọn "Hồ sơ cá nhân".
  - Ở menu bên trái, chọn tab "Lịch khám của tôi" để xem danh sách lịch đã đặt.

  3. Cách hủy lịch khám:
  - Vào phần "Lịch khám của tôi" -> Tìm lịch muốn hủy -> Bấm nút "Hủy lịch". 
  - Lưu ý: Chỉ được hủy trước thời gian khám 24 giờ.

  4. Cách tạo lịch rảnh (Chỉ dành cho tài khoản Bác sĩ):
  - Bác sĩ đăng nhập vào hệ thống.
  - Chuyển sang giao diện "Trang quản trị Bác sĩ" (Tạo lịch rảnh).
  - Chọn "Quản lý lịch làm việc" -> Chọn ngày -> Nhấn "Thêm khung giờ" và lưu lại.
  `;

  return {
    type: "faq",
    manual: systemManual
  };
}

// Nhớ export nó ra nhé
module.exports = {
  handleBookingContext,
  handleMedicalContext,
  handleFAQContext 
};
