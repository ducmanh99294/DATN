import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  getMe,
} from '../api/authApi';
import { getDoctorById } from '../api/doctorApi.ts';

export const useAuth = () => {
  const { setUser, setDoctor, setLoading } = useAuthContext();

  const fetchMe = async () => {
    try {
      setLoading(true);
      const user = await getMe();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
    return {fetchMe};
  };

  const fetchDoctor = async (id: any) => {
    try {
      setLoading(true);
      const doctor = await getDoctorById(id);
      setDoctor(doctor);
    } catch {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchMe,
    fetchDoctor,
  };
};
