// components/DynamicDashlet.tsx
import { dashletRegistry } from '../utils/dashletRegistry';

interface DynamicDashletProps {
  dashletId: string;
  instance: any; // Your instance object
}

export default function DynamicDashlet({ dashletId, instance }: DynamicDashletProps) {
  const [DashletComponent, setDashletComponent] = useState<React.ComponentType<any> | null>(null);
  
  useEffect(() => {
    const dashletConfig = dashletRegistry.getDashlet(dashletId);
    if (dashletConfig) {
      setDashletComponent(() => dashletConfig.component);
    }
  }, [dashletId]);
  
  if (!DashletComponent) {
    return <div className="loading">Loading dashlet...</div>;
  }
  
  return <DashletComponent instance={instance} />;
}