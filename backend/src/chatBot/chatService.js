const { detectIntent } = require("./detectIntent");
const { handleBookingContext, handleMedicalContext, handleFAQContext } = require("./buildContext");
const generateReply = require("./generateReply");
const Product = require("../models/Product");
const TimeSlot = require("../models/TimeSlot");
const Appointment = require("../models/Appointment");

// bộ nhớ tạm thời
const pendingBookings = new Map();

module.exports = async function chatService(userId, message) {

  const msgText = message.toLowerCase().trim();

  if (pendingBookings.has(userId)) {
    const session = pendingBookings.get(userId);

    // 🔥 1. KIỂM TRA "QUAY XE" / TỪ CHỐI / HỎI LỊCH KHÁC
    // Bắt các từ khóa: không, ko, dấu hỏi (?), hôm nay, ngày mai, khác...
    const isChangingMind = msgText.match(/không|ko|hủy|thôi|đừng|\?|hôm nay|ngày mai|sớm hơn|khác/);

    if (isChangingMind) {
      // Ngoại lệ: Nếu khách chỉ gõ cụt lủn vài chữ (VD: "không", "ko", "hủy đi") -> Báo hủy ngay lập tức
      if (msgText.length <= 15 && msgText.match(/^(không|ko|hủy|thôi|đừng|no)/)) {
        pendingBookings.delete(userId);
        return { type: "text", message: "Đã hủy thao tác đặt lịch. Bạn cần hỗ trợ gì thêm không?" };
      }
      
      // Ngược lại (VD: "có lịch hôm nay ko?", "bác sĩ khác được ko") 
      // -> Bỏ qua lệnh chốt đơn, xóa bộ nhớ tạm để code trôi xuống dưới cho AI tự phân tích lại!
      pendingBookings.delete(userId);
    } 
    
    // 🔥 2. NẾU AN TOÀN VÀ LÀ CÂU ĐỒNG Ý
    else if (msgText.match(/có|ok|okie|đồng ý|đặt|chốt|được|yes|vâng|dạ/)) {
      
      // 1. Khóa lịch (Update TimeSlot)
      await TimeSlot.findByIdAndUpdate(session.slotId, {
        status: "booked", 
        patientId: userId 
      });

      // 2. Tạo Appointment
      await Appointment.create({
        patientId: userId,
        doctorId: session.doctorId,
        specialtyId: session.specialtyId,
        slotId: session.slotId,
        symptoms: session.symptoms,
        description: "Đặt lịch tự động qua Trợ lý ảo AI",
        price: session.price
      });
      
      // Xóa bộ nhớ tạm
      pendingBookings.delete(userId);
      return { 
        type: "text", 
        message: `✅ Đặt lịch thành công! Bạn đã đặt lịch khám với Bác sĩ vào ngày ${session.dateText}. Bạn có thể vào mục "Lịch khám của tôi" để xem chi tiết nhé.` 
      };
    } 
    // Nếu chat tào lao (VD: "thời tiết nay đẹp nhỉ") -> Xóa phiên chờ, xuống cho AI xử lý
    else {
      pendingBookings.delete(userId);
    }
  }

  const nlpResult = await detectIntent(message); 
  const intent = nlpResult.intent;
  const entities = nlpResult.entities; 
  // 2. Chặn các câu không liên quan hoặc chào hỏi
  if (intent === "OUT_OF_SCOPE") {
    return { 
      type: "text", 
      message: "Xin lỗi, tôi là trợ lý y tế. Tôi chỉ hỗ trợ các vấn đề khám chữa bệnh, đặt lịch và tư vấn thuốc." 
    };
  }

  if (intent === "GREETING") {
    return { 
      type: "text", 
      message: "Chào bạn! Tôi có thể giúp bạn đặt lịch khám hoặc tìm bác sĩ theo triệu chứng. Bạn đang gặp vấn đề gì?" 
    };
  }

  // 3. Xử lý logic mua thuốc
  if (intent === "PRODUCT") {
    const searchKeyword = entities.length > 0 ? entities.join("|") : message;

    const products = await Product.find({
          name: { $regex: searchKeyword, $options: "i" },
          isSelling: true
        }).limit(5);

    if (products.length === 0) {
          return { 
            type: "text", 
            message: `Xin lỗi, hiện tại nhà thuốc không tìm thấy sản phẩm nào khớp với yêu cầu của bạn.` 
          };
        }

    // 4. Nếu có sản phẩm thì mới trả về list
    return { 
      type: "product", 
      products, 
      message: "Tôi tìm thấy một số sản phẩm phù hợp cho bạn tham khảo dưới đây:" 
    };
  }

  // 4. Lấy Context cho Bệnh lý hoặc Đặt lịch
  let context = {};
  
  if (intent === "MEDICAL") {
    // Ép mảng entities (triệu chứng) thành chuỗi để tìm trong DB
    context = await handleMedicalContext(entities); 
  } 

  if( intent === "FAQ") {
    context = await handleFAQContext(message);
  }
  else if (intent === "BOOKING") {
    context = await handleBookingContext(entities, userId);
  }

  if (context.slot && context.doctor) {
    pendingBookings.set(userId, {
      slotId: context.slot._id,
      doctorId: context.doctor._id,
      specialtyId: context.specialty?._id, // Lấy ID chuyên khoa
      price: context.doctor.price || 0,    // Lấy giá tiền
      symptoms: entities.length > 0 ? entities.join(", ") : "Khám bệnh", // Lấy từ khóa AI tìm được làm triệu chứng
      dateText: `${context.slot.date.toISOString().split("T")[0]} ${context.slot.startTime}`
    });
  }

  // 5. Gửi thông tin cho AI sinh câu trả lời cuối cùng
  const reply = await generateReply(message, context);

  return {
    type: "text",
    message: reply,
    doctorId: context.doctor?._id,
    slotId: context.slot?._id
  };
};