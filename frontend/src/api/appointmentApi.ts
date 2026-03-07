import {apiGet,apiPost, apiPut,} from './api'

export const createAppoinmentApi = async (doctorId: string, patientId: string, specialtyId: string, slotId: string, symptoms: string[], description: string, price: number) => { 
    return await apiPost('/api/appointment',{doctorId, patientId, specialtyId, slotId, symptoms, description, price});
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

export const cancelAppointment = async (id: string, reason: string) => {
    return await apiPut(`/api/appointment/${id}/cancel`, {reason});
};
