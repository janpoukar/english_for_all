import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error("Vyplň prosím jméno, email a heslo");
      }

      if (formData.password.length < 6) {
        throw new Error("Heslo musí mít alespoň 6 znaků");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Hesla se neshodují");
      }

      const authData = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        role
      );

      localStorage.setItem("user", JSON.stringify(authData.user));
      localStorage.setItem("authToken", authData.token);

      navigate(authData.user.role === "tutor" ? "/tutor-dashboard" : "/student-dashboard");
    } catch (err) {
      setError(err.message || "Registrace se nezdařila");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-red-900 flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-hard p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📝</div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent">
              Vytvoření účtu
            </h1>
            <p className="text-gray-600 text-sm mt-2">
              Po registraci se účet uloží do databáze a půjde ho normálně používat.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Typ účtu</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`rounded-xl px-4 py-3 font-semibold transition-all ${
                    role === "student"
                      ? "bg-blue-700 text-white shadow-glow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👨‍🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={`rounded-xl px-4 py-3 font-semibold transition-all ${
                    role === "tutor"
                      ? "bg-red-600 text-white shadow-glow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👨‍🏫 Lektor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jméno</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Např. Jan Novák"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="jan@example.com"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Heslo</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Alespoň 6 znaků"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Potvrzení hesla</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Zopakuj heslo"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-600 border border-blue-200">
              <p className="font-medium mb-1">Co se teď změní:</p>
              <p>Nový student nebo lektor se uloží do databáze users.</p>
              <p>Studenti se pak automaticky objeví ve výběru u lekcí.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary font-bold py-3 text-lg disabled:opacity-50"
            >
              {loading ? "Vytvářím účet..." : "Zaregistrovat se"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Už účet máš?{" "}
            <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold">
              Přihlas se
            </Link>
          </p>
        </div>

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