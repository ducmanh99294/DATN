import {apiDelete, apiGet,apiPost, apiPut,} from './api'

export const loginApi = async (email:string,password:string) => { 
    return await apiPost('/api/auth/login',{email,password});
}

export const loginWithGoogleApi = async () => { 
    return await apiGet('/api/auth/google');
}

export const loginWithFacebookApi = async () => { 
    return await apiGet('/api/auth/facebook');
}

export const registerApi = async (andress:string,dateOfBirth:string,email:string,fullName:string,gender:string,password:string,phone:string,) => {
    return await apiPost('/api/auth/register', 
        {   
            fullName,
            email,
            phone, 
            andress, 
            dateOfBirth,
            gender,
            password,
        }
    );
}

export const getMe = async () => {
    return await apiGet("/api/auth/me");
};

export const logoutApi = async () => {
    return await apiPost("/api/auth/logout",{});
};

export const updateProfile = async (fullName: string, phone: string, email: string, gender: string) => {
    return await apiPut(`/api/auth/profile`,{
      fullName,phone,email,gender
    });
};

export const updateUser = async (userId: string, formData: any) => {
    console.log(userId,
      formData)
    return await apiPut(`/api/auth/update/${userId}`,
     formData
    );
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
    return await apiPut("/api/auth/change-password",{
      oldPassword, newPassword
    });
};

export const updateAvatar = async (image: FormData) => {
    return await apiPut("/api/auth/avatar", image);
};

export const getAllUsers = async (params = "") => {    
  return await apiGet(`/api/auth${params}`);
};

export const createUser = async (data: any) => {
  return await apiPost(`/api/auth`, data);
}

export const deleteUser = async (id: any) => {
  return await apiDelete(`/api/auth/users/${id}`);
}

export const banUser = async (id: string, reason: string) => {
  return await apiPut(`/api/auth/${id}/ban`, { reason });
}

export const unbanUser = async (id: string) => {
  return await apiPut(`/api/auth/${id}/unban`, {});
}

export const importUsers = async (users: any[]) => {
  return await apiPost("/api/auth/import", { users });
};
