import GridLayout from "../components/GridLayout";
import Dashlet from "../components/Dashlet";
import InstanceManager from "../components/InstanceManager";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";

export default function Home() {
  const { instances, addInstance, updateInstance, loading } = useInstances();
  const { authenticatedInstances } = useAuth();

  if (loading) {
    return (
      <div className="header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="small">Loading instances...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="small">
            Monitor all your Nagios instances from one place
          </p>
        </div>
      </div>

      <InstanceManager onInstanceAdded={addInstance} />

      {/* Dashlet Grid */}
      <GridLayout onLayoutChange={undefined}>
        {instances.map((instance) => (
          <div key={instance.id}>
            <Dashlet 
              instance={instance}
              isAuthenticated={authenticatedInstances.includes(instance.id)}
              onInstanceUpdate={updateInstance}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}