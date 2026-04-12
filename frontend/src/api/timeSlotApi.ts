import {apiDelete, apiGet,apiPost, apiPut,} from './api'

export const getSlotsByDoctorAndDateApi = async (doctorId: string, date: string) => {
    return await apiGet(`/api/timeSlot?doctorId=${doctorId}&date=${date}`);
};

export const getSlotsByDoctorAndWeekApi = async (doctorId: string, startDate: string) => {
    // console.log()
    return await apiGet(`/api/timeSlot/week?doctorId=${doctorId}&startDate=${startDate}`);
};

export const createTimeSlotApi = async (doctorId:string, date:string, startTime:string, endTime:string) => {
    return await apiPost(`/api/timeSlot/generate`,{
        doctorId, date, startTime, endTime, slotDuration: 30
    });
};

export const updateTimeSlotApi = async (id: string, status: string) => {
    return await apiPut(`/api/timeSlot/${id}`,{
        status
    });
};

export const deleteTimeSlotApi = async (id: string) => {
    return await apiDelete(`/api/timeSlot/${id}`);
};

export const holdSlot = async (id: string) => {
    return await apiPut(`/api/timeSlot/hold/${id}`,{});
};

export const releaseSlot = async (id: string) => {
    return await apiPut(`/api/timeSlot/release/${id}`,{});
};