import { apiGet } from "./api";

export interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  order?: number;
}

export const getAllFaqs = async (): Promise<FaqItem[]> => {
  return await apiGet<FaqItem[]>("/api/faq");
};
