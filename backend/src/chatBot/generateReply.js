async function generateReply(message, context) {
  let prompt = "";
  let systemInstruction = "";
    console.log(
      "TYPE NHẬN ĐƯỢC:",
      context?.type
    );
  // 1. NẾU LÀ CÂU HỎI HƯỚNG DẪN SỬ DỤNG (FAQ)
  if (context.type === "faq") {
    console.log("Xử lý ngữ cảnh faq với dữ liệu:", context);

    systemInstruction = `
      Bạn là nhân viên chăm sóc khách hàng của website bệnh viện.
      Nhiệm vụ: Trả lời câu hỏi của khách hàng DỰA HOÀN TOÀN vào Tài liệu hướng dẫn bên dưới.
      Tuyệt đối không bịa thêm thông tin. Trả lời ngắn gọn, lịch sự, gạch đầu dòng rõ ràng các bước.
    `;

    prompt = `
      Tài liệu hướng dẫn:
      ${context.manual}

      Câu hỏi người dùng: ${message}
    `;
  } 
  // 2. MEDICAL: Người dùng mô tả triệu chứng, cần gợi ý chuyên khoa
  else if (context.type === "medical") {
    console.log("Xử lý ngữ cảnh medical với dữ liệu:", context);

    systemInstruction = `
      Bạn là trợ lý AI của website đặt lịch khám bệnh.

      Quy tắc:
      - Trả lời ngắn gọn, tự nhiên như đang trò chuyện.
      - Không chẩn đoán chắc chắn bệnh
      - Chỉ gợi ý chuyên khoa phù hợp
      - Giải thích ngắn gọn 3 lý do
      - Đưa ra 3 cách giúp giảm triệu chứng tại nhà.
      - Không nói về lịch khám nếu hệ thống chưa cung cấp
      - Tự nhiên như đang trò chuyện
      - phải bắt buộc trả lời theo mẫu sau:

    BẮT BUỘC trả lời theo mẫu:
    Nhận định:
    [Một câu nhận định ngắn]

    Có thể liên quan đến:
    - ...
    - ...
    - ...

    Bạn có thể thử:
    - ...
    - ...
    - ...

    Bạn có vẻ đang gặp vấn đề về:
    [Tên chuyên khoa]
    `;

    prompt = `
      Thông tin hệ thống:

      - Triệu chứng: ${context.symptoms?.join(", ") || "không có"}
      - Chuyên khoa phù hợp:
      ${context.specialty?.name || "chưa xác định"}

      Người dùng:
      ${message}
    `;
  } 
  // 3. BOOKING: Người dùng muốn đặt lịch, cần xác nhận thông tin lịch khám
  else if (context.type === "booking") {
    const slotText = context.slot
      ? `${context.slot.date.toISOString().split("T")[0]} ${context.slot.startTime}`
      : "không có";

    systemInstruction = `
      Bạn là trợ lý AI của hệ thống đặt lịch khám bệnh.
      - Luôn trả lời NGẮN GỌN, rõ ràng
      - Không được trả lời chung chung
      - Phải dựa trên dữ liệu hệ thống cung cấp
      - Nếu có lịch -> hỏi khách có muốn đặt lịch này không
      - Nếu không có -> nói rõ là hiện chưa có lịch
    `;

    prompt = `
      Dữ liệu hệ thống:
      - Chuyên khoa: ${context.specialty?.name || "không có"}
      - Bác sĩ: ${context.doctor?.userId?.fullName || "không có"}
      - Giá khám: ${context.doctor?.price || "không rõ"}
      - Lịch gần nhất: ${slotText}

      Câu hỏi người dùng: ${message}
    `;
  }

  // Truyền cả prompt và chỉ thị hệ thống vào AI
  return await rewriteWithAI(prompt, systemInstruction);
};

// Cập nhật lại hàm gọi API để nhận thêm systemInstruction
async function rewriteWithAI(prompt, systemInstruction="", retry = 0) {
  const apiKey = process.env.GROQ_API_KEY;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: systemInstruction?.toString() || ""
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return "Hệ thống AI đang tạm thời lỗi.";
    }

    return data.choices[0].message.content.replaceAll("**", "").trim();

  } catch (error) {
    console.error("Lỗi khi gọi AI:", error);

    if (retry > 0) {
      return rewriteWithAI(prompt, systemInstruction, retry - 1);
    }

    return "AI đang bận, vui lòng thử lại sau.";
  }
}

module.exports = {
  generateReply,
  rewriteWithAI
};