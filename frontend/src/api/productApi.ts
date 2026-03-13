import { apiDelete, apiGet, apiPost, apiPut } from "./api";

export const getAllProducts = async (params: string) => {
  return await apiGet(`/api/products${params}`);
};

export const getProductsById = async (id: string) => {
  return await apiGet(`/api/products/${id}`);
};
export const createProducts = async (data: any) => {

  return await apiPost(`/api/products/create`, data);
};

export const updateProduct = async (id: string, data: any) => {
    return await apiPut(`/api/products/${id}`, data);
};

export const updateStatusProduct = async (id: string) => {
    return await apiPut(`/api/products/${id}/status`, {});
};

export const deleteProduct = async (id: string) => {
  return await apiDelete(`/api/products/${id}`);
};

export interface ImportProductPayload {
  name: string;
  category: string;
  description?: string;
  price?: number;
  discount?: number;
  stock?: number;
  useFors?: string;
  uses?: string;
  sideEffects?: string;
}

export const importProducts = async (products: ImportProductPayload[]) => {
  return await apiPost("/api/products/import", { products });
};