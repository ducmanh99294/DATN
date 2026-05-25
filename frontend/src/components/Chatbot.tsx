import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { ChatAi, createConversation, deleteConversation, getConversations, getMessages } from "../api/chatApi";
import { useAuthContext } from "../context/AuthContext";
import { useNotify } from "../hooks/useNotification";
import "../assets/chatbot.css";
import { useCart } from "../context/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useChatStore } from "../hooks/useChat";

interface Message {
  role: "user" | "assistant";
  type?: "text" | "image" | "product_list";
  message?: string; 
  image?: string;
  products?: any[];
  createdAt?: any;
}

export interface Conversation {
  _id: string;
  type: "ai" | "private";
  name: string;
  lastMessage?: string;
}

const Chat: React.FC = () => {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{[key: string]: Message[]}>({});
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const notify = useNotify();
  const { addToCart } = useCart();
  const [rxChatProduct, setRxChatProduct] = useState<any>(null);
  const [deleteChat,setDeleteChat] = useState<any>(false);
  const typingTimeoutRef =useRef<any>(null);
  const {
    conversations,
    selectedChat,
    setConversations,
    removeConversation,
    setSelectedChat,
    addConversation,
    updateLastMessage
  } = useChatStore();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const doctorId = searchParams.get("consultDoctorId");
    const doctorName = searchParams.get("consultDoctorName");

    if (!user || !doctorId) return;

    const openDoctorChat = async () => {
      try {
        const conversation = await createConversation(doctorId);
        const chatName = doctorName
          ? decodeURIComponent(doctorName)
          : "Bác sĩ";

        const privateChat: Conversation = {
          _id: conversation._id as string,
          type: "private",
          name: chatName,
          lastMessage: conversation.lastMessage || "Bắt đầu trò chuyện"
        };

        addConversation(privateChat);
        setSelectedChat(privateChat);
        setOpen(true);

        // Xóa query param sau khi set chat xong
        const newSearch = new URLSearchParams(location.search);
        newSearch.delete("consultDoctorId");
        newSearch.delete("consultDoctorName");
        const newSearchStr = newSearch.toString();
        navigate(
          newSearchStr
            ? `${location.pathname}?${newSearchStr}`
            : location.pathname,
          { replace: true }
        );
      } catch (error) {
        console.error("Lỗi khi mở chat tư vấn:", error);
      }
    };

    openDoctorChat();
  }, [location.search, user]);

  // tải ds chat
  const loadConversations = async () => {

    if (!user) return;

    try {

      const data = await getConversations();

      const mapped = data.map(
        (conversation: any) => {

          const otherParticipant =
            conversation.participants.find(
              (participant: any) =>
                String(participant._id)
                !== String(user._id)
            );
          return {

            _id: conversation._id,

            type: "private" as const,

            name:
              otherParticipant?.fullName ||
              otherParticipant?.name ||
              "Bác sĩ",

            avatar: otherParticipant?.image,
            lastMessage:
              conversation.lastMessage ||
              "Bắt đầu trò chuyện"

          };
        }
      );

      setConversations([
        {
          _id: "ai",
          type: "ai",
          name: "AI Assistant"
        },
        ...mapped
      ]);

    } catch (error) {

      console.error(error);

    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // get tin nhan
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat || selectedChat.type !== "private") return;
      if (chatMessages[selectedChat._id]?.length) return;

      try {
        const messages = await getMessages(selectedChat._id);
        setChatMessages((prev) => ({
          ...prev,
          [selectedChat._id]: messages.map((msg: any) => ({
            role: msg.sender._id === user?._id ? "user" : "assistant",
            type: "text",
            message: msg.message,
            createdAt: msg.createdAt
          }))
        }));
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
      }
    };

    loadMessages();
  }, [selectedChat, user]);

  const handleChatAddToCart = (p: any) => {
    if (p.prescriptionRequired) {
      setRxChatProduct(p);
      return;
    }
    addToCart(p._id);
  };

  //AI
  useEffect(() => {
    if (!socket) return;

    const handleAiReply = (data: any) => {

      if (!selectedChat) return;

      if (selectedChat?.type !== "ai") return;

      if (data.message.type === "product") {

        setChatMessages((prev: any) => ({

          ...prev,

          [selectedChat._id]: [

            ...(prev[selectedChat._id] || []),

            {
              role: "assistant",
              type: "text",
              message: data.message.message,
              createdAt:data.message.createdAt || new Date().toISOString()
            },

            {
              role: "assistant",
              type: "product_list",
              products: data.message.products,
              createdAt: data.message.createdAt || new Date().toISOString()
            }
          ]

        }));

      } else {

        setChatMessages((prev: any) => ({

          ...prev,

          [selectedChat._id]: [

            ...(prev[selectedChat._id] || []),

            {
              role: "assistant",
              type: "text",
              message:
                data.message.message ||
                "Xin lỗi, tôi không đọc được dữ liệu.",
              createdAt: data.message.createdAt || new Date().toISOString()
            }
          ]
        }));
      }

      setTypingUser("");

    };

    socket.on("ai_reply", handleAiReply);

    return () => {
      socket.off("ai_reply", handleAiReply);
    };

  }, [socket, selectedChat]);

  //USER
  useEffect(() => {

    if (!socket) return;

    const handleReceiveMessage = (msg: any) => {
      const conversationId = msg.conversationId;
      const role = msg.sender === user?._id ? "user" : "assistant";

      setChatMessages((prev) => ({
        ...prev,
        [conversationId]: [
          ...(prev[conversationId] || []),
          {
            role,
            type: "text",
            message: msg.message,
            createdAt: msg.createdAt || new Date().toISOString()
          }
        ]
      }));
    updateLastMessage(
      conversationId,
      msg.message
    );
  };

  socket.on(
    "receive_chat_message",
    handleReceiveMessage
  );

  return () => {

    socket.off(
      "receive_chat_message",
      handleReceiveMessage
    );

  };

}, [socket]);
  
  //JOIN ROOM
