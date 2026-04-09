import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/auth/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Chyba při načítání uživatelů");

      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) {
      setError("Vyber uživatele a vlož heslo");
      return;
    }

    if (newPassword.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      return;
    }

    setChanging(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/auth/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess("Heslo bylo změněno!");
      setNewPassword("");
      setSelectedUserId(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-red-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-300 to-red-300 bg-clip-text text-transparent mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-300">Správa uživatelů a hesel</p>
        </div>

        <Card className="bg-white/95 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Změna hesla</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">✅ {success}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vyber uživatele
              </label>
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Vyberte uživatele --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nové heslo
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Minimálně 6 znaků"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={changing} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {changing ? "Změňuji..." : "Změnit heslo"}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Uživatelé</h2>

          {loading ? (
            <p className="text-gray-600">Načítám...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-600">Žádní uživatelé</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex justify-between p-3 border rounded">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
