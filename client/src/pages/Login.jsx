import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("student"); // student or tutor

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulovaný login - v produkci by to bylo přes Supabase Auth
      // Pro teď jenom uložíme do localStorage
      
      if (!formData.email || !formData.password) {
        throw new Error("Vyplň prosím email a heslo");
      }

      // Role podle výběru v UI
      const role = userRole;

      // Uložit do localStorage (v produkci by to bylo real autentifikace)
      localStorage.setItem("user", JSON.stringify({
        id: Math.random().toString(36),
        email: formData.email,
        name: formData.email.split("@")[0],
        role: role,
      }));

      // Redirect na správný dashboard
      if (role === "tutor") {
        navigate("/tutor-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-red-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-hard p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎓</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent">
              English for All
            </h1>
            <p className="text-gray-600 text-sm mt-2">Přihlášení do systému</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jsem:
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserRole("student")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    userRole === "student"
                      ? "bg-blue-700 text-white shadow-glow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👨‍🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole("tutor")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    userRole === "tutor"
                      ? "bg-red-600 text-white shadow-glow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👨‍🏫 Lektor
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder={
                  userRole === "tutor"
                    ? "tutor@example.com"
                    : "student@example.com"
                }
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Heslo
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Hint */}
            <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-600 border border-blue-200">
              <p className="font-medium mb-1">💡 Test účty:</p>
              <p>Student: student@example.com</p>
              <p>Lektor: tutor@example.com</p>
              <p>Heslo: (libovolné)</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary font-bold py-3 text-lg disabled:opacity-50"
            >
              {loading ? "Přihlašuji..." : "Přihlásit se"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Nemáš účet?{" "}
            <Link to="/register" className="text-blue-700 hover:text-blue-800 font-semibold">
              Zaregistruj se
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-white hover:text-gray-200 text-sm font-medium transition-colors"
          >
            ← Zpět na domů
          </Link>
        </div>
      </div>
    </main>
  );
}