useEffect(() => {

  if (
    socket &&
    selectedChat &&
    selectedChat?.type === "private"
  ) {

    socket.emit(
      "join_chat",
      selectedChat._id
    );

  }

}, [selectedChat, socket]);

// TYPING
const handleInputChange = (
  e: any
) => {

  setInput(e.target.value);

  socket?.emit("typing", {
    conversationId:
      selectedChat?._id,

    userName:
      user?.fullName
  });

  clearTimeout(typingTimeoutRef.current);

  typingTimeoutRef.current = setTimeout(() => {

    socket?.emit(
      "stop_typing",
      {
        conversationId:
          selectedChat?._id
      }
    );

  }, 1000);

};

useEffect(() => {

  if (!socket) return;

  const handleUserTyping = (data: any) => {
    setTypingUser(data.userName);
  };

  const handleStopTyping = () => {
    setTypingUser("");
  };

  socket.on(
    "user_typing",
    handleUserTyping
  );

  socket.on(
    "user_stop_typing",
    handleStopTyping
  );

  return () => {

    socket.off(
      "user_typing",
      handleUserTyping
    );

    socket.off(
      "user_stop_typing",
      handleStopTyping
    );

  };

}, [socket]);

  // scroll xuống
  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth"
      });

  }, [chatMessages, typingUser]);

const sendMessage = async () => {
  if (!user) {
    notify.info(
      "Vui lòng đăng nhập để sử dụng tính năng này.",
      "Thông báo"
    );
    return;
  }

  if (!input.trim()) return;
  if (!selectedChat) return;

  const newMessage: Message = {
    role: "user",
    type: "text",
    message: input,
    createdAt: new Date().toISOString()
  };

  const currentInput = input;
  setInput("");

  if (socket?.connected) {
    if (selectedChat?.type === "ai") {
      setChatMessages((prev) => ({
        ...prev,
        [selectedChat._id]: [
          ...(prev[selectedChat._id] || []),
          newMessage
        ]
      }));
      setTypingUser("AI");

      socket.emit("send_message", {
        message: currentInput
      });
    } else {
      socket.emit("send_chat_message", {
        conversationId: selectedChat._id,
        message: currentInput
      });
      updateLastMessage(
        selectedChat._id,
        currentInput
      );
    }
  } else {
    const res = await ChatAi(currentInput);
    setChatMessages((prev: any) => ({
      ...prev,
      [selectedChat._id]: [
        ...(prev[selectedChat._id] || []),
        {
          role: "assistant",
          type: "text",
          message: res.reply,
          createdAt: new Date().toISOString()
        }
      ]
    }));
    setTypingUser("");
  }
};

