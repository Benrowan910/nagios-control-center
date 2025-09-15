import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  authenticatedInstances: string[];
  authenticateInstance: (instanceId: string) => void;
  logoutInstance: (instanceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authenticatedInstances, setAuthenticatedInstances] = useState<string[]>([]);

  const authenticateInstance = (instanceId: string) => {
    setAuthenticatedInstances(prev => [...prev, instanceId]);
  };

  const logoutInstance = (instanceId: string) => {
    setAuthenticatedInstances(prev => prev.filter(id => id !== instanceId));
  };

  return (
    <AuthContext.Provider value={{ authenticatedInstances, authenticateInstance, logoutInstance }}>
      {children}
    </AuthContext.Provider>
  );
};