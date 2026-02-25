import {apiDelete, apiGet,apiPost,} from './api'

export const createAvailableApi = async (doctorId:string,date:Date,startTime:string,endTime:string,maxPatinets: number) => { 
    return await apiPost('/api/doctor-availability',{doctorId,date,startTime,endTime,maxPatinets});
}

export const getAvailableByDoctor = async (id: string) => {
    return await apiGet(`/api/doctor-availability/doctor/${id}`);
};

export const deleteAvailable = async (id: string) => {
    return await apiDelete(`/api/doctor-availability/${id}`);
};