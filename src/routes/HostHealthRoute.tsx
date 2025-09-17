import HostHealth from "../pages/HostHealth";
import type { XIInstance } from "../api/instances";
import { useAuth } from "../context/AuthContext";
import { useInstances } from "../context/InstanceContext";

// Type guard: verifies an arbitrary value is a full XIInstance
function isXIInstance(x: any): x is XIInstance {
  return (
    x &&
    typeof x === "object" &&
    typeof x.url === "string" &&
    typeof x.apiKey === "string"
  );
}

export default function HostHealthRoute() {
  const { authenticatedInstances } = useAuth();
  const { getInstanceById, getInstanceByUrl } = useInstances();

  if (!authenticatedInstances || authenticatedInstances.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">No authenticated instance</h1>
        <p className="mt-2 text-gray-600">
          Please authenticate an XI instance first.
        </p>
      </div>
    );
  }

  // Your AuthContext currently stores a string (id or url). Resolve it.
  const first = authenticatedInstances[0];

  let instance: XIInstance | null = null;

  if (isXIInstance(first)) {
    instance = first;
  } else if (typeof first === "string") {
    // Try id, then url
    instance = getInstanceById(first) ?? getInstanceByUrl(first) ?? null;

    // Final fallback: optional localStorage (if you use it elsewhere)
    if (!instance) {
      const raw = localStorage.getItem("selectedInstance");
      if (raw) {
        try {
          const maybe = JSON.parse(raw);
          if (isXIInstance(maybe)) {
            if (String(maybe.id) === first || maybe.url === first) {
              instance = maybe;
            } else {
              // as a last resort, still use it to avoid blocking
              instance = maybe;
            }
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  }

  if (!instance) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Unable to resolve instance</h1>
        <p className="mt-2 text-gray-600">
          The authenticated entry is a string (<code>id</code> or <code>url</code>) but could not be matched
          to a full <code>XIInstance</code>. Ensure your instance is saved in IndexedDB (via <code>addInstance</code> / <code>updateInstance</code>)
          with matching <code>id</code> or <code>url</code>.
        </p>
        <pre className="mt-4 rounded bg-gray-100 p-3 text-xs text-gray-700 overflow-auto">
{JSON.stringify({ authenticatedFirst: first }, null, 2)}
        </pre>
      </div>
    );
  }

  return <HostHealth instance={instance} />;
}
