// const Specialty = require("../models/Speciatly");
// const DoctorProfile = require("../models/Doctor");
// const TimeSlot = require("../models/TimeSlot");
// const Chat = require("../models/Chat");
// const Product = require("../models/Product");

// const aiCache = new Map();

// function extractKeywords(text) {
//   if (typeof text !== "string") return [];

//   const dictionary = [
//     "đau đầu",
//     "tim",
//     "mất ngủ",
//     "ho",
//     "sốt",
//     "dạ dày",
//     "da liễu"
//   ];

//   const lowerText = text.toLowerCase();

//   return dictionary.filter(word =>
//     lowerText.includes(word)
//   );
// }

// async function rewriteWithAI(rawText, retry = 0) {
//   const apiKey = process.env.GROQ_API_KEY;
//   try {
//     const response = await fetch(
//       `https://api.groq.com/openai/v1/chat/completions`,
//       {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${apiKey}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: "llama-3.3-70b-versatile",
//           messages: [
//             {
//               role: "user",
//               content: `Hãy viết lại nội dung sau thành lời tư vấn y tế nhẹ nhàng, chuyên nghiệp, dễ hiểu:\n\n${rawText}`
//             }
//           ]        
//         })
//       }
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       console.error("Groq error:", data);
//       return "AI đang tạm thời lỗi.";
//     }

//     return data.choices[0].message.content;

//   } catch (error) {
//     console.error("Lỗi khi gọi AI:", error);
//     if (retry > 0) {
//       console.log("Retry AI...");
//       return rewriteWithAI(rawText, retry - 1);
//     }

//     return "AI đang bận, vui lòng thử lại sau.";
//   }
// }

// async function readPrescriptionFromImage(base64Image, retry = 1) {
//   console.log('doc ânh')
//   console.log(base64Image)
//   const apiKey = process.env.OCR_API_KEY;

//   if (!base64Image.startsWith("data:image")) {
//     base64Image = "data:image/png;base64," + base64Image;
//   }

// try {
//     const response = await fetch("https://api.ocr.space/parse/image", {
//       method: "POST",
//       headers: {
//         apikey: apiKey,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         base64Image, 
//         language: "eng", 
//         isOverlayRequired: false
//       })
//     });

//     const data = await response.json();

//     if (!data || data.IsErroredOnProcessing) {
//       console.error("OCR ERROR:", data);
//       return "";
//     }

//     const parsedText = data.ParsedResults?.[0]?.ParsedText || "";

//     console.log("📄 OCR RESULT:", parsedText);

//     return parsedText.trim();

//   } catch (err) {
//     console.error("OCR FAIL:", err);

//     if (retry > 0) {
//       return readPrescriptionFromImage(base64Image, retry - 1);
//     }

//     return "";
//   }
// }


// async function findProductsFromMessage(message) {
//   if (typeof message !== "string") return [];

//   const keywords = message.toLowerCase().split(/\s+/);

//   const products = await Product.find({
//     name: {
//       $regex: keywords.join("|"),
//       $options: "i"
//     },
//     isSelling: true
//   }).limit(5);

//   return products;
// }

// async function  processAIChat(userId, message) {
// // TÌM SẢN PHẨM 
//   const products = await findProductsFromMessage(message);

//   if (products.length > 0) {
//     const productListText = products.map(p => 
//       `- ${p.name} (${p.price}đ)`
//     ).join("\n");

//     const rawResponse = `
// Người dùng đang hỏi về sản phẩm/thuốc: ${message}

// Các sản phẩm phù hợp:
// ${productListText}

// Hãy tư vấn nhẹ nhàng và hỏi người dùng có muốn thêm vào giỏ hàng không.
//     `;

//     const finalReply = await rewriteWithAI(rawResponse);

//     await Chat.create({
//       userId,
//       role: "assistant",
//       message: finalReply,
//       type: "text"
//     });

//     return {
//       type: "product",
//       message: finalReply,
//       products
//     };
//   }
//   // gợi ý đặt lịch
//   const keywords = extractKeywords(message);

//   const specialty = await Specialty.findOne({
//     name: { $regex: keywords.join("|"), $options: "i" }
//   });

//   if (!specialty) {
//     const reply =
//       "Hiện tại chúng tôi chưa xác định được chuyên khoa phù hợp. Vui lòng mô tả rõ hơn.";

//     await Chat.create({
//       userId,
//       role: "assistant",
//       message: reply,
//       type: "text"
//     });

//     return reply;
//   }

//   const doctor = await DoctorProfile.findOne({
//     specialtyId: specialty._id
//   }).populate("userId");

//   const slot = await TimeSlot.findOne({
//     doctorId: doctor?._id,
//     status: "available",
//     date: { $gte: new Date() }
//   }).sort({ date: 1, startTime: 1 });

//   const rawResponse = `
//     Triệu chứng người dùng: ${message}
//     Chuyên khoa phù hợp: ${specialty.name}
//     Bác sĩ đề xuất: ${doctor?.name || "Chưa có"}
//     Slot sớm nhất: ${
//       slot
//         ? slot.date.toISOString().split("T")[0] + " " + slot.startTime
//         : "Chưa có slot"
//     }
//   `;

//   const finalReply = await rewriteWithAI(rawResponse);

//   await Chat.create({
//     userId,
//     role: "assistant",
//     message: finalReply,
//     type: "text"
//   });

//   return finalReply;
// }

// // exports.processAIChat = async (userId, message) => {
// //   // chỉ log để debug
// //   console.log("📩 MESSAGE:", message);

// //   await Chat.create({
// //     userId,
// //     role: "assistant",
// //     message: message || "Không đọc được nội dung",
// //     type: "text"
// //   });

// //   return message || "Không đọc được nội dung";
// // };

// exports.chatConsult = async (req, res) => {
//   console.log("nhận chat")
//   console.log(req.body)
//   try {
//     const reply = await processAIChat(
//       req.user.id,
//       req.body.message
//     );

//     res.json({ reply });
//     console.log(reply)
//   } catch (error) {
//     res.status(500).json({ message: "Chat lỗi" });
//   }
// };
  
// exports.handleSocketChat = async (userId, data) => {
//   let message = data.message;

//   if (data.type === "image") {
//     message = await readPrescriptionFromImage(data.image);
//   }

//   if (!message || typeof message !== "string") {
//     message = "";
//   }

//   if (!message || message.length < 2) {
//     message = "Không đọc được nội dung từ ảnh";
//   }

//   await Chat.create({
//     userId,
//     role: "user",
//     message,
//     type: data.type || "text",
//     image: data.type === "image" ? data.image : undefined
//   });

//   return await processAIChat(userId, message);
// };
const chatService = require("../chatBot/chatService");

exports.chatConsult = async (req, res) => {
  try {
    const result = await chatService(req.user.id, req.body.message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Chat lỗi" });
  }
};

exports.handleSocketChat = async (userId, data) => {
  try {
    // Từ frontend, bạn gửi lên { message: input } HOẶC { type: "image", image: base64 }
    // Nên ta lấy data.message (nếu là chữ) hoặc data.image (nếu là ảnh)
    const inputContent = data.message || data.image; 
    
    // Gọi chatService xử lý logic AI Router đã làm trước đó
    const result = await chatService(userId, inputContent);
    return result; 
  } catch (error) {
    console.error("Lỗi handleSocketChat:", error);
    throw error; // Ném lỗi ra để khối catch bên socket bắt được
  }
};