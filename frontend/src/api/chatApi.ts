import { apiPost } from "./api";

export const ChatAi = async (message: string) => {
  return await apiPost("/api/chatbot/chat", { message });
};
