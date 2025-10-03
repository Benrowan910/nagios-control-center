import React, { useState, useEffect } from 'react';
import { dashletRegistry } from '../utils/DashletRegistry';

interface DynamicDashletProps {
  dashletId: string;
  instance: any;
}

export default function DynamicDashlet({ dashletId, instance }: DynamicDashletProps) {
  const [DashletComponent, setDashletComponent] = useState<React.ComponentType<any> | null>(null);
  
  useEffect(() => {
    const dashletConfig = dashletRegistry.getDashlet(dashletId);
    if (dashletConfig) {
      // Since we changed DashletConfig to have 'code' instead of 'component',
      // we need to compile the code here
      try {
        const componentFunc = new Function('React', 'props', `
          ${dashletConfig.code}
          return WeatherDashlet(props);
        `);
        const CompiledComponent = componentFunc(React, { instance });
        setDashletComponent(() => CompiledComponent);
      } catch (error) {
        console.error('Error compiling dashlet:', error);
      }
    }
  }, [dashletId]);
  
  if (!DashletComponent) {
    return <div className="loading">Loading dashlet...</div>;
  }
  
  return <DashletComponent instance={instance} />;
}
