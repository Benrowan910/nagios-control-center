import { useParams, Link } from "react-router-dom";
import { INSTANCES } from "../api/instances";
import InstanceDashboard from "../components/InstanceDashboard";

export default function Instance() {
  const { id } = useParams();
  const instance = INSTANCES.find((i) => i.id === id);

  if (!instance) {
    return <div className="p-6">Instance not found</div>;
  }

  return (
    <div className="p-6">
      <Link to="/" className="text-blue-500 underline">&larr; Back</Link>
      <InstanceDashboard instance={instance} />
    </div>
  );
}
