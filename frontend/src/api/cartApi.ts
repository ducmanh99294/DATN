import { apiDelete, apiGet, apiPut, apiPost } from "./api";

export const addToCartApi = (productId: string) => {
  return apiPost("/api/carts/add", {
    productId,
    quantity: 1,
  });
};

export const updateCart = (productId: string, quantity:number) => {
  return apiPut(`/api/carts/item/${productId}`, {
    productId,
    quantity,
  });
};

export const deleteItems = (productId: string) => {
  return apiDelete(`/api/carts/item/${productId}`);
};

export const clearCartApi = () => {
  return apiDelete("/api/carts/clear");
};

export const getCart = () => {
  return apiGet(`/api/carts`);
};