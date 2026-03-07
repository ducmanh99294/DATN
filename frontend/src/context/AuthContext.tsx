import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getMe, logoutApi } from '../api/authApi';
import { getDoctorById } from '../api/doctorApi';

export interface User {
  _id: string;
  email: string;
  phone?: string;
  gender?: string;
  fullName: string;
  image?: string;
  password: string;
  role?: 'patient' | 'doctor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  doctor: any,
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setDoctor: (doctor: any) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  //loading
  const [isLoading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const me = await getMe();
        setUser(me);

        if (me?.role === 'doctor') {
          const doctorData = await getDoctorById(me._id);
          setDoctor(doctorData);
        }
      } catch {
        setUser(null);
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setDoctor(null);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        doctor,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        setDoctor,
        setLoading,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
