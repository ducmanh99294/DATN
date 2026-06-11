const { detectIntent } = require("./detectIntent");
const { handleBookingContext, handleMedicalContext, handleFAQContext } = require("./buildContext");
const { generateReply } = require("./generateReply");
const Product = require("../models/Product");
const TimeSlot = require("../models/TimeSlot");
const Appointment = require("../models/Appointment");
const Conversation = require("../models/Conversation");

// Hàm tách chuỗi
function extractCoreKeywords(specialtyName) {
  // 1. Cắt bỏ các chữ vô nghĩa như "Khoa", "Nội", "Ngoại"
  let cleanName = specialtyName.replace(/khoa|nội|ngoại/gi, "").trim();

  // 2. Tách chuỗi dựa trên dấu gạch ngang (-), dấu phẩy (,) hoặc chữ "và"
  let keywords = cleanName.split(/[-,\/]| và /i)
                          .map(k => k.trim())
                          .filter(k => k.length > 0); 
                          
  console.log(keywords)
  return keywords; 
}

module.exports = async function chatService(userId, message) {
  const msgText = message.toLowerCase().trim();
  let conversation = await Conversation.findOne({participants:userId}).populate("participants");
  const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 giờ
  const now = new Date();
  const lastActive = conversation.lastActiveAt;

  if(!conversation){
    conversation = await Conversation.create({
        participants:[userId],
        context:{}
    });
  }

  if (!conversation.context) {
    conversation.context = {};
  }

  // Nếu idle quá 2 giờ hoặc chưa có phiên → reset toàn bộ
  if (!lastActive || (now - lastActive) > SESSION_TIMEOUT_MS) {
    conversation.messages = [];
    conversation.context = {};
    console.log("Phiên mới: đã reset messages và context");
  }

  // Cập nhật thời gian hoạt động
  conversation.lastActiveAt = now;

  // chờ user chọn slot
if (conversation.context.waitingSlotSelection === true) {
  const savedSlotIds = conversation.context.availableSlots || [];
  const savedSlots = await TimeSlot.find({ _id: { $in: savedSlotIds } });

  // ── KIỂM TRA CÂU HỎI VỀ NGÀY CỤ THỂ ────────────────────
  const isAskingAboutDate = msgText.match(/còn.*lịch|lịch.*không|khung.*giờ|giờ.*nào|còn.*không/);
  // ... giữ nguyên phần này ...

  // ── CHỌN THEO GIỜ ("17 giờ", "17h", "17:00") ────────────
  const timeMatch = msgText.match(/(\d{1,2})\s*(giờ|h|:)/);
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, "0");
    // Tìm slot có startTime bắt đầu bằng "HH"
    const chosenSlot = savedSlots.find(s => s.startTime.startsWith(hour + ":"));

    if (!chosenSlot) {
      const slotList = savedSlots.map((s, i) => `${i + 1}. Lúc ${s.startTime}`).join("\n");
      return {
        type: "text",
        message: `Không có khung giờ lúc ${hour}:xx. Các khung còn trống:\n${slotList}\n\nBạn muốn chọn khung số mấy?`
      };
    }

    const dateText = `${chosenSlot.date.toISOString().split("T")[0]} lúc ${chosenSlot.startTime}`;
    conversation.context.slotId = chosenSlot._id;
    conversation.context.waitingSlotSelection = false;
    conversation.context.waitingBooking = true;
    conversation.context.dateText = dateText;
    await conversation.save();

    return {
      type: "text",
      message: `Bạn chọn khung ngày ${dateText}. Xác nhận đặt lịch không? (có/không)`
    };
  }

  // ── CHỌN THEO SỐ THỨ TỰ (mở rộng từ 1-5 thành 1-99) ────
  const numberMatch = msgText.match(/\b(\d{1,2})\b/);
  if (numberMatch) {
    const chosenIndex = parseInt(numberMatch[1]) - 1;

    if (chosenIndex < 0 || chosenIndex >= savedSlots.length) {
      return {
        type: "text",
        message: `Vui lòng chọn số từ 1 đến ${savedSlots.length}.`
      };
    }

    const chosenSlot = savedSlots[chosenIndex];

    if (!chosenSlot || chosenSlot.status !== "available") {
      return { type: "text", message: "Khung giờ này vừa có người đặt rồi. Bạn chọn khung khác không?" };
    }

    const dateText = `${chosenSlot.date.toISOString().split("T")[0]} lúc ${chosenSlot.startTime}`;
    conversation.context.slotId = chosenSlot._id;
    conversation.context.waitingSlotSelection = false;
    conversation.context.waitingBooking = true;
    conversation.context.dateText = dateText;
    await conversation.save();

    return {
      type: "text",
      message: `Bạn chọn khung ngày ${dateText}. Xác nhận đặt lịch không? (có/không)`
    };
  }

  // ── KHÔNG KHỚP GÌ → hiển thị lại danh sách ─────────────
  const slotList = savedSlots.map((s, i) => `${i + 1}. Lúc ${s.startTime}`).join("\n");
  return {
    type: "text",
    message: `Các khung giờ còn trống:\n${slotList}\n\nBạn muốn chọn khung số mấy hoặc nhập giờ cụ thể (VD: "17 giờ")?`
  };
}

  // chờ user xác nhận
  if (conversation.context.waitingBooking == true) {
    const session = conversation.context;

    // 1. KIỂM TRA "QUAY XE" / TỪ CHỐI / HỎI LỊCH KHÁC
    const isChangingMind = msgText.match(/không|ko|hủy|thôi|đừng|\?|hôm nay|ngày mai|sớm hơn|khác/);

    if (isChangingMind) {
      if (msgText.length <= 15 && msgText.match(/^(không|ko|hủy|thôi|đừng|no)/)) {
        conversation.context.waitingBooking = false;
        await conversation.save();
        return { type: "text", message: "Đã hủy thao tác đặt lịch. Bạn cần hỗ trợ gì thêm không?" };
      }
      
      // Ngược lại (VD: "có lịch hôm nay ko?", "bác sĩ khác được ko") 
      conversation.context.waitingBooking = false;

      delete conversation.context.slotId;
      delete conversation.context.doctorId;

      await conversation.save();
    } 
    
    // 2. NẾU AN TOÀN VÀ LÀ CÂU ĐỒNG Ý
    else if (msgText.match(/có|ok|okie|đồng ý|đặt|chốt|được|yes|vâng|dạ/)) {
      
      // 1. Khóa lịch (Update TimeSlot)
      await TimeSlot.findByIdAndUpdate(session.slotId, {
        status: "booked", 
        patientId: userId 
      });
      console.log(session)
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
      conversation.context.waitingBooking=false;

      delete conversation.context.slotId;
      delete conversation.context.doctorId;

      await conversation.save();

      return { 
        type: "text", 
        message: `Đặt lịch thành công! Bạn đã đặt lịch khám với Bác sĩ vào ngày ${session.dateText}. Bạn có thể vào mục "Lịch khám của tôi" để xem chi tiết nhé.` 
      };
    } 
    // Nếu chat tào lao (VD: "thời tiết nay đẹp nhỉ") -> Xóa phiên chờ, xuống cho AI xử lý
    else {
      conversation.context.waitingBooking = false;

      delete conversation.context.slotId;
      delete conversation.context.doctorId;

      await conversation.save();
    }
  }

  // Lưu tin nhắn người dùng vào phiên
  conversation.messages.push({ role: "user", content: message });
  if (conversation.messages.length > 20) {
    conversation.messages = conversation.messages.slice(-20);
  }
  await conversation.save();

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

  // 3. Lấy Context cho Bệnh lý hoặc Đặt lịch
  let context = {};
  
  if (intent === "MEDICAL") {
    console.log("Vào MEDICAL");

    context = await handleMedicalContext(entities);

    context.type = "medical";

    // thêm dòng này
    context.symptoms = entities;

    if (context.specialty) {
      conversation.context.specialtyId = context.specialty._id;
      conversation.context.specialtyName = context.specialty.name;

      conversation.context.symptoms = [
        ...new Set([
          ...(conversation.context.symptoms || []),
          ...entities
        ])
      ];

      conversation.context.lastIntent = "MEDICAL";

      console.log(
        `Đã lưu lịch sử khám: ${context.specialty.name}`
      );
    }

    await conversation.save();
  }

  if (intent === "PRODUCT") {
    console.log("4. RƠI VÀO PRODUCT -> Sẽ bị return tại đây!");
    let finalKeywords = [...entities];

    // 1. Lọc bỏ các từ rác vô nghĩa
    finalKeywords = finalKeywords.filter(keyword => 
      !["thuốc", "uống gì", "thuốc gì", "mua thuốc", "chi", "gì"].includes(keyword.toLowerCase())
    );

    // 2. Khởi tạo câu truy vấn mặc định
    let productQuery = { isSelling: true };
    let savedSpecialtyName = "";

    // 3. TÌM THEO CHUYÊN KHOA (Khi khách hỏi chung chung như "uống thuốc gì")
    if (finalKeywords.length === 0 && conversation.context.specialtyId) {
      savedSpecialtyName = conversation.context.specialtyName;
      
      // Sử dụng hàm bóc tách để lấy từ khóa cốt lõi
      const coreKeywords = extractCoreKeywords(savedSpecialtyName);
      
      // Ghép lại thành Regex: "Tiêu hóa|Gan mật"
      const searchRegex = coreKeywords.join("|");
      
      productQuery.$or = [
        { name: { $regex: searchRegex, $options: "i" } },
        { uses: { $regex: searchRegex, $options: "i" } },
        { description: { $regex: searchRegex, $options: "i" } }
      ];
    }
    // 4. TÌM THEO TỪ KHÓA (Khi khách chỉ đích danh "bán vỉ panadol")
    else {
      const searchKeyword = finalKeywords.length > 0 ? finalKeywords.join("|") : message;
      productQuery.$or = [
        { name: { $regex: searchKeyword, $options: "i" } },
        { uses: { $regex: searchKeyword, $options: "i" } }
      ];
    }

    // 5. Thực thi tìm kiếm
    const products = await Product.find(productQuery).limit(3);

    // 6. Nếu không có thuốc
    if (products.length === 0) {
      const fallbackText = savedSpecialtyName ? `thuộc ${savedSpecialtyName}` : "cho tình trạng này";
      return { 
        type: "text", 
        message: `Hiện tại nhà thuốc không có sẵn thuốc ${fallbackText}. Để đảm bảo an toàn sức khỏe, bạn nên đi khám để được Bác sĩ chẩn đoán và kê đơn chính xác nhé. \n\nBạn có muốn tôi tìm Bác sĩ chuyên khoa phù hợp không?` 
      };
    }

    // 7. Nếu có thuốc
    const introText = savedSpecialtyName 
      ? `Dựa trên tình trạng liên quan đến **${savedSpecialtyName}** của bạn` 
      : `Dựa trên yêu cầu của bạn`;
      
    return { 
      type: "product", 
      products, 
      message: `${introText}, tôi gợi ý một số loại thuốc phù hợp dưới đây. Tuy nhiên, nếu tình trạng không thuyên giảm, hãy đặt lịch khám Bác sĩ nhé!` 
    };
  }

  if( intent === "FAQ") {
    context = await handleFAQContext(message);
    context.type = "faq";
  }

  else if (intent === "BOOKING") {
    let bookingEntities = [...entities];
    if(conversation.context.specialtyId && entities.length <= 1) {
      bookingEntities.push(conversation.context.specialtyName);
    }
    context = await handleBookingContext(bookingEntities, userId, conversation.context);
    context.type = "booking";
  }

  if (context.slots?.length > 0 && context.doctor) {
    // Lưu danh sách slot ID để sau còn lấy lại
    conversation.context.availableSlots = context.slots.map(s => s._id);
    conversation.context.doctorId = context.doctor._id;
    conversation.context.specialtyId = context.specialty?._id;
    conversation.context.waitingSlotSelection = true;  // ← chờ chọn slot
    conversation.context.waitingBooking = false;
    await conversation.save();
  }

try {
  console.log("gọi generateReply với message: ", message);
  console.log("gọi generateReply với context: ", context);
    const reply = await generateReply(message, context);
    
    conversation.messages.push({ role: "assistant", content: reply });
    await conversation.save();

    return {
      type: "text",
      message: reply,
      doctorId: context.doctor?._id,
      slotId: context.slot?._id
    };
  } catch (error) {
    console.error("LỖI NGAY TẠI BƯỚC GỌI GENERATE REPLY:", error);
    return {
      type: "text",
      message: "Xin lỗi, hệ thống đang gặp lỗi khi tạo câu trả lời. Bạn vui lòng thử lại sau nhé."
    };
  }
};