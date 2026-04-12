const apiKey = process.env.GROQ_API_KEY;
const Specialty = require("../models/Speciatly");

// Prompt hướng dẫn AI cách phân loại
const INTENT_PROMPT = `
Bạn là hệ thống phân loại ý định (Router) của một bệnh viện.
Nhiệm vụ của bạn là đọc câu chat của người dùng và trả về DUY NHẤT một chuỗi JSON hợp lệ.

Cấu trúc JSON mong muốn:
{
  "intent": "Tên_Intent",
  "entities": ["từ khóa 1", "từ khóa 2"]
}

Quy tắc chọn "intent" (CHỈ CHỌN 1 TRONG CÁC TỪ SAU):
1. "MEDICAL": Người dùng kể bệnh, than đau, mô tả triệu chứng. (VD: "tôi hay bị ợ chua", "đau đầu quá").
2. "BOOKING": Người dùng YÊU CẦU THỰC HIỆN ĐẶT LỊCH NGAY. Thường mang tính ra lệnh hoặc khẳng định. (VD: "đặt lịch khám cho tôi", "tôi muốn khám bác sĩ A", "chiều nay rảnh không"). TUYỆT ĐỐI KHÔNG CHỌN BOOKING NẾU CÂU CÓ CHỨA CÁC TỪ HỎI CÁCH LÀM (NHƯ: "LÀM SAO", "CÁCH").
3. "PRODUCT": Người dùng muốn mua thuốc, hỏi giá thuốc. (VD: "bán tôi hộp panadol").
4. "OUT_OF_SCOPE": Người dùng nói chuyện phiếm, hỏi những thứ không liên quan đến y tế. (VD: "thời tiết nay thế nào").
5. "GREETING": Câu chào hỏi xã giao. (VD: "chào bạn", "hello").
6. "FAQ": Người dùng HỎI ĐÁP, TÌM HIỂU CÁCH SỬ DỤNG website. Thường chứa các từ để hỏi: "làm sao", "cách nào", "hướng dẫn", "ở đâu". (VD: "làm sao để đặt lịch", "cách đặt lịch như thế nào", "xem lịch hẹn ở đâu", "cách tạo lịch rảnh").
`;

// Hàm mới dùng AI để phân loại
async function detectIntent(message) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Model nhẹ, chạy cực nhanh
        messages: [
          { role: "system", content: INTENT_PROMPT },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }, // Ép trả về JSON
        temperature: 0.1
      })
    });

    const data = await response.json();
    console.log(JSON.stringify(data.choices[0].message, null, 2))
    const result = JSON.parse(data.choices[0].message.content);
    
    return result; // Kết quả sẽ có dạng: { intent: "MEDICAL", entities: ["đau đầu"] }

  } catch (error) {
    console.error("Lỗi AI Router:", error);
    return { intent: "UNKNOWN", entities: [] }; 
  }
}

// Hàm cũ của bạn (Giữ nguyên)
async function detectSpecialtyFromDB(message) {
  const msg = message.toLowerCase();
  const specialty = await Specialty.findOne({
    keywords: {
      $elemMatch: {
        $regex: msg,
        $options: "i"
      }
    }
  });
  return specialty;
};

module.exports = {
  detectIntent,
  detectSpecialtyFromDB
};