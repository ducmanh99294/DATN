// categoryApi.ts
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export const getAllSpecially = async () => {
  return await apiGet("/api/specially");
};

export const getSpeciallyById = async () => {
  return await apiGet("/api/specially");
};

export const getSpeciallyBySlug = async (slug: string) => {
  return await apiGet(`/api/specially/slug/${slug}`);
};

export const createSpecially = async (shippingAddress: any,note: string) => {
  return await apiPost("/api/specially",{shippingAddress, note});
};

export const updateSpecially = async (id: string, status: string) => {
  return await apiPut(`/api/specially/${id}`,{status});
};

export const deleteSpecially = async (id: string) => {
  return await apiDelete(`/api/specially/${id}`);
};