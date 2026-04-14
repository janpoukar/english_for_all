import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminChangePassword,
  createLesson,
  createUser,
  deleteLesson,
  deleteUser,
  fetchLessons,
  fetchNewsletterSettings,
  fetchNewsletterCampaigns,
  fetchNewsletterSmtp,
  fetchUsers,
  saveNewsletterSettings,
  saveNewsletterSmtp,
  sendNewsletterCampaign,
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
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [smtpMessage, setSmtpMessage] = useState("");
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    from: "",
    hasPassword: false,
  });
  const [newsletterCampaign, setNewsletterCampaign] = useState({
    subject: "",
    preheader: "",
    imageUrl: "",
    imageAlt: "",
    ctaText: "",
    ctaUrl: "",
    body: "",
  });
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

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
    loadNewsletterSettings();
    loadNewsletterSmtp();
    loadNewsletterCampaigns();
  }, [navigate]);

  const loadNewsletterSettings = async () => {
    try {
      setNewsletterLoading(true);
      const settings = await fetchNewsletterSettings();
      setNewsletterSettings({ ...defaultNewsletterSettings, ...settings });
    } catch (err) {
      setNewsletterSettings(defaultNewsletterSettings);
      setNewsletterMessage(err.message || "Nepodařilo se načíst newsletter nastavení");
    } finally {
      setNewsletterLoading(false);
    }
  };

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

  const loadNewsletterSmtp = async () => {
    try {
      setSmtpLoading(true);
      const token = localStorage.getItem("authToken");
      const smtp = await fetchNewsletterSmtp(token);
      setSmtpSettings((prev) => ({
        ...prev,
        ...smtp,
        pass: "",
      }));
    } catch (err) {
      setSmtpMessage("❌ " + (err.message || "Nepodařilo se načíst SMTP nastavení"));
    } finally {
      setSmtpLoading(false);
    }
  };

  const loadNewsletterCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const token = localStorage.getItem("authToken");
      const campaigns = await fetchNewsletterCampaigns(token);
      setNewsletterCampaigns(Array.isArray(campaigns) ? campaigns : []);
    } catch (err) {
      setNewsletterMessage("❌ " + (err.message || "Nepodařilo se načíst historii newsletterů"));
    } finally {
      setCampaignsLoading(false);
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

  const handleSaveNewsletterSettings = async () => {
    try {
      setNewsletterSaving(true);
      setNewsletterMessage("");
      const token = localStorage.getItem("authToken");
      await saveNewsletterSettings(newsletterSettings, token);
      setNewsletterMessage("✅ Newsletter nastavení bylo uloženo.");
      setTimeout(() => setNewsletterMessage(""), 3000);
    } catch (err) {
      setNewsletterMessage("❌ " + (err.message || "Nepodařilo se uložit newsletter nastavení"));
    } finally {
      setNewsletterSaving(false);
    }
  };

  const handleSendNewsletter = async (event) => {
    event.preventDefault();

    if (!newsletterCampaign.subject.trim() || !newsletterCampaign.body.trim()) {
      setNewsletterMessage("Vyplň předmět i text newsletteru");
      return;
    }

    try {
      setNewsletterSending(true);
      setNewsletterMessage("");
      const token = localStorage.getItem("authToken");
      const result = await sendNewsletterCampaign(newsletterCampaign, token);
      setNewsletterMessage(`✅ ${result.message}`);
      setNewsletterCampaign({
        subject: "",
        preheader: "",
        imageUrl: "",
        imageAlt: "",
        ctaText: "",
        ctaUrl: "",
        body: "",
      });
      await loadNewsletterCampaigns();
    } catch (err) {
      setNewsletterMessage("❌ " + (err.message || "Nepodařilo se připravit newsletter"));
    } finally {
      setNewsletterSending(false);
    }
  };

  const handleSaveSmtpSettings = async () => {
    try {
      setSmtpSaving(true);
      setSmtpMessage("");
      const token = localStorage.getItem("authToken");
      const payload = {
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        user: smtpSettings.user,
        pass: smtpSettings.pass,
        from: smtpSettings.from,
      };

      const saved = await saveNewsletterSmtp(payload, token);
      setSmtpSettings((prev) => ({ ...prev, ...saved, pass: "" }));
      setSmtpMessage("✅ SMTP nastavení bylo uloženo.");
      setTimeout(() => setSmtpMessage(""), 3000);
    } catch (err) {
      setSmtpMessage("❌ " + (err.message || "Nepodařilo se uložit SMTP nastavení"));
    } finally {
      setSmtpSaving(false);
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
          {newsletterMessage && (
            <div className={`rounded-lg p-3 mb-4 ${newsletterMessage.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {newsletterMessage}
            </div>
          )}

          {newsletterLoading && <p className="text-sm text-slate-500 mb-3">Načítám newsletter nastavení...</p>}

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
              onClick={handleSaveNewsletterSettings}
              disabled={newsletterSaving}
              className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-50"
            >
              {newsletterSaving ? "Ukládám..." : "Uložit newsletter"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">SMTP přihlášení pro newsletter</h2>

          {smtpMessage && (
            <div className={`rounded-lg p-3 mb-4 ${smtpMessage.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {smtpMessage}
            </div>
          )}

          {smtpLoading && <p className="text-sm text-slate-500 mb-3">Načítám SMTP nastavení...</p>}

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">SMTP host</label>
              <input
                className="form-input mt-1"
                value={smtpSettings.host}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, host: event.target.value }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">SMTP port</label>
              <input
                className="form-input mt-1"
                value={smtpSettings.port}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, port: Number(event.target.value) || 587 }))}
                placeholder="587"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">SMTP uživatel (email)</label>
              <input
                className="form-input mt-1"
                value={smtpSettings.user}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, user: event.target.value }))}
                placeholder="newsletter@domena.cz"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Odesílatel (From)</label>
              <input
                className="form-input mt-1"
                value={smtpSettings.from}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, from: event.target.value }))}
                placeholder="English for All <newsletter@domena.cz>"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                SMTP heslo {smtpSettings.hasPassword ? "(ponech prázdné pro zachování)" : ""}
              </label>
              <input
                type="password"
                className="form-input mt-1"
                value={smtpSettings.pass}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, pass: event.target.value }))}
                placeholder="SMTP heslo nebo app password"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-1">
              <input
                id="smtp-secure"
                type="checkbox"
                checked={smtpSettings.secure}
                onChange={(event) => setSmtpSettings((prev) => ({ ...prev, secure: event.target.checked }))}
              />
              <label htmlFor="smtp-secure" className="text-sm text-slate-700">Použít secure SMTP (obvykle port 465)</label>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveSmtpSettings}
              disabled={smtpSaving}
              className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold disabled:opacity-50"
            >
              {smtpSaving ? "Ukládám SMTP..." : "Uložit SMTP"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Rozeslání newsletteru</h2>
          <form onSubmit={handleSendNewsletter} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Předmět</label>
                <input
                  className="form-input mt-1"
                  value={newsletterCampaign.subject}
                  onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Např. Novinky z výuky angličtiny"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Preheader</label>
                <input
                  className="form-input mt-1"
                  value={newsletterCampaign.preheader}
                  onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, preheader: event.target.value }))}
                  placeholder="Krátký text do náhledu schránky"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">URL obrázku</label>
              <input
                className="form-input mt-1"
                value={newsletterCampaign.imageUrl}
                onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="https://.../obrazek.jpg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Alt text obrázku</label>
                <input
                  className="form-input mt-1"
                  value={newsletterCampaign.imageAlt}
                  onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, imageAlt: event.target.value }))}
                  placeholder="Popis obrázku"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Text tlačítka</label>
                <input
                  className="form-input mt-1"
                  value={newsletterCampaign.ctaText}
                  onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, ctaText: event.target.value }))}
                  placeholder="Např. Zjistit více"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Odkaz tlačítka</label>
              <input
                className="form-input mt-1"
                value={newsletterCampaign.ctaUrl}
                onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, ctaUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Text newsletteru</label>
              <textarea
                className="form-textarea mt-1 min-h-[220px] text-slate-900 placeholder:text-slate-500 font-mono text-sm"
                value={newsletterCampaign.body}
                onChange={(event) => setNewsletterCampaign((prev) => ({ ...prev, body: event.target.value }))}
                placeholder={"Můžeš psát čistý text nebo HTML.\n\nNapříklad:\n<h1>Nový kurz</h1>\n<p>Podívejte se na nové lekce.</p>"}
              />
            </div>
            <p className="text-xs text-slate-500">
              E-mail se odešle všem uživatelům v databázi s vyplněným e-mailem. Obrázek lze vložit přes URL.
            </p>
            <button
              type="submit"
              disabled={newsletterSending}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
            >
              {newsletterSending ? "Připravuji..." : "Rozeslat newsletter"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Historie newsletterů</h2>

          {campaignsLoading ? (
            <p className="text-sm text-slate-500">Načítám historii...</p>
          ) : newsletterCampaigns.length === 0 ? (
            <p className="text-sm text-slate-500">Zatím nebyl odeslán žádný newsletter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-3">Předmět</th>
                    <th className="py-2 pr-3">Odesláno</th>
                    <th className="py-2 pr-3">Neúspěšné</th>
                    <th className="py-2">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {newsletterCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-semibold text-slate-800">{campaign.subject}</td>
                      <td className="py-2 pr-3">{campaign.sent_count ?? campaign.subscriber_count ?? 0}</td>
                      <td className="py-2 pr-3">{campaign.failed_count ?? 0}</td>
                      <td className="py-2 text-slate-600">
                        {campaign.created_at
                          ? new Date(campaign.created_at).toLocaleString("cs-CZ")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
