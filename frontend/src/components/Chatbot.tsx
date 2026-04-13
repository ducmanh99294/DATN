import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { ChatAi } from "../api/chatApi";
import { useAuthContext } from "../context/AuthContext";
import { useNotify } from "../hooks/useNotification";
import "../assets/chatbot.css";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

// 1. Sửa lại Interface: message không còn bắt buộc (vì có lúc chỉ gửi ảnh/sản phẩm)
interface Message {
  role: "user" | "assistant";
  type?: "text" | "image" | "product_list";
  message?: string; 
  image?: string;
  products?: any[]; // Thêm khai báo mảng products
}

const Chat: React.FC = () => {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const notify = useNotify();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!socket) return;

    const handleAiReply = (data: any) => {
      console.log(data);
      if (data.message.type === "product") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "text", message: data.message.message },
          { role: "assistant", type: "product_list", products: data.message.products },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", 
            type: "text", 
            message: data.message.message || "Xin lỗi, tôi không đọc được dữ liệu." 
          },
        ]);
      }
      setIsTyping(false);
    };

    socket.on("ai_reply", handleAiReply);

    return () => {
      socket.off("ai_reply", handleAiReply);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user) {
      notify.info("Vui lòng đăng nhập để sử dụng tính năng này.", "Thông báo");
      return;
    }
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", type: "text", message: input };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);
    setInput("");

    if (socket?.connected) {
      socket.emit("send_message", { message: input });
    } else {
      const res = await ChatAi(input);
      setMessages((prev) => [...prev, { role: "assistant", type: "text", message: res.reply }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chatIcon" onClick={() => setOpen(!open)}>
        💬
      </div>

      {open && (
        <div className="chatContainer">
          <div className="header">
            Chat
            <span style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>
              ✖
            </span>
          </div>

          <div className="chatArea">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role === "user" ? "userMessage" : "aiMessage"}`}>
                
                {/* Render Text */}
                {(!msg.type || msg.type === "text") && msg.message}

                {/* Render Image do user upload */}
                {msg.type === "image" && msg.image && (
                  <img src={msg.image} alt="uploaded" style={{ maxWidth: "200px", borderRadius: "8px" }} />
                )}

                {/* Render Product List */}
                {msg.type === "product_list" && msg.products && (
                  <div className="productList">
                    {msg.products.map((p: any) => (
                      <div className="card" key={p._id}>
                        <img src={p.images?.[0] || "/default-placeholder.png"} alt={p.name} />
                        <h4>{p.name}</h4>
                        <p>{p.price}đ</p>
                        <button onClick={() => navigate("/products")}>Xem chi tiết</button>
                        <button onClick={() => addToCart(p._id)}>Thêm vào giỏ hàng</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="message aiMessage typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="inputArea">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập triệu chứng..."
              className="input"
            />

            <button onClick={sendMessage} className="button">
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;