const Specialty = require("../models/Speciatly");
const DoctorProfile = require("../models/Doctor");
const TimeSlot = require("../models/TimeSlot");
const Chat = require("../models/Chat");

function extractKeywords(text) {
  const dictionary = [
    "đau đầu",
    "tim",
    "mất ngủ",
    "ho",
    "sốt",
    "dạ dày",
    "da liễu"
  ];

  return dictionary.filter(word =>
    text.toLowerCase().includes(word)
  );
}

async function rewriteWithAI(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Hãy viết lại nội dung sau thành lời tư vấn y tế nhẹ nhàng, chuyên nghiệp, dễ hiểu:\n\n${rawText}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return "AI đang tạm thời lỗi.";
    }

    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini:", error);
    return "Có lỗi xảy ra khi xử lý văn bản.";
  }
}



async function processAIChat(userId, message) {
  await Chat.create({
    userId,
    role: "user",
    message
  });

  const keywords = extractKeywords(message);

  const specialty = await Specialty.findOne({
    name: { $regex: keywords.join("|"), $options: "i" }
  });

  if (!specialty) {
    const reply =
      "Hiện tại chúng tôi chưa xác định được chuyên khoa phù hợp. Vui lòng mô tả rõ hơn.";

    await Chat.create({
      userId,
      role: "assistant",
      message: reply
    });

    return reply;
  }

  const doctor = await DoctorProfile.findOne({
    specialtyId: specialty._id
  }).populate("userId");

  const slot = await TimeSlot.findOne({
    doctorId: doctor?._id,
    status: "available",
    date: { $gte: new Date() }
  }).sort({ date: 1, startTime: 1 });

  const rawResponse = `
    Triệu chứng người dùng: ${message}
    Chuyên khoa phù hợp: ${specialty.name}
    Bác sĩ đề xuất: ${doctor?.name || "Chưa có"}
    Slot sớm nhất: ${
      slot
        ? slot.date.toISOString().split("T")[0] + " " + slot.startTime
        : "Chưa có slot"
    }
  `;

  const finalReply = await rewriteWithAI(rawResponse);

  await Chat.create({
    userId,
    role: "assistant",
    message: finalReply
  });

  return finalReply;
}

exports.chatConsult = async (req, res) => {
  try {
    const reply = await processAIChat(
      req.user.id,
      req.body.message
    );

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: "Chat lỗi" });
  }
};
  
exports.handleSocketChat = async (userId, message) => {
  return await processAIChat(userId, message);
};
