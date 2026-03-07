// categoryApi.ts
import { apiGet, apiPost, apiPut } from "./api";

export const getMyOrder = async () => {
  return await apiGet("/api/orders/me");
};

export const getAllOrders = async (params: string) => {
  return await apiGet(`/api/orders${params}`);
};

export const createOrder = async (shippingAddress: any,note: string) => {
  return await apiPost("/api/orders",{shippingAddress, note});
};

export const getOrderById = async (id: string) => {
  return await apiGet(`/api/orders/${id}`);
};

export const updateOrderStatus = async (id: string, status: string) => {
  return await apiPut(`/api/orders/${id}/status`,{status});
};

export const cancelOrder = async (id: string, reason: string) => {
  return await apiPut(`/api/orders/${id}/cancel`,{reason});
};