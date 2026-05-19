const chatService = require("../chatBot/chatService");
const Conversation = require( "../models/Conversation.js");
const Message = require("../models/Message.js");

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

exports.createConversation = async (req, res) => {

  try {

    const userId = req.user.id;
    const { receiverId } = req.body;

    // kiểm tra đã có conversation chưa
    let conversation = await Conversation.findOne({
      participants: {
        $all: [userId, receiverId]
      }
    });

    // nếu chưa có thì tạo mới
    if (!conversation) {

      conversation = await Conversation.create({
        participants: [userId, receiverId]
      });

    }

    conversation = await Conversation.findById(conversation._id)
      .populate("participants", "fullName image");

    res.json(conversation);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });
  }
};

// lấy danh sách conversation
exports.getConversations = async (req, res) => {

  try {

    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate("participants", "fullName image")
    .sort({ updatedAt: -1 });

    res.json(conversations);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// lấy message theo conversation
exports.getMessages = async (req, res) => {

  try {

    const { conversationId } = req.params;

    const messages = await Message.find({
      conversationId
    })
    .populate("sender", "fullName avatar")
    .sort({ createdAt: 1 });

    res.json(messages);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

// gửi message bằng REST API (optional)
exports.sendMessage = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      conversationId,
      message
    } = req.body;

    const newMessage = await Message.create({
      conversationId,
      sender: userId,
      message
    });

    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message,
        lastMessageAt: new Date()
      }
    );

    res.json(newMessage);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    } 
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Bạn không có quyền xóa cuộc trò chuyện này" });
    }

    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversationId });
    res.json({ message: "Cuộc trò chuyện đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};