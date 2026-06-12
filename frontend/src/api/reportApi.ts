import { apiGet } from "./api";

export const getReports = async (params: string) => {
    console.log(apiGet(`/api/reports${params}`))
  return await apiGet(`/api/reports${params}`);
};

export const getReportByMonth = async () => {
  return await apiGet(`/api/orders/stats/month`);
};