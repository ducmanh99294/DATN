import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { ChatAi } from "../api/chatApi";
import { useAuthContext } from "../context/AuthContext";
import { useNotify } from "../hooks/useNotification";

interface Message {
  role: "user" | "assistant";
  message: string;
}

const Chat: React.FC = () => {
  const {user} = useAuthContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();
  const notify = useNotify();

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
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

    if (socket?.connected) {
      socket.emit("send_message", { message: input });
    } else {
      const res = await ChatAi(input);
      setMessages(prev => [
        ...prev,
        { role: "assistant", message: res.reply }
      ]);
    }

    setInput("");
  };
console.log(messages)

  return (
    <>
      {/* Nút mở chat */}
      <div style={styles.chatIcon} onClick={() => setOpen(!open)}>
        💬
      </div>

      {open && (
        <div style={styles.chatContainer}>
          <div style={styles.header}>
            Tư vấn bác sĩ
            <span style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>
              ✖
            </span>
          </div>

          <div style={styles.chatArea}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  alignSelf:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  background:
                    msg.role === "user" ? "#0084ff" : "#f1f0f0",
                  color: msg.role === "user" ? "white" : "black"
                }}
              >
                {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputArea}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nhập triệu chứng..."
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.button}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const styles: any = {
  chatIcon: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#0084ff",
    color: "white",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  chatContainer: {
    position: "fixed",
    bottom: "90px",
    right: "20px",
    width: "350px",
    height: "500px",
    backgroundColor: "white",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  },
  header: {
    padding: "12px",
    backgroundColor: "#0084ff",
    color: "white",
    display: "flex",
    justifyContent: "space-between"
  },
  chatArea: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  message: {
    padding: "8px 12px",
    borderRadius: "18px",
    maxWidth: "70%"
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #ddd"
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "none",
    outline: "none"
  },
  button: {
    padding: "10px",
    backgroundColor: "#0084ff",
    color: "white",
    border: "none",
    cursor: "pointer"
  }
};

export default Chat;
