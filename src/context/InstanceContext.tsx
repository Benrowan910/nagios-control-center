import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { XIInstance } from '../api/instances';
import { getInstances, saveInstance, deleteInstance } from '../utils/db';

interface InstanceContextType {
  instances: XIInstance[];
  loading: boolean;
  addInstance: (instance: XIInstance) => Promise<void>;
  updateInstance: (instance: XIInstance) => Promise<void>;
  removeInstance: (id: string) => Promise<void>;
  getInstanceById: (id: string | number) => XIInstance | undefined;
  getInstanceByUrl: (url: string) => XIInstance | undefined;
}

const InstanceContext = createContext<InstanceContextType | undefined>(undefined);

export const useInstances = () => {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstances must be used within an InstanceProvider');
  }
  return context;
};

interface InstanceProviderProps {
  children: ReactNode;
}

export const InstanceProvider: React.FC<InstanceProviderProps> = ({ children }) => {
  const [instances, setInstances] = useState<XIInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Load instances from IndexedDB on component mount
  useEffect(() => {
    const loadInstances = async () => {
      try {
        setLoading(true);
        const savedInstances = await getInstances();
        setInstances(savedInstances ?? []);
      } catch (e) {
        console.error("Error loading instances from DB:", e);
        setInstances([]);
      } finally {
        setLoading(false);
      }
    };

    loadInstances();
  }, []);

  const addInstance = async (instance: XIInstance) => {
    try {
      await saveInstance(instance);
      setInstances(prev => [...prev, instance]);
    } catch (e) {
      console.error("Error saving instance:", e);
    }
  };

  const updateInstance = async (updatedInstance: XIInstance) => {
    try {
      await saveInstance(updatedInstance);
      setInstances(prev =>
        prev.map(instance =>
          instance.id === updatedInstance.id ? updatedInstance : instance
        )
      );
    } catch (e) {
      console.error("Error updating instance:", e);
    }
  };

  const removeInstance = async (id: string) => {
    try {
      await deleteInstance(id);
      setInstances(prev => prev.filter(instance => instance.id !== id));
    } catch (e) {
      console.error("Error deleting instance:", e);
    }
  };

  const getInstanceById = (id: string | number) =>
    instances.find(i => String(i.id) === String(id));

  const getInstanceByUrl = (url: string) =>
    instances.find(i => i.url === url);

  const value = useMemo<InstanceContextType>(() => ({
    instances,
    loading,
    addInstance,
    updateInstance,
    removeInstance,
    getInstanceById,
    getInstanceByUrl,
  }), [instances, loading]);

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
};
