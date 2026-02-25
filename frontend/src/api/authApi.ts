import {apiGet,apiPost, apiPut,} from './api'

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
    return await apiPut("/api/auth/profile",{
      fullName,phone,email,gender
    });
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
    return await apiPut("/api/auth/change-password",{
      oldPassword, newPassword
    });
};

export const updateAvatar = async (image: File | string) => {
    return await apiPut("/api/auth/avatar",{image});
};