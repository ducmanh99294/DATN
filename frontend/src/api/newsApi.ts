import { apiPost, apiGet, apiDelete, apiPut } from "./api";

// public
export const getAllNews = async (params: string = "") => {
  return await apiGet(`/api/news${params}`);
};

export const getNewsBySlug = async (slug: string) => {
  return await apiGet(`/api/news/slug/${slug}`);
};

export const likeNews = async (id: string) => {
  return await apiPost(`/api/news/${id}/like`, {});
};

// admin
export const createNews = async (data: any) => {
  return await apiPost(`/api/news`, data);
};

export const updateNews = async (id: string, data: any) => {
  return await apiPut(`/api/news/${id}`, data);
};

export const deleteNews = async (id: string) => {
  return await apiDelete(`/api/news/${id}`);
};

export const importNews = async (news: { title: string; summary?: string; content?: string; category: string }[]) => {
  return await apiPost("/api/news/import", { news });

};