const handleDeleteChat = async (conversation: string) => {
  try {
    await deleteConversation(conversation)

    removeConversation(conversation);

    setSelectedChat(null);
    setDeleteChat(false)
    notify.success("Đã xóa cuộc trò chuyện", "Thông báo")
  } catch (e) {
    console.log(e)
    notify.error("Có lỗi xảy ra", "Thông báo")
  }
}  

// format time
const shouldShowTimeDivider = (
  currentMsg: any,
  previousMsg: any
) => {
  if (!previousMsg) return true;

  const currentTime = new Date(
    currentMsg.createdAt
  );

  const previousTime = new Date(
    previousMsg.createdAt
  );

  const diffMinutes =
    (currentTime.getTime() - previousTime.getTime()) /
    (1000 * 60);

  return diffMinutes > 15;
};

const formatDividerTime = (date: string) => {
  const d = new Date(date);

  const today = new Date();

  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString(
      "vi-VN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  return d.toLocaleString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
};


return (
  <div className="chat-container">

    {/* CHAT ICON */}
    <div
      className="chatIcon"
      onClick={() => setOpen(!open)}
    >
      💬
    </div>

    {open && (

      <div className="chatContainer">

        {/* HEADER */}
        <div className="header">

          <div className="headerLeft">

            {selectedChat && (
              <>
              <button
                className="backBtn"
                onClick={() => {
                  setSelectedChat(null);
                }}
              >
                ←
              </button>
               {selectedChat?.type !== "ai" && 
               <button
                className="backBtn"
                onClick={() => setDeleteChat(true)}
              >
                <i className="fas fa-trash"></i>
              </button>
              }
              </>
            )}

            <span>
              {selectedChat
                ? selectedChat.name
                : "Tin nhắn"}
            </span>

          </div>

          <span
            className="closeBtn"
            onClick={() => setOpen(false)}
          >
            ✖
          </span>

        </div>

        {/* CHAT LIST */}
        {!selectedChat && (

          <div className="chatList">

            {conversations && conversations.map((c) => (

              <div
                key={c._id}
                className="chatItem"
                onClick={() => {

                  setSelectedChat(c);

                  // reset messages nếu muốn
                  // setMessages([]);

                }}
              >

                <div className="avatar">

                  {c.type === "ai"
                    ? "🤖"
                    : <img
                      src={c.avatar|| c.image}
                      alt={c.name}
                      className="avatarImg"
                    />
                  }

                </div>

                <div className="chatInfo">

                  <div className="chatName">
                    {c.name}
                  </div>

                  <div className="lastMessage">
                    {c.lastMessage ||
                      "Bắt đầu trò chuyện"}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* CHAT WINDOW */}
        {selectedChat && (
          <>
            <div className="chatArea">
              {(chatMessages[selectedChat?._id] || []).length === 0 ? (

                <div className="emptyChat">

                  <div className="emptyIcon">
                    {selectedChat?.type === "ai"
                      ? "🤖"
                      : "💬"}
                  </div>

                  <h3>
                    {selectedChat?.name}
                  </h3>

                  <p>

                    {selectedChat?.type === "ai"
                      ? "Hãy mô tả triệu chứng hoặc hỏi về thuốc."
                      : "Bắt đầu cuộc trò chuyện."}

                  </p>

                </div>

              ) : (
(chatMessages[selectedChat?._id] || []).map((msg, i) => (
  <React.Fragment key={i}>

    {shouldShowTimeDivider(
      msg,
      chatMessages[selectedChat?._id]?.[i - 1]
    ) && (
      <div className="chat-time-divider">
        <span>
          {formatDividerTime(
            msg.createdAt
          )}
        </span>
      </div>
    )}

    <div
      className={`message ${
        msg.role === "user"
          ? "userMessage"
          : "aiMessage"
      }`}
    >
      <div className="message-content">

        {/* TEXT */}
        {(!msg.type ||
          msg.type === "text") &&
          msg.message}

        {/* PRODUCT LIST */}
        {msg.type === "product_list" &&
          msg.products && (
            <div className="productList">
              {msg.products.map((p: any) => (
                <div
                  className="card"
                  key={p._id}
                >
                  <img
                    src={
                      p.images?.[0] ||
                      "/default-placeholder.png"
                    }
                    alt={p.name}
                  />

                  <h4>{p.name}</h4>

                  <p>{p.price}đ</p>

                  <button
                    onClick={() =>
                      navigate("/products")
                    }
                  >
                    Xem chi tiết
                  </button>

                  <button
                    onClick={() =>
                      handleChatAddToCart(p)
                    }
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              ))}
            </div>
        )}

      </div>
    </div>

  </React.Fragment>
))
              )}
              {/* TYPING */}
              {typingUser && (

                <div className="message aiMessage typing">

                  <span className="typingText">

                    {typingUser}
                    {" đang nhập..."}

                  </span>
                  
                  {/* <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span> */}

                </div>

              )}
              <div ref={messagesEndRef} />
            </div>
            {/* INPUT */}
            <div className="inputArea">

              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  sendMessage()
                }
                placeholder={
                  selectedChat?.type === "ai"
                    ? "Nhập triệu chứng..."
                    : "Nhập tin nhắn..."
                }
                className="input"
              />

              <button
                onClick={sendMessage}
                className="button"
              >
                Gửi
              </button>

            </div>
          </>
        )}

        {/* PRESCRIPTION MODAL */}
        {rxChatProduct && (

          <div
            className="chat-rx-overlay"
            onClick={() =>
              setRxChatProduct(null)
            }
          >

            <div
              className="chat-rx-dialog"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <h4>
                Thuốc kê đơn
              </h4>

              <p>

                <strong>
                  {rxChatProduct.name}
                </strong>

                {" "}
                cần đơn bác sĩ. Sau khi
                thêm vào giỏ, hãy tải
                ảnh đơn trong trang giỏ hàng.

              </p>

              <div className="chat-rx-btns">

                <button
                  type="button"
                  onClick={() =>
                    setRxChatProduct(null)
                  }
                >
                  Hủy
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={() => {

                    addToCart(
                      rxChatProduct._id
                    );

                    setRxChatProduct(null);

                  }}
                >
                  Thêm vào giỏ
                </button>

              </div>

            </div>

          </div>

        )}

        {deleteChat && selectedChat && (
          <div className="delete-chat-overlay">
            <div className="delete-chat-modal">
              <div className="delete-chat-icon">
                ⚠️
              </div>

              <h3>Xác nhận xóa cuộc trò chuyện</h3>

              <p>
                Bạn có chắc muốn xóa cuộc trò chuyện này không?
                Toàn bộ tin nhắn sẽ bị xóa và không thể khôi phục.
              </p>

              <div className="delete-chat-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setDeleteChat(false)}
                >
                  Hủy
                </button>

                <button
                  className="delete-btn"
                  onClick={()=>handleDeleteChat(selectedChat._id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

{!user && (
  <div className="login-required">
    <span className="login-icon">🔒</span>

    <h3>Đăng nhập để tiếp tục</h3>

    <p>
      Vui lòng đăng nhập để sử dụng tính năng trò chuyện
      với bác sĩ.
    </p>

    <button
      className="login-btn"
      onClick={() => navigate("/login")}
    >
      Đăng nhập ngay
    </button>
  </div>
)}
      </div>

    )}

  </div>
);
};

export default Chat;


