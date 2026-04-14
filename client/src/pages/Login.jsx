import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Vyplň prosím email a heslo");
      }

      const authData = await loginUser(formData.email, formData.password);
      if (!authData?.user || !authData?.token) {
        throw new Error("Email nebo heslo není správné");
      }
      localStorage.setItem("user", JSON.stringify(authData.user));
      localStorage.setItem("authToken", authData.token);

      if (authData.user.role === "tutor") {
        navigate("/tutor-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      setError(err.message || "Přihlášení se nezdařilo");
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
              </div>
            )}

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
                required
              />
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
            Přihlašovací údaje obdržíte od lektorky.
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
