import { INSTANCES, NInstance } from "../api/instances";
import Dashlet from "./Dashlet";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Nagios Fusion Lite</h1>
        <Link
          to="/settings"
          className="px-4 py-2 rounded-lg shadow bg-gray-100 hover:bg-gray-200 transition"
        >
          ⚙️ Settings
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INSTANCES.map((inst) => (
          <Dashlet key={inst.id} instance={inst} isAuthenticated={false} onInstanceUpdate={function (instance: NInstance): void {
            throw new Error("Function not implemented.");
          } } onInstanceDelete={function (instanceId: string): void {
            throw new Error("Function not implemented.");
          } } />
        ))}
      </div>
    </div>
  );
}
