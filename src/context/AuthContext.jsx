import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      setUserState(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      const profile = res.data || res;
      setUserState(profile);
    } catch {
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleUnauthorized = () => {
      setUserState(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshProfile]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const receivedUser = res.data?.user;
    setUserState(receivedUser);
    return receivedUser;
  };

  const value = {
    user,
    role: user?.role,
    isAdminPusat: user?.role === 'ADMIN_PUSAT',
    isAdminDesa: user?.role === 'ADMIN_DESA',
    desaId: user?.desa_id,
    desa: user?.desa,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
