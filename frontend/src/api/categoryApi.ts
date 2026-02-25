// categoryApi.ts
import { apiGet } from "./api";

export const getCategories = async () => {
  return await apiGet("/api/categories");
};
