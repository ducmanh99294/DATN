import { apiDelete, apiGet, apiPost } from "./api";

export const ChatAi = async (message: string) => {
  return await apiPost("/api/chatbot/chat", { message });
};

export const createConversation = async (receiverId: string) => {
  return await apiPost("/api/chatbot/conversation", { receiverId });
};

export const getConversations = async () => {
  return await apiGet("/api/chatbot/conversation");
};

export const getMessages = async (conversationId: string) => {
  return await apiGet(`/api/chatbot/messages/${conversationId}`);
};

export const deleteConversation = async (conversationId: string) => {
  return await apiDelete(`/api/chatbot/conversation/${conversationId}`);
};