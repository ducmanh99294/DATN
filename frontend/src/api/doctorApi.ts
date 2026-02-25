import {apiGet,apiPut,} from './api'

export const getDoctor = async () => {
    return await apiGet("/api/doctor");
};

export const getDoctorById = async (_id: string) => {
    return await apiGet(`/api/doctor/${_id}`);
};

export const getDoctorBySpecialty = async (_id: string) => {
    return await apiGet(`/api/doctor/specialty/${_id}`);
};

export const updateDoctor = async (
        _id: string,
        specialtyId: string,
        experienceYears: string,
        qualifications: string,
        description: string,
        price: string) => {
    return await apiPut(`/api/doctor/${_id}`,{
        specialtyId,
        experienceYears,
        qualifications,
        description,
        price
    });
};
