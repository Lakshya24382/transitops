import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('transitops_token');
    const savedUser = localStorage.getItem('transitops_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { user, token } = await authApi.login(email, password);
    localStorage.setItem('transitops_token', token);
    localStorage.setItem('transitops_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const signup = async (data) => {
    const { user, token } = await authApi.signup(data);
    localStorage.setItem('transitops_token', token);
    localStorage.setItem('transitops_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
