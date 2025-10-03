import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("sessionId", data.session_id);
      localStorage.setItem("loggedIn", "true");
      onLogin();
    } else {
      setError(data.message || "Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-gray-800 rounded shadow-md"
      >
        <h1 className="text-xl mb-4">Login</h1>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <input
          className="block mb-2 p-2 w-full bg-gray-700 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="block mb-2 p-2 w-full bg-gray-700 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-green-500 px-4 py-2 rounded w-full">
          Login
        </button>
      </form>
    </div>
  );
}
