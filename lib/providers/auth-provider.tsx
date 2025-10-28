'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient } from '../api-client';
import { toast } from 'sonner';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  status: string;
  permissions: string[];
  preferences: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const response = await api.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data.user);
          } else {
            // Invalid token, clear it
            apiClient.setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          apiClient.setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);

      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        setUser(user);
        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => {
    try {
      const response = await api.register(data);

      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        setUser(user);
        toast.success('Registration successful!');
        router.push('/dashboard');
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
    router.push('/login');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
