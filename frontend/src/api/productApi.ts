import { apiGet } from "./api";

export const getProducts = async (params?: {
  keyword?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {

  const query = new URLSearchParams();

  if (params?.keyword) query.append("keyword", params.keyword);
  if (params?.category) query.append("category", params.category);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  return await apiGet(`/api/products?${query.toString()}`);
};
