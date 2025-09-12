import Dashboard from "../components/Dashboard";

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-500">Monitor all your Nagios instances from one place</p>
        </div>
      </div>
      
      <Dashboard />
    </div>
  );
}