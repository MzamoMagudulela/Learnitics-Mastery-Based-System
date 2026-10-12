import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('learnitics_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('learnitics_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate current user on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('learnitics_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.user) {
            setCurrentUser(res.data.user);
            localStorage.setItem('learnitics_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          localStorage.removeItem('learnitics_token');
          localStorage.removeItem('learnitics_user');
          setCurrentUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user } = res.data;

      localStorage.setItem('learnitics_token', receivedToken);
      localStorage.setItem('learnitics_user', JSON.stringify(user));

      setToken(receivedToken);
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async ({ fullName, email, password, confirmPassword }) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', {
        fullName,
        email,
        password,
        confirmPassword,
        role: 'student',
      });
      const { token: receivedToken, user } = res.data;

      localStorage.setItem('learnitics_token', receivedToken);
      localStorage.setItem('learnitics_user', JSON.stringify(user));

      setToken(receivedToken);
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Verify credentials without committing auth session immediately (for security challenge)
  const verifyCredentials = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Complete login after security verification
  const completeLogin = ({ token: receivedToken, user }) => {
    localStorage.setItem('learnitics_token', receivedToken);
    localStorage.setItem('learnitics_user', JSON.stringify(user));
    setToken(receivedToken);
    setCurrentUser(user);
    return { success: true, user };
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('learnitics_token');
    localStorage.removeItem('learnitics_user');
    setCurrentUser(null);
    setToken(null);
    setError(null);
  };

  const role = currentUser?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser, // Alias
        token,
        role,
        loading,
        error,
        login,
        verifyCredentials,
        completeLogin,
        register,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
