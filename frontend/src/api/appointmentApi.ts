import {apiGet,apiPost, apiPut,} from './api'

export const createAppoinmentApi = async (doctorId: string, patientId: string, specialtyId: string, slotId: string, symptoms: string[], description: string, ) => { 
    return await apiPost('/api/appointment',{doctorId, patientId, specialtyId, slotId, symptoms, description});
}

export const getMyAppointment = async () => {
    return await apiGet('/api/appointment/me')
}

export const getDoctorAppointments = async () => {
    return await apiGet(`/api/appointment/doctor`)
}

export const confirmAppointmentApi = async (id: string) => {
    return await apiPut(`/api/appointment/${id}/confirm`,{});
};

export const getDoctorById = async (_id: string) => {
    return await apiGet(`/api/doctor/${_id}`);
};
