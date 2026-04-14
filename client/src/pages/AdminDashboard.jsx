import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminChangePassword,
  createLesson,
  createUser,
  deleteLesson,
  deleteUser,
  deleteContactMessage,
  fetchContactMessages,
  fetchLessons,
  fetchUsers,
  markContactMessageAsRead,
  updateLesson,
  updateUser,
} from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false);

  // State pro změnu hesla
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

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

    loadData();
    loadContactMessages();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, lessonsData] = await Promise.all([fetchUsers(), fetchLessons()]);
      const normalizedUsers = Array.isArray(usersData) ? usersData : [];
      const normalizedLessons = Array.isArray(lessonsData) ? lessonsData : [];
      setUsers(normalizedUsers);
      setLessons(normalizedLessons);
      setSelectedUserIds((prev) => prev.filter((id) => normalizedUsers.some((item) => item.id === id)));
      setSelectedLessonIds((prev) => prev.filter((id) => normalizedLessons.some((item) => item.id === id)));
      setError("");
    } catch (err) {
      setError(err.message || "Nepodařilo se načíst data");
    } finally {
      setLoading(false);
    }
  };

  const loadContactMessages = async () => {
    try {
      setContactMessagesLoading(true);
      const token = localStorage.getItem("authToken");
      const messages = await fetchContactMessages(token);
      setContactMessages(Array.isArray(messages) ? messages : []);
    } catch (err) {
      console.error("Error loading contact messages:", err);
      setContactMessages([]);
    } finally {
      setContactMessagesLoading(false);
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
      setSelectedUserIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err) {
      alert("Nepodařilo se smazat uživatele: " + (err.message || "chyba"));
    }
  };

  const toggleUserSelection = (id, checked) => {
    setSelectedUserIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const handleSelectAllUsers = (checked) => {
    if (!checked) {
      setSelectedUserIds([]);
      return;
    }
    setSelectedUserIds(users.map((item) => item.id));
  };

  const handleDeleteSelectedUsers = async () => {
    if (!selectedUserIds.length) return;
    if (!window.confirm(`Opravdu smazat ${selectedUserIds.length} vybraných uživatelů?`)) return;

    try {
      const results = await Promise.allSettled(selectedUserIds.map((id) => deleteUser(id)));
      const failed = results.filter((result) => result.status === "rejected");
      await loadData();
      setSelectedUserIds([]);

      if (failed.length) {
        alert(`Smazáno s chybami: ${failed.length} z ${selectedUserIds.length} uživatelů se nepodařilo smazat.`);
      }
    } catch (err) {
      alert("Nepodařilo se smazat vybrané uživatele: " + (err.message || "chyba"));
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
      setSelectedLessonIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err) {
      alert("Nepodařilo se smazat lekci: " + (err.message || "chyba"));
    }
  };

  const toggleLessonSelection = (id, checked) => {
    setSelectedLessonIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const handleSelectAllLessons = (checked) => {
    if (!checked) {
      setSelectedLessonIds([]);
      return;
    }
    setSelectedLessonIds(sortedLessons.map((item) => item.id));
  };

  const handleDeleteSelectedLessons = async () => {
    if (!selectedLessonIds.length) return;
    if (!window.confirm(`Opravdu smazat ${selectedLessonIds.length} vybraných lekcí?`)) return;

    try {
      const results = await Promise.allSettled(selectedLessonIds.map((id) => deleteLesson(id)));
      const failed = results.filter((result) => result.status === "rejected");
      await loadData();
      setSelectedLessonIds([]);

      if (failed.length) {
        alert(`Smazáno s chybami: ${failed.length} z ${selectedLessonIds.length} lekcí se nepodařilo smazat.`);
      }
    } catch (err) {
      alert("Nepodařilo se smazat vybrané lekce: " + (err.message || "chyba"));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword) {
      setPasswordMessage("Vyber uživatele a vlož heslo");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("Heslo musí mít alespoň 6 znaků");
      return;
    }

    setPasswordChanging(true);
    setPasswordMessage("");

    try {
      const token = localStorage.getItem("authToken");
 
      if (!token) {
        setPasswordMessage("❌ Jste odhlášeni. Přihlaste se znovu.");
        setPasswordChanging(false);
        return;
      }

      await adminChangePassword(selectedUserForPassword, newPassword, token);

      setPasswordMessage("✅ Heslo bylo změněno!");
      setNewPassword("");
      setSelectedUserForPassword(null);
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      console.error("Chyba při změně hesla:", err);
      setPasswordMessage("❌ " + (err.message || "Síťová chyba"));
    } finally {
      setPasswordChanging(false);
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

  const handleMarkContactMessageAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      await markContactMessageAsRead(id, token);
      await loadContactMessages();
    } catch (err) {
      console.error("Chyba při označení zprávy jako přečtené:", err);
      alert("Nepodařilo se označit zprávu jako přečtenou");
    }
  };

  const handleDeleteContactMessage = async (id) => {
    if (!window.confirm("Opravdu smazat tuto zprávu?")) return;
    try {
      const token = localStorage.getItem("authToken");
      await deleteContactMessage(id, token);
      await loadContactMessages();
    } catch (err) {
      console.error("Chyba při smazání zprávy:", err);
      alert("Nepodařilo se smazat zprávu");
    }
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
          <p className="text-slate-300 text-sm">Hodiny, uživatelé, kontakt</p>
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
          <h2 className="text-xl font-bold text-slate-900 mb-4">🔐 Změna hesla uživatele</h2>
          
          {passwordMessage && (
            <div className={`rounded-lg p-3 mb-4 ${passwordMessage.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Vyber uživatele</label>
              <select
                value={selectedUserForPassword || ""}
                onChange={(e) => setSelectedUserForPassword(e.target.value)}
                className="form-input"
                required
              >
                <option value="">-- Vyberte uživatele --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Nové heslo (min 6 znaků)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Nové heslo"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordChanging}
              className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-50"
            >
              {passwordChanging ? "Změňuji..." : "Změnit heslo"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">Hodiny</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDeleteSelectedLessons}
                disabled={!selectedLessonIds.length}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Smazat vybrané ({selectedLessonIds.length})
              </button>
              <button
                onClick={handleCreateQuickLesson}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                + Rychlá lekce
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={sortedLessons.length > 0 && selectedLessonIds.length === sortedLessons.length}
                      onChange={(event) => handleSelectAllLessons(event.target.checked)}
                      aria-label="Vybrat všechny lekce"
                    />
                  </th>
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
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedLessonIds.includes(lesson.id)}
                        onChange={(event) => toggleLessonSelection(lesson.id, event.target.checked)}
                        aria-label={`Vybrat lekci ${lesson.title}`}
                      />
                    </td>
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
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">Uživatelé</h2>
            <button
              onClick={handleDeleteSelectedUsers}
              disabled={!selectedUserIds.length}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Smazat vybrané ({selectedUserIds.length})
            </button>
          </div>

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
                  <th className="py-2 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onChange={(event) => handleSelectAllUsers(event.target.checked)}
                      aria-label="Vybrat všechny uživatele"
                    />
                  </th>
                  <th className="py-2">Jméno</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(item.id)}
                        onChange={(event) => toggleUserSelection(item.id, event.target.checked)}
                        aria-label={`Vybrat uživatele ${item.name}`}
                      />
                    </td>
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

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">📧 Zprávy z kontaktního formuláře</h2>
          
          {contactMessagesLoading ? (
            <p className="text-sm text-slate-500">Načítám zprávy...</p>
          ) : contactMessages.length === 0 ? (
            <p className="text-sm text-slate-500">Zatím žádné zprávy.</p>
          ) : (
            <div className="space-y-3">
              {contactMessages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 ${
                    message.read ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 break-words">{message.name}</h3>
                        {!message.read && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
                            NOVÉ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 break-words">
                        <strong>Email:</strong> {message.email}
                      </p>
                      {message.phone && (
                        <p className="text-sm text-slate-600">
                          <strong>Telefon:</strong> {message.phone}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mt-1">
                        <strong>Předmět:</strong> {message.subject}
                      </p>
                      {message.course_type && (
                        <p className="text-sm text-slate-600">
                          <strong>Typ kurzu:</strong> {message.course_type}
                        </p>
                      )}
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap break-words">
                        <strong>Zpráva:</strong><br />
                        {message.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Přijato: {message.created_at ? new Date(message.created_at).toLocaleString("cs-CZ") : "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!message.read && (
                        <button
                          onClick={() => handleMarkContactMessageAsRead(message.id)}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold whitespace-nowrap"
                        >
                          Označit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContactMessage(message.id)}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
