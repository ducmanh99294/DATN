import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { ChatAi } from "../api/chatApi";
import { useAuthContext } from "../context/AuthContext";
import { useNotify } from "../hooks/useNotification";
import "../assets/chatbot.css"
interface Message {
  role: "user" | "assistant";
  message: string;
}

const Chat: React.FC = () => {
  const {user} = useAuthContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();
  const notify = useNotify();

  useEffect(() => {
    if (!socket) return;

socket.on("ai_reply", (data) => {

  const sentences = data.message
    .split(/(?<=[.!?])\s+/) // tách sau . ? !
    .filter((s: string) => s.trim() !== "");

  setMessages(prev => [
    ...prev,
    ...sentences.map((s: string) => ({
      role: "assistant",
      message: s
    }))
  ]);

  setIsTyping(false);
});
    return () => {
      socket.off("ai_reply");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if(!user) {
      notify.info("Vui lòng đăng nhập để sử dụng tính năng này.", "Thông báo");
      return;
    };
    if (!input.trim()) return;

    const newMessage = { role: "user", message: input };
    setMessages((prev:any) => [...prev, newMessage]);

    setIsTyping(true);
    
    if (socket?.connected) {
      socket.emit("send_message", { message: input });
    } else {
      const res = await ChatAi(input);
      setMessages(prev => [
        ...prev,
        { role: "assistant", message: res.reply }
      ]);
      setIsTyping(false);
    }

    setInput("");
  };

const formatParagraph = (text: string) => {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .replace(/\n{2,}/g, "\n\n");
};
  console.log(messages)

  return (
    <div className="chat-container">
      {/* Nút mở chat */}
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
              <div
                key={i}
                className={`message ${
                  msg.role === "user" ? "userMessage" : "aiMessage"
                }`}
              >
                {msg.message}
              </div>
            ))}

            {/* AI typing */}
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
}

export default Chat;