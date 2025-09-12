import { Link } from "react-router-dom";
import { XIInstance } from "../api/instances";

export default function Dashlet({ instance }: { instance: XIInstance }) {
  return (
    <Link
      to={`/instance/${instance.id}`}
      className="block bg-white rounded-xl shadow hover:shadow-lg transition p-4 border border-gray-200"
    >
      <h3 className="text-lg font-semibold text-primary mb-2">{instance.name}</h3>
      <p className="text-sm text-gray-600">API: {instance.url}</p>
    </Link>
  );
}
