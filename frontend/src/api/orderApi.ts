// categoryApi.ts
import { apiGet, apiPost, apiPut } from "./api";

export const getMyOrder = async () => {
  return await apiGet("/api/orders/me");
};

export const getAllOrders = async (params: string) => {
  return await apiGet(`/api/orders${params}`);
};

export const getStats = async () => {
  return await apiGet(`/api/orders/stats/month`);
};

export const createOrder = async (shippingAddress: any, note: string, paymentMethod: string) => {
  return await apiPost("/api/orders", { shippingAddress, note, paymentMethod });
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

export const importOrders = async (orders: ImportOrderPayload[]) => {
  return await apiPost("/api/orders/import", { orders });
};

export interface ImportOrderPayload {
  userEmail: string;
  shippingAddress: { fullName: string; phone: string; address?: string; ward?: string; district?: string };
  note?: string;
  items: { productId: string; quantity: number }[];
}

export const updateOrderPaymentStatus = async (id: string, paymentStatus: string) => {
  return await apiPut(`/api/orders/${id}/payment-status`, { paymentStatus });
};

