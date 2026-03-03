import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAssignment,
  createLesson,
  deleteLesson,
  fetchAssignments,
  fetchLessons,
  updateAssignment,
  updateLesson,
  uploadMaterial,
} from "../services/api";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
const TIME_SLOTS = Array.from({ length: 12 }, (_, index) => {
  const hour = 7 + index;
  return `${String(hour).padStart(2, "0")}:00`;
});

const normalizeTime = (value) => (value || "").substring(0, 5);

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonday = (baseDate) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );

export default function TutorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weekOffset, setWeekOffset] = useState(0);

  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "08:00",
    end_time: "09:00",
    status: "free",
  });

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "tutor") {
      navigate("/student-dashboard");
      return;
    }

    setUser(parsedUser);
    loadLessons();
  }, [navigate]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchLessons();
      setLessons(data || []);
    } catch (err) {
      setError("Nepodařilo se načíst lekce: " + (err?.message || "neznámá chyba"));
    } finally {
      setLoading(false);
    }
  };

  const monday = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    return getMonday(now);
  }, [weekOffset]);

  const weekDates = useMemo(() => {
    return DAYS.map((_, dayIndex) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);
      return date;
    });
  }, [monday]);

  const weekDateKeys = useMemo(() => weekDates.map((date) => toDateKey(date)), [weekDates]);

  const lessonsByDate = useMemo(() => {
    const map = new Map();
    weekDateKeys.forEach((key) => map.set(key, []));

    lessons.forEach((lesson) => {
      if (map.has(lesson.date)) {
        map.get(lesson.date).push(lesson);
      }
    });

    map.forEach((items, key) => {
      items.sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)));
      map.set(key, items);
    });

    return map;
  }, [lessons, weekDateKeys]);

  const getLessonsForCell = (dateKey, slot) => {
    const lessonsForDay = lessonsByDate.get(dateKey) || [];
    return lessonsForDay.filter((lesson) => {
      const start = normalizeTime(lesson.start_time);
      const end = normalizeTime(lesson.end_time);
      return start <= slot && slot < end;
    });
  };

  const formatDateShort = (date) =>
    date.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });

  const formatWeekRange = () => {
    const first = weekDates[0];
    const last = weekDates[4];
    return `${first.toLocaleDateString("cs-CZ")} – ${last.toLocaleDateString("cs-CZ")}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonForm({
      title: "",
      description: "",
      date: weekDateKeys[0] || toDateKey(new Date()),
      start_time: "08:00",
      end_time: "09:00",
      status: "free",
    });
    setLessonFormOpen(true);
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      date: lesson.date || "",
      start_time: normalizeTime(lesson.start_time),
      end_time: normalizeTime(lesson.end_time),
      status: lesson.status || "free",
    });
    setLessonFormOpen(true);
  };

  const closeLessonForm = () => {
    setLessonFormOpen(false);
    setEditingLesson(null);
    setLessonForm({
      title: "",
      description: "",
      date: "",
      start_time: "08:00",
      end_time: "09:00",
      status: "free",
    });
  };

  const handleLessonFormChange = (field, value) => {
    setLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildLessonPayload = () => {
    const payload = {
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || null,
      date: lessonForm.date,
      start_time: lessonForm.start_time,
      end_time: lessonForm.end_time,
      status: lessonForm.status,
    };

    if (isUuid(user?.id)) {
      payload.tutor_id = user.id;
    }

    return payload;
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      alert("Zadej název hodiny.");
      return;
    }
    if (!lessonForm.date || !lessonForm.start_time || !lessonForm.end_time) {
      alert("Vyplň datum a čas hodiny.");
      return;
    }
    if (lessonForm.start_time >= lessonForm.end_time) {
      alert("Čas začátku musí být dříve než konec.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildLessonPayload();
      if (editingLesson?.id) {
        await updateLesson(editingLesson.id, payload);
        alert("Hodina byla upravena.");
      } else {
        await createLesson(payload);
        alert("Hodina byla přidána.");
      }
      closeLessonForm();
      await loadLessons();
    } catch (err) {
      alert("Chyba při ukládání hodiny: " + (err?.message || "neznámá chyba"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const confirmed = window.confirm(`Opravdu chceš zrušit hodinu "${lesson.title}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteLesson(lesson.id);
      alert("Hodina byla zrušena.");
      await loadLessons();
    } catch (err) {
      alert("Chyba při rušení hodiny: " + (err?.message || "neznámá chyba"));
    } finally {
      setSaving(false);
    }
  };

  const loadAssignmentsForLesson = async (lessonId) => {
    try {
      const data = await fetchAssignments(lessonId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Chyba při načítání úkolů: " + (err?.message || "neznámá chyba"));
      setAssignments([]);
    }
  };

  const openResourceModal = (lesson) => {
    setSelectedLesson(lesson);
    setResourceModalOpen(true);
    setUploadedFile(null);
    setAssignmentTitle("");
    setAssignmentDescription("");
    setAssignmentDueDate(lesson.date || "");
    setEditingAssignment(null);
    setAssignments([]);
    loadAssignmentsForLesson(lesson.id);
  };

  const closeResourceModal = () => {
    setResourceModalOpen(false);
    setSelectedLesson(null);
    setUploadedFile(null);
    setAssignmentTitle("");
    setAssignmentDescription("");
    setAssignmentDueDate("");
    setAssignments([]);
    setEditingAssignment(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Pouze PDF, Word, PowerPoint, text a obrázkové soubory jsou povoleny");
      return;
    }

    setUploadedFile(file);
  };

  const handleSaveMaterial = async () => {
    if (!selectedLesson) return;
    if (!uploadedFile) {
      alert("Nejprve vyber soubor.");
      return;
    }

    setSaving(true);
    try {
      await uploadMaterial({
        lesson_id: selectedLesson.id,
        file_name: uploadedFile.name,
        file_url: `local://${uploadedFile.name}`,
      });
      alert("Materiál byl uložen k lekci.");
      setUploadedFile(null);
    } catch (err) {
      alert("Chyba při ukládání materiálu: " + (err?.message || "neznámá chyba"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedLesson) return;
    if (!assignmentTitle.trim()) {
      alert("Zadej název úkolu.");
      return;
    }

    setSaving(true);
    try {
      await createAssignment({
        lesson_id: selectedLesson.id,
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim() || null,
        due_date: assignmentDueDate || selectedLesson.date,
      });
      alert("Úkol byl přidán.");
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate(selectedLesson.date || "");
      await loadAssignmentsForLesson(selectedLesson.id);
    } catch (err) {
      alert("Chyba při přidání úkolu: " + (err?.message || "neznámá chyba"));
    } finally {
      setSaving(false);
    }
  };

  const startEditAssignment = (assignment) => {
    setEditingAssignment({
      id: assignment.id,
      title: assignment.title || "",
      description: assignment.description || "",
      due_date: assignment.due_date || selectedLesson?.date || "",
    });
  };

  const handleSaveEditedAssignment = async () => {
    if (!editingAssignment || !editingAssignment.title.trim()) {
      alert("Název úkolu nemůže být prázdný.");
      return;
    }

    setSaving(true);
    try {
      await updateAssignment(editingAssignment.id, {
        title: editingAssignment.title.trim(),
        description: editingAssignment.description.trim() || null,
        due_date: editingAssignment.due_date || selectedLesson?.date,
      });

      alert("Úkol byl upraven.");
      setEditingAssignment(null);
      if (selectedLesson?.id) {
        await loadAssignmentsForLesson(selectedLesson.id);
      }
    } catch (err) {
      alert("Chyba při úpravě úkolu: " + (err?.message || "neznámá chyba"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <p className="font-semibold text-gray-700 mt-4">Načítání rozvrhu…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="bg-gradient-to-r from-blue-700 to-red-600 text-white p-6 md:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">📚 Lektorský rozvrh</h1>
            <p className="text-blue-100 mt-2">Školní tabulka týdne (čas × Pondělí–Pátek)</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreateLesson} className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold">
              + Přidat hodinu
            </button>
            <span className="text-blue-100">👨‍🏫 {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 font-semibold"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 p-6 rounded-xl mb-6">
            ⚠️ {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <button onClick={() => setWeekOffset((value) => value - 1)} className="btn-secondary">
            ← Předchozí týden
          </button>

          <p className="font-bold text-gray-800 text-lg">{formatWeekRange()}</p>

          <button onClick={() => setWeekOffset((value) => value + 1)} className="btn-secondary">
            Další týden →
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-500">
                  <th className="px-4 py-4 text-white font-bold text-left w-24">Čas</th>
                  {DAYS.map((dayLabel, index) => (
                    <th key={dayLabel} className="px-4 py-4 text-white font-bold text-left min-w-[180px]">
                      <div>{dayLabel}</div>
                      <div className="text-blue-100 text-sm font-medium">{formatDateShort(weekDates[index])}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="border-b border-gray-200 align-top">
                    <td className="px-4 py-4 font-bold text-gray-700 bg-gray-50">{slot}</td>
                    {weekDateKeys.map((dateKey) => {
                      const cellLessons = getLessonsForCell(dateKey, slot);

                      return (
                        <td key={`${dateKey}-${slot}`} className="px-3 py-3">
                          {cellLessons.length === 0 ? (
                            <div className="text-sm text-gray-300 italic">—</div>
                          ) : (
                            <div className="space-y-2">
                              {cellLessons.map((lesson) => (
                                <div key={lesson.id} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                  <p className="font-semibold text-sm text-gray-900">{lesson.title}</p>
                                  <p className="text-xs text-gray-600">
                                    {normalizeTime(lesson.start_time)} – {normalizeTime(lesson.end_time)}
                                  </p>
                                  <p className="text-xs mt-1 text-gray-600">
                                    {lesson.status === "free"
                                      ? "✓ Volná"
                                      : lesson.status === "booked"
                                      ? "👤 Zarezervovaná"
                                      : "✅ Dokončená"}
                                  </p>
                                  <div className="mt-2 grid grid-cols-2 gap-1">
                                    <button
                                      onClick={() => openResourceModal(lesson)}
                                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                                    >
                                      Materiály
                                    </button>
                                    <button
                                      onClick={() => openEditLesson(lesson)}
                                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                    >
                                      Upravit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson)}
                                      className="col-span-2 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                                    >
                                      Zrušit hodinu
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {lessonFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingLesson ? "Upravit hodinu" : "Přidat novou hodinu"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Vyplň údaje hodiny v rozvrhu.</p>
              </div>
              <button onClick={closeLessonForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Název</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(event) => handleLessonFormChange("title", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Např. Konverzace B1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Popis</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(event) => handleLessonFormChange("description", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[84px]"
                  placeholder="Volitelný popis hodiny"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={lessonForm.date}
                  onChange={(event) => handleLessonFormChange("date", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={lessonForm.status}
                  onChange={(event) => handleLessonFormChange("status", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="free">Volná</option>
                  <option value="booked">Zarezervovaná</option>
                  <option value="completed">Dokončená</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Začátek</label>
                <input
                  type="time"
                  value={lessonForm.start_time}
                  onChange={(event) => handleLessonFormChange("start_time", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Konec</label>
                <input
                  type="time"
                  value={lessonForm.end_time}
                  onChange={(event) => handleLessonFormChange("end_time", event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={closeLessonForm} className="btn-secondary">
                Zrušit
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {editingLesson ? "Uložit změny" : "Přidat hodinu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resourceModalOpen && selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Správa lekce</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedLesson.title} • {selectedLesson.date} • {normalizeTime(selectedLesson.start_time)}–{normalizeTime(selectedLesson.end_time)}
                </p>
              </div>
              <button onClick={closeResourceModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📤 Nahrát soubor</h3>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  className="w-full text-sm"
                />
                {uploadedFile && <p className="text-xs text-green-700 mt-2">✓ {uploadedFile.name}</p>}
                <button
                  onClick={handleSaveMaterial}
                  disabled={saving}
                  className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
                >
                  Uložit materiál
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📝 Přidat úkol</h3>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(event) => setAssignmentTitle(event.target.value)}
                  placeholder="Název úkolu"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <textarea
                  value={assignmentDescription}
                  onChange={(event) => setAssignmentDescription(event.target.value)}
                  placeholder="Popis úkolu"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 min-h-[88px]"
                />
                <input
                  type="date"
                  value={assignmentDueDate}
                  onChange={(event) => setAssignmentDueDate(event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <button
                  onClick={handleCreateAssignment}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg"
                >
                  Uložit úkol
                </button>

                <div className="mt-5 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Existující úkoly</h4>
                  {assignments.length === 0 ? (
                    <p className="text-sm text-gray-500">Zatím nejsou žádné úkoly.</p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {assignments.map((assignment) => (
                        <button
                          key={assignment.id}
                          type="button"
                          onClick={() => startEditAssignment(assignment)}
                          className="w-full text-left border border-gray-200 hover:border-blue-300 rounded-lg p-2 bg-gray-50"
                        >
                          <p className="text-sm font-semibold text-gray-900">{assignment.title}</p>
                          <p className="text-xs text-gray-600 mt-1">Termín: {assignment.due_date || "-"}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editingAssignment && (
              <div className="mt-6 border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">✏️ Upravit úkol</h3>
                <input
                  type="text"
                  value={editingAssignment.title}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <textarea
                  value={editingAssignment.description}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 min-h-[88px]"
                />
                <input
                  type="date"
                  value={editingAssignment.due_date || ""}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, due_date: event.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEditedAssignment}
                    disabled={saving}
                    className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Uložit změny
                  </button>
                  <button
                    onClick={() => setEditingAssignment(null)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                  >
                    Zrušit úpravu
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-right">
              <button onClick={closeResourceModal} className="btn-secondary">
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
