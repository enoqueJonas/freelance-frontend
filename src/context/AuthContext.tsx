/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, WorkerProfile, EmployerProfile, Notification } from '../types';
import { mockApi } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  profile: WorkerProfile | EmployerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (emailOrUsername: string) => Promise<boolean>;
  register: (payload: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'employer' | 'worker';
    companyName?: string;
    title?: string;
    bio?: string;
    industry?: string;
    skills?: string[];
    location: string;
  }) => Promise<boolean>;
  logout: () => void;
  uploadDocument: (documentUrl: string) => Promise<boolean>;
  updateProfile: (payload: any) => Promise<boolean>;
  notifications: Notification[];
  unreadCount: number;
  refreshUserData: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<WorkerProfile | EmployerProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user session from localStorage on initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('serviplus_session_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          // Re-fetch everything from API to ensure fresh state
          const res = await mockApi.auth.login(parsedUser.email);
          if (res) {
            setUser(res.user);
            setProfile(res.profile || null);
            
            // Fetch notifications
            const activeNotifications = await mockApi.notifications.list(res.user.id);
            setNotifications(activeNotifications);
          } else {
            // Clean up stale session
            localStorage.removeItem('serviplus_session_user');
          }
        }
      } catch (err) {
        console.error('Falha de inicialização de autenticação', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Poll notifications occasionally to match a live server feel
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const activeNotifications = await mockApi.notifications.list(user.id);
        setNotifications(activeNotifications);
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [user]);

  const login = async (emailOrUsername: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mockApi.auth.login(emailOrUsername);
      if (res) {
        setUser(res.user);
        setProfile(res.profile || null);
        localStorage.setItem('serviplus_session_user', JSON.stringify(res.user));
        
        // Fetch notifications
        const activeNotifications = await mockApi.notifications.list(res.user.id);
        setNotifications(activeNotifications);
        
        return true;
      } else {
        setError('Nenhum utilizador encontrado com este email / username.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro durante o login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'employer' | 'worker';
    companyName?: string;
    title?: string;
    bio?: string;
    industry?: string;
    skills?: string[];
    location: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mockApi.auth.register(payload);
      setUser(res.user);
      setProfile(res.profile);
      localStorage.setItem('serviplus_session_user', JSON.stringify(res.user));
      setNotifications(await mockApi.notifications.list(res.user.id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro durante o registo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setNotifications([]);
    localStorage.removeItem('serviplus_session_user');
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const res = await mockApi.auth.login(user.email);
      if (res) {
        setUser(res.user);
        setProfile(res.profile || null);
      }
    } catch (err) {
      console.error('Error refreshing session', err);
    }
  };

  const uploadDocument = async (documentUrl: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const success = await mockApi.auth.uploadVerificationDocument(user.id, documentUrl);
      if (success) {
        await refreshUserData();
        const activeNotifications = await mockApi.notifications.list(user.id);
        setNotifications(activeNotifications);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateProfile = async (payload: any): Promise<boolean> => {
    if (!user) return false;
    try {
      const updated = await mockApi.auth.updateProfile(user.id, user.role as 'worker' | 'employer', payload);
      if (updated) {
        setProfile(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const markNotificationRead = async (id: number) => {
    if (!user) return;
    try {
      await mockApi.notifications.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await mockApi.notifications.markAllRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        uploadDocument,
        updateProfile,
        notifications,
        unreadCount,
        refreshUserData,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
