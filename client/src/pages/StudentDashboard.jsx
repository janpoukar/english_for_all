import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import {
  fetchAssignments,
  fetchLessons,
  fetchMaterials,
  getMaterialDownloadUrl,
  resolveFileUrl,
} from "../services/api";

const STUDENTS_META_PREFIX = "##students::";

const splitLessonDescription = (rawDescription) => {
  const source = rawDescription || "";
  const markerIndex = source.indexOf(STUDENTS_META_PREFIX);
  if (markerIndex === -1) {
    return { cleanDescription: source, students: [] };
  }

  const cleanDescription = source.slice(0, markerIndex).trim();
  const encoded = source.slice(markerIndex + STUDENTS_META_PREFIX.length).trim();
  if (!encoded) {
    return { cleanDescription, students: [] };
  }

  const students = encoded
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [id, ...nameParts] = item.split("|");
      return { id: id || "", name: (nameParts.join("|") || "").trim() };
    })
    .filter((student) => student.id || student.name);

  return { cleanDescription, students };
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [user, setUser] = useState(null);
  const [lessonMaterials, setLessonMaterials] = useState([]);
  const [lessonAssignments, setLessonAssignments] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);

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
    loadLessons(parsedUser);
  }, [navigate]);

  const loadLessons = async (currentUser) => {
    try {
      const data = await fetchLessons();
      const userId = String(currentUser?.id || "");
      const userName = String(currentUser?.name || "").trim().toLowerCase();

      const studentLessons = (Array.isArray(data) ? data : []).filter((lesson) => {
        const parsed = splitLessonDescription(lesson?.description);
        const assignedStudents = Array.isArray(parsed.students) ? parsed.students : [];
        const hasAssignedStudents = assignedStudents.length > 0;

        const isAssignedById = assignedStudents.some((student) => String(student.id || "") === userId);
        const isAssignedByName =
          userName.length > 0 &&
          assignedStudents.some((student) => String(student.name || "").trim().toLowerCase() === userName);

        if (isAssignedById || isAssignedByName) {
          return true;
        }

        if (hasAssignedStudents) {
          return false;
        }

        // Fallback for older lessons without student metadata.
        return lesson.status !== "free";
      });

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

  const getCleanLessonDescription = (lesson) => splitLessonDescription(lesson?.description).cleanDescription;

  useEffect(() => {
    const loadLessonResources = async () => {
      if (!selectedLesson?.id) {
        setLessonMaterials([]);
        setLessonAssignments([]);
        return;
      }

      try {
        setResourceLoading(true);
        const [materialsData, assignmentsData] = await Promise.all([
          fetchMaterials(selectedLesson.id),
          fetchAssignments(selectedLesson.id),
        ]);
        setLessonMaterials(Array.isArray(materialsData) ? materialsData : []);
        setLessonAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      } catch {
        setLessonMaterials([]);
        setLessonAssignments([]);
      } finally {
        setResourceLoading(false);
      }
    };

    loadLessonResources();
  }, [selectedLesson]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingLessons = lessons.filter((lesson) => {
    const lessonDate = new Date(lesson.date);
    return lessonDate >= todayStart && lesson.status !== "completed";
  });

  const completedLessons = lessons.filter((lesson) => {
    const lessonDate = new Date(lesson.date);
    return lesson.status === "completed" || lessonDate < todayStart;
  });

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

                  {getCleanLessonDescription(lesson) && (
                    <p className="text-gray-600 text-sm mb-4">{getCleanLessonDescription(lesson)}</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Proběhlé lekce</h2>
              <span className="ml-auto bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {completedLessons.length}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {completedLessons.map(lesson => (
                <Card
                  key={lesson.id}
                  className="opacity-85 cursor-pointer"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-700">{lesson.title}</h3>
                    <span className="text-2xl">✓</span>
                  </div>
                  {getCleanLessonDescription(lesson) && (
                    <p className="text-gray-600 text-sm mb-3">{getCleanLessonDescription(lesson)}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(lesson.date).toLocaleDateString('cs-CZ')}
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLesson(lesson);
                      }}
                      className="w-full btn-secondary text-sm py-2"
                    >
                      ℹ️ Detaily a materiály
                    </button>
                  </div>
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
                <p className="text-gray-600 mt-1">{getCleanLessonDescription(selectedLesson)}</p>
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
              {resourceLoading ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <p className="text-gray-600">Načítám materiály…</p>
                </div>
              ) : lessonMaterials.length === 0 ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <p className="text-gray-600">Lektor zatím nepřidal žádné materiály</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessonMaterials.map((material) => {
                    const rawFileUrl = material.file_url || "";
                    const hasLegacyLocalUrl = rawFileUrl.startsWith("local://");
                    const downloadUrl = getMaterialDownloadUrl(material.id);
                    return (
                      <div key={material.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{material.file_name || "Materiál"}</p>
                          {material.created_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Přidáno: {new Date(material.created_at).toLocaleDateString("cs-CZ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {downloadUrl && !hasLegacyLocalUrl && (
                            <a
                              href={downloadUrl}
                              download={material.file_name || true}
                              className="btn-primary text-sm px-3 py-1.5 whitespace-nowrap"
                            >
                              Stáhnout
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div className="mt-6 mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">✅ Úkoly</h3>
              {resourceLoading ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                  <p className="text-gray-600">Načítám úkoly…</p>
                </div>
              ) : lessonAssignments.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                  <p className="text-gray-600">Žádné úkoly pro tuto lekci</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessonAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="font-semibold text-gray-800 text-sm">{assignment.title}</p>
                      {assignment.description && <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">Termín: {assignment.due_date || "Není zadán"}</p>
                      <p className="text-xs text-blue-700 mt-1">Stav: {assignment.status || "probiha"}</p>
                    </div>
                  ))}
                </div>
              )}
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
