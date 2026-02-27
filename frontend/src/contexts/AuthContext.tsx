import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run on mount

  const fetchUser = async (authToken?: string) => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data);
      if (authToken) {
        setToken(authToken);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        ...(emailOrUsername.includes('@')
          ? { email: emailOrUsername }
          : { username: emailOrUsername }),
        password,
      });

      const { token: newToken, user: userData } = response.data;
      
      // Set token and user immediately
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      if (!error.response) {
        // Network error (e.g. ECONNREFUSED = backend not running)
        throw new Error(
          'لا يمكن الاتصال بالخادم. شغّل الـ backend: cd backend ثم npm run dev'
        );
      }
      if (error.response?.status === 503) {
        throw new Error(
          'الخدمة غير متاحة. تأكد من: 1) تشغيل الـ backend (npm run dev:backend) 2) اتصال MongoDB (Atlas: أضف عنوان IP في Network Access)'
        );
      }
      const data = error.response?.data;
      const message =
        data?.message ||
        (Array.isArray(data?.errors) && data.errors[0]?.msg
          ? data.errors[0].msg
          : null);
      throw new Error(message || 'فشل تسجيل الدخول');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
