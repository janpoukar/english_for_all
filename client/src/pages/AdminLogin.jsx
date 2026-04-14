import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authData = await loginAdmin(email, password);
      if (!authData?.user || !authData?.token) {
        throw new Error("Email nebo heslo není správné");
      }
      localStorage.setItem("user", JSON.stringify(authData.user));
      localStorage.setItem("authToken", authData.token);
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message || "Přihlášení správce selhalo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-hard p-8 border border-gray-200">
        <div className="text-center mb-8">
          <p className="text-3xl mb-3">🛠️</p>
          <h1 className="text-2xl font-black text-slate-900">Správa Stránky</h1>
          <p className="text-gray-600 text-sm mt-1">Přihlášení pro správce</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email správce</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              placeholder="admin@english.local"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 text-white font-bold py-3 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Přihlašuji..." : "Přihlásit správce"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-700 hover:text-blue-800 font-semibold">
            ← Zpět na běžné přihlášení
          </Link>
        </div>
      </div>
    </main>
  );
}
