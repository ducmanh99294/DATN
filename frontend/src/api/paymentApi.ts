import { apiGet, apiPost } from "./api";

export const getPaymentUrl = async (data: any) => {
    return await apiPost(`/api/payments/create-payment`, data);
};

export const vnpayReturn = async () => {
    return await apiGet(`/api/payments/vnpay_ipn`);
};