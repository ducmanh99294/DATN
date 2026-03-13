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

async function rewriteWithAI(rawText, retry = 0) {
  const apiKey = process.env.GROQ_API_KEY;
  console.log(apiKey)
  try {
    const response = await fetch(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Hãy viết lại nội dung sau thành lời tư vấn y tế nhẹ nhàng, chuyên nghiệp, dễ hiểu:\n\n${rawText}`
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
      console.log("Retry AI...");
      return rewriteWithAI(rawText, retry - 1);
    }

    return "AI đang bận, vui lòng thử lại sau.";
  }
}

exports.processAIChat = async (userId, message) => {
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
  console.log("nhận chat")
  console.log(req.body)
  try {
    const reply = await processAIChat(
      req.user.id,
      req.body.message
    );

    res.json({ reply });
    console.log(reply)
  } catch (error) {
    res.status(500).json({ message: "Chat lỗi" });
  }
};
  
exports.handleSocketChat = async (userId, message) => {
  return await processAIChat(userId, message);
};
