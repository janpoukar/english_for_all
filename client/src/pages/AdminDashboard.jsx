import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createLesson,
  createUser,
  deleteLesson,
  deleteUser,
  fetchLessons,
  fetchUsers,
  updateLesson,
  updateUser,
} from "../services/api";

const NEWSLETTER_SETTINGS_KEY = "newsletterSettings";

const defaultNewsletterSettings = {
  title: "Přihlaste se k Newsletteru",
  subtitle: "Dostávejte aktuální tipy na učení angličtiny a nové kurzy",
  buttonText: "Přihlásit",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [newsletterSettings, setNewsletterSettings] = useState(defaultNewsletterSettings);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    password_hash: "demo123",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/admin-login", { replace: true });
      return;
    }

    const parsed = JSON.parse(userData);
    if (parsed.role !== "admin") {
      navigate("/login", { replace: true });
      return;
    }

    setUser(parsed);

    const storedSettings = localStorage.getItem(NEWSLETTER_SETTINGS_KEY);
    if (storedSettings) {
      try {
        setNewsletterSettings({ ...defaultNewsletterSettings, ...JSON.parse(storedSettings) });
      } catch {
        setNewsletterSettings(defaultNewsletterSettings);
      }
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, lessonsData] = await Promise.all([fetchUsers(), fetchLessons()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setError("");
    } catch (err) {
      setError(err.message || "Nepodařilo se načíst data");
    } finally {
      setLoading(false);
    }
  };

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`)),
    [lessons]
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Vyplň jméno a email uživatele.");
      return;
    }

    try {
      await createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        password_hash: newUser.password_hash || "demo123",
      });
      setNewUser({ name: "", email: "", role: "student", password_hash: "demo123" });
      await loadData();
    } catch (err) {
      alert("Nepodařilo se vytvořit uživatele: " + (err.message || "chyba"));
    }
  };

  const handleDeleteUser = async (id) => {
    const target = users.find((item) => item.id === id);
    if (!target) return;
    if (!window.confirm(`Opravdu smazat uživatele ${target.name}?`)) return;

    try {
      await deleteUser(id);
      await loadData();
    } catch (err) {
      alert("Nepodařilo se smazat uživatele: " + (err.message || "chyba"));
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUser(id, { role });
      await loadData();
    } catch (err) {
      alert("Nepodařilo se změnit roli: " + (err.message || "chyba"));
    }
  };

  const handleLessonStatusChange = async (id, status) => {
    try {
      await updateLesson(id, { status });
      await loadData();
    } catch (err) {
      alert("Nepodařilo se upravit lekci: " + (err.message || "chyba"));
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm("Opravdu smazat lekci?")) return;
    try {
      await deleteLesson(id);
      await loadData();
    } catch (err) {
      alert("Nepodařilo se smazat lekci: " + (err.message || "chyba"));
    }
  };

  const handleCreateQuickLesson = async () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    try {
      await createLesson({
        title: "Nová lekce",
        description: "Vytvořeno správcem",
        date,
        start_time: "10:00",
        end_time: "11:00",
        status: "free",
      });
      await loadData();
    } catch (err) {
      alert("Nepodařilo se vytvořit lekci: " + (err.message || "chyba"));
    }
  };

  const saveNewsletterSettings = () => {
    localStorage.setItem(NEWSLETTER_SETTINGS_KEY, JSON.stringify(newsletterSettings));
    alert("Newsletter nastavení bylo uloženo.");
  };

  if (!user) return null;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-10">
        <p className="text-gray-700 font-semibold">Načítání administrace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white py-4 px-4 md:px-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">Správa Stránky</h1>
          <p className="text-slate-300 text-sm">Newsletter, hodiny, uživatelé</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
        >
          Odhlásit správce
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">⚠️ {error}</div>}

        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Celkem uživatelů</p>
            <p className="text-3xl font-black text-slate-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Celkem lekcí</p>
            <p className="text-3xl font-black text-slate-900">{lessons.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Přihlášen jako</p>
            <p className="text-xl font-bold text-slate-900">{user.name}</p>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Newsletter</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              className="form-input"
              value={newsletterSettings.title}
              onChange={(event) =>
                setNewsletterSettings((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Nadpis"
            />
            <input
              className="form-input"
              value={newsletterSettings.subtitle}
              onChange={(event) =>
                setNewsletterSettings((prev) => ({ ...prev, subtitle: event.target.value }))
              }
              placeholder="Podnadpis"
            />
            <input
              className="form-input"
              value={newsletterSettings.buttonText}
              onChange={(event) =>
                setNewsletterSettings((prev) => ({ ...prev, buttonText: event.target.value }))
              }
              placeholder="Text tlačítka"
            />
          </div>
          <div className="mt-3">
            <button
              onClick={saveNewsletterSettings}
              className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              Uložit newsletter
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">Hodiny</h2>
            <button
              onClick={handleCreateQuickLesson}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              + Rychlá lekce
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Název</th>
                  <th className="py-2">Datum</th>
                  <th className="py-2">Čas</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {sortedLessons.map((lesson) => (
                  <tr key={lesson.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-800">{lesson.title}</td>
                    <td className="py-2 pr-3">{lesson.date}</td>
                    <td className="py-2 pr-3">{(lesson.start_time || "").substring(0, 5)} - {(lesson.end_time || "").substring(0, 5)}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={lesson.status || "free"}
                        onChange={(event) => handleLessonStatusChange(lesson.id, event.target.value)}
                        className="border border-slate-300 rounded-md px-2 py-1"
                      >
                        <option value="free">free</option>
                        <option value="booked">booked</option>
                        <option value="completed">completed</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Uživatelé</h2>

          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <input
              className="form-input"
              value={newUser.name}
              onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Jméno"
            />
            <input
              className="form-input"
              value={newUser.email}
              onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
            />
            <select
              className="form-input"
              value={newUser.role}
              onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="student">student</option>
              <option value="tutor">tutor</option>
              <option value="admin">admin</option>
            </select>
            <button
              onClick={handleCreateUser}
              className="rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2"
            >
              + Přidat uživatele
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Jméno</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2 pr-3">{item.email}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={item.role || "student"}
                        onChange={(event) => handleRoleChange(item.id, event.target.value)}
                        className="border border-slate-300 rounded-md px-2 py-1"
                      >
                        <option value="student">student</option>
                        <option value="tutor">tutor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteUser(item.id)}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
