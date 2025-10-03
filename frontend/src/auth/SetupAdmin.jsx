import { useState } from "react";

export default function SetupAdmin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/setup-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded shadow-md">
        <h1 className="text-xl mb-4">Create Admin User</h1>
        <input
          className="block mb-2 p-2 w-full bg-gray-700 rounded"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="block mb-2 p-2 w-full bg-gray-700 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-500 px-4 py-2 rounded w-full">
          Create Admin
        </button>
      </form>
    </div>
  );
}
