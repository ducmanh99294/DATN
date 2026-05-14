import { create } from "zustand";
import type { Conversation } from "../components/Chatbot";

interface ChatStore {
  conversations: any[];

  selectedChat: Conversation | null;
  
  setConversations: (
    conversations: any[]
  ) => void;

  setSelectedChat: (
    chat: Conversation | null
  ) => void;

  addConversation: (
    conversation: any
  ) => void;

  removeConversation: (
    id: string
  ) => void;

  updateLastMessage: (
    id: string,
    message: string
  ) => void;
}

export const useChatStore =
  create<ChatStore>((set) => ({

    conversations: [],

    selectedChat: null,

    setConversations: (conversations) =>
      set({ conversations }),

    setSelectedChat: (chat) =>
      set({ selectedChat: chat }),

    addConversation: (conversation) =>
      set((state) => ({
        conversations: [
          ...state.conversations,
          conversation,
        ]
      })),

    removeConversation: (id) =>
      set((state) => ({
        conversations:
          state.conversations.filter(
            (c) => c._id !== id
          )
      })),

    updateLastMessage: (
      id,
      message
    ) =>
      set((state) => {

        const aiChat =
          state.conversations.find(
            (c) => c.type === "ai"
          );

        const updated =
          state.conversations
            .filter((c) => c.type !== "ai")
            .map((c) =>

              c._id === id
                ? {
                    ...c,
                    lastMessage: message
                  }
                : c

            );

        const activeChat =
          updated.find(
            (c) => c._id === id
          );

        const others =
          updated.filter(
            (c) => c._id !== id
          );

        return {

          conversations: [

            ...(aiChat ? [aiChat] : []),

            ...(activeChat
              ? [activeChat]
              : []),

            ...others

          ]

        };
      })
  }));