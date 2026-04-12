
module.exports = async function generateReply(message, context) {
  const slotText = context.slot
    ? `${context.slot.date.toISOString().split("T")[0]} ${context.slot.startTime}`
    : "không có";

  const prompt = `
Dữ liệu hệ thống:

- Chuyên khoa: ${context.specialty?.name || "không có"}
- Bác sĩ: ${context.doctor?.userId?.fullName || "không có"}
- Giá khám: ${context.doctor?.price || "không rõ"}
- Lịch gần nhất: ${slotText}

Câu hỏi người dùng: ${message}
`;

  return await rewriteWithAI(prompt);
};

async function rewriteWithAI(prompt, retry = 0) {
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
              content: `
Bạn là trợ lý AI của hệ thống đặt lịch khám bệnh.

- Luôn trả lời NGẮN GỌN, rõ ràng
- Không được trả lời chung chung
- Phải dựa trên dữ liệu được cung cấp
- Nếu có lịch → gợi ý đặt lịch
- Nếu không có → nói rõ
              `
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
      return "AI đang tạm thời lỗi.";
    }

    return data.choices[0].message.content;

  } catch (error) {
    console.error("Lỗi khi gọi AI:", error);

    if (retry > 0) {
      return rewriteWithAI(prompt, retry - 1);
    }

    return "AI đang bận, vui lòng thử lại sau.";
  }
}