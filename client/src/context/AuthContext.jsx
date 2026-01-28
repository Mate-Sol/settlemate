import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('credmate_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('credmate_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // For now, simulate login with mock data
      const mockUsers = {
        'psp@credmate.com': { id: '1', email: 'psp@credmate.com', role: 'PSP', name: 'Acme Payments' },
        'cro@credmate.com': { id: '2', email: 'cro@credmate.com', role: 'CRO', name: 'John Risk' },
        'cfo@credmate.com': { id: '3', email: 'cfo@credmate.com', role: 'CFO', name: 'Sarah Finance' },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const userData = mockUsers[email.toLowerCase()];
      if (userData && password === 'demo123') {
        setUser(userData);
        localStorage.setItem('credmate_user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('credmate_user');
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
