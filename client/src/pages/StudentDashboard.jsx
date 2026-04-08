import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { fetchLessons } from "../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Ověř, že je uživatel přihlášen
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "student") {
      navigate("/tutor-dashboard");
      return;
    }

    setUser(parsedUser);
    loadLessons();
  }, [navigate]);

  const loadLessons = async () => {
    try {
      const data = await fetchLessons();
      // Filtruj lekce které nejsou "free" (tj. jsou zarezervované pro studenty)
      const studentLessons = data.filter(lesson => lesson.status !== "free");
      setLessons(studentLessons.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setError("");
    } catch (err) {
      console.error("Error:", err);
      setError("Nepodařilo se načíst tvé lekce");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const upcomingLessons = lessons.filter(
    lesson => new Date(lesson.date) >= new Date()
  );
  const completedLessons = lessons.filter(
    lesson => lesson.status === "completed"
  );

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <p className="font-semibold text-gray-700 mt-4">Načítání tvých lekcí…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent">
              Moje Lekce
            </h1>
            <p className="text-gray-600 text-sm">Tvůj osobní študijní plán</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">👋 {user?.name}</span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Upcoming Lessons */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-3xl">📅</span>
            <h2 className="text-2xl font-bold text-gray-900">Nadcházející lekce</h2>
            {upcomingLessons.length > 0 && (
              <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {upcomingLessons.length}
              </span>
            )}
          </div>

          {upcomingLessons.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Zatím nemáš žádné naplánované lekce</p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingLessons.map(lesson => (
                <Card
                  key={lesson.id}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{lesson.title}</h3>
                    <span className="text-3xl">📚</span>
                  </div>

                  {lesson.description && (
                    <p className="text-gray-600 text-sm mb-4">{lesson.description}</p>
                  )}

                  <div className="space-y-2 pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="font-medium">
                        {new Date(lesson.date).toLocaleDateString('cs-CZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span className="font-medium">
                        {lesson.start_time?.substring(0, 5)} - {lesson.end_time?.substring(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLesson(lesson);
                        }}
                        className="w-full btn-primary text-sm py-2"
                      >
                        ℹ️ Detaily
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Lessons */}
        {completedLessons.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">✅</span>
              <h2 className="text-2xl font-bold text-gray-900">Absolvované lekce</h2>
              <span className="ml-auto bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {completedLessons.length}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {completedLessons.map(lesson => (
                <Card key={lesson.id} className="opacity-75">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-700">{lesson.title}</h3>
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(lesson.date).toLocaleDateString('cs-CZ')}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {lessons.length === 0 && (
          <Card>
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📚</p>
              <p className="font-bold text-lg text-gray-900 mb-2">Žádné lekce</p>
              <p className="text-gray-600">Jakmile se zarezervuješ na lekci, zobrazí se ti zde</p>
            </div>
          </Card>
        )}
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedLesson.title}</h2>
                <p className="text-gray-600 mt-1">{selectedLesson.description}</p>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-2xl text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
              <div>
                <p className="text-sm text-gray-600 mb-2">📅 Datum</p>
                <p className="font-bold text-lg">
                  {new Date(selectedLesson.date).toLocaleDateString('cs-CZ', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">⏰ Čas</p>
                <p className="font-bold text-lg">
                  {selectedLesson.start_time?.substring(0, 5)} - {selectedLesson.end_time?.substring(0, 5)}
                </p>
              </div>
            </div>

            {/* Materials Section */}
            <div className="mt-6 mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">📎 Materiály k lekci</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <p className="text-gray-600">Lektor zatím nepřidal žádné materiály</p>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mt-6 mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">✅ Úkoly</h3>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                <p className="text-gray-600">Žádné úkoly pro tuto lekci</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() => setSelectedLesson(null)}
                className="w-full btn-secondary"
              >
                Zavřít
              </button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
