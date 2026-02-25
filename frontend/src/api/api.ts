import { request } from "./base";

export const apiGet = <T = any>(url: string): Promise<T> =>
  request<T>("GET", url);

export const apiPost = <T = any, D = any>(
  url: string,
  data: D
): Promise<T> => request<T>("POST", url, data);

export const apiPut = <T = any, D = any>(
  url: string,
  data: D
): Promise<T> => request<T>("PUT", url, data);

export const apiDelete = <T = any>(url: string): Promise<T> =>
  request<T>("DELETE", url);
