import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAssignment,
  createLesson,
  deleteLesson,
  fetchAssignments,
  fetchLessons,
  fetchUsers,
  updateAssignment,
  updateLesson,
  uploadMaterial,
} from "../services/api";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
const TIME_SLOTS = Array.from({ length: 12 }, (_, index) => {
  const hour = 7 + index;
  return `${String(hour).padStart(2, "0")}:00`;
});
const DAY_LABEL_COLUMN_WIDTH = "10.5rem";

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

const STATUS_META = {
  free: {
    label: "Volná",
    short: "Volno",
    icon: "🟢",
    chipClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    cardClass: "bg-emerald-50 border-emerald-200",
  },
  booked: {
    label: "Zarezervovaná",
    short: "Rezervace",
    icon: "🟠",
    chipClass: "bg-amber-100 text-amber-800 border border-amber-200",
    cardClass: "bg-amber-50 border-amber-200",
  },
  completed: {
    label: "Dokončená",
    short: "Hotovo",
    icon: "🔵",
    chipClass: "bg-sky-100 text-sky-800 border border-sky-200",
    cardClass: "bg-sky-50 border-sky-200",
  },
};

const STUDENTS_META_PREFIX = "##students::";

const timeToMinutes = (timeValue) => {
  const [hours, minutes] = (timeValue || "00:00").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const safeMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getTimeOfDayBackground = () => {
  // Dawn -> daylight -> dusk across timetable width.
  return "linear-gradient(to right, rgba(255,244,214,0.24) 0%, rgba(255,236,184,0.28) 14%, rgba(219,234,254,0.68) 36%, rgba(191,219,254,0.64) 62%, rgba(255,223,186,0.34) 82%, rgba(251,191,116,0.26) 100%)";
};


const DAY_START_MINUTES = timeToMinutes(TIME_SLOTS[0]);
const DAY_END_MINUTES = timeToMinutes(TIME_SLOTS[TIME_SLOTS.length - 1]) + 60;

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
    .filter((student) => student.id && student.name);

  return { cleanDescription, students };
};

const composeLessonDescription = (cleanDescription, selectedStudentIds, allStudents) => {
  const base = (cleanDescription || "").trim();
  if (!Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
    return base || null;
  }

  const indexById = new Map((allStudents || []).map((student) => [String(student.id), student]));
  const selectedPairs = selectedStudentIds
    .map((id) => indexById.get(String(id)))
    .filter(Boolean)
    .map((student) => `${student.id}|${(student.name || "").replace(/;/g, ",")}`);

  if (selectedPairs.length === 0) {
    return base || null;
  }

  const meta = `${STUDENTS_META_PREFIX}${selectedPairs.join(";")}`;
  return base ? `${base}\n\n${meta}` : meta;
};

const getLessonAssignedStudents = (lesson) => {
  if (!lesson) return [];
  return splitLessonDescription(lesson.description).students;
};

const getLessonCleanDescription = (lesson) => {
  if (!lesson) return "";
  return splitLessonDescription(lesson.description).cleanDescription;
};

export default function TutorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weekOffset, setWeekOffset] = useState(0);
  const [students, setStudents] = useState([]);

  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "08:00",
    end_time: "09:00",
    status: "free",
    selectedStudentIds: [],
  });

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [gridSelectionState, setGridSelectionState] = useState({
    isDragging: false,
    dateKey: null,
    anchor: null,
    focus: null,
    moved: false,
  });

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
    loadStudents();
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

  const loadStudents = async () => {
    try {
      const users = await fetchUsers();
      const onlyStudents = (Array.isArray(users) ? users : []).filter((userItem) => userItem.role === "student");
      setStudents(onlyStudents);
    } catch {
      setStudents([]);
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

  const clampMinutesInDay = (value) => Math.min(Math.max(value, DAY_START_MINUTES), DAY_END_MINUTES);

  const minutesSpanInView = DAY_END_MINUTES - DAY_START_MINUTES;

  const getRangeStyle = (startMinutes, endMinutes) => {
    const safeStart = clampMinutesInDay(startMinutes);
    const safeEnd = clampMinutesInDay(endMinutes);
    const left = ((safeStart - DAY_START_MINUTES) / minutesSpanInView) * 100;
    const width = Math.max(((safeEnd - safeStart) / minutesSpanInView) * 100, 0.5);
    return { left: `${left}%`, width: `${width}%` };
  };

  const formatDateShort = (date) =>
    date.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });

  const formatWeekRange = () => {
    const first = weekDates[0];
    const last = weekDates[4];
    return `${first.toLocaleDateString("cs-CZ")} – ${last.toLocaleDateString("cs-CZ")}`;
  };

  const todayDateKey = toDateKey(new Date());

  const weekStats = useMemo(() => {
    const initial = { total: 0, free: 0, booked: 0, completed: 0 };
    return lessons.reduce((acc, lesson) => {
      if (!weekDateKeys.includes(lesson.date)) return acc;
      acc.total += 1;
      if (lesson.status === "free") acc.free += 1;
      else if (lesson.status === "booked") acc.booked += 1;
      else if (lesson.status === "completed") acc.completed += 1;
      return acc;
    }, initial);
  }, [lessons, weekDateKeys]);

  const dayRows = useMemo(
    () => DAYS.map((label, index) => ({ label, date: weekDates[index], dateKey: weekDateKeys[index] })),
    [weekDates, weekDateKeys]
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
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
      selectedStudentIds: [],
    });
    setLessonFormOpen(true);
  };

  const openCreateLessonAt = (dateKey, startTime, endTime) => {
    setEditingLesson(null);
    setLessonForm({
      title: "",
      description: "",
      date: dateKey,
      start_time: startTime,
      end_time: endTime,
      status: "free",
      selectedStudentIds: [],
    });
    setLessonFormOpen(true);
  };

  const openEditLesson = (lesson) => {
    const parsed = splitLessonDescription(lesson.description);
    const existingIds = new Set(students.map((student) => String(student.id)));
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title || "",
      description: parsed.cleanDescription || "",
      date: lesson.date || "",
      start_time: normalizeTime(lesson.start_time),
      end_time: normalizeTime(lesson.end_time),
      status: lesson.status || "free",
      selectedStudentIds: parsed.students
        .filter((student) => existingIds.has(String(student.id)))
        .map((student) => String(student.id)),
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
      selectedStudentIds: [],
    });
  };

  const handleLessonFormChange = (field, value) => {
    setLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const getTimelinePointerMinutes = (event) => {
    const area = event.currentTarget;
    if (!area || typeof area.getBoundingClientRect !== "function") {
      return DAY_START_MINUTES;
    }

    const rect = area.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width || 1);
    const ratio = x / (rect.width || 1);
    const rawMinutes = DAY_START_MINUTES + ratio * minutesSpanInView;
    const rounded = Math.floor(rawMinutes / 5) * 5;
    return clampMinutesInDay(rounded);
  };

  const getSelectionBounds = (anchorMinutes, focusMinutes) => {
    const start = clampMinutesInDay(Math.min(anchorMinutes, focusMinutes));
    const end = clampMinutesInDay(Math.max(anchorMinutes, focusMinutes) + 5);
    return { start, end: Math.max(end, start + 5) };
  };

  const startGridRangeSelection = (event, dateKey) => {
    if (event.button !== 0) return;
    if (event.target.closest("button, a, input, select, textarea, [data-lesson-card='true']")) return;
    event.preventDefault();

    const pointerMinutes = getTimelinePointerMinutes(event);
    setGridSelectionState({
      isDragging: true,
      dateKey,
      anchor: pointerMinutes,
      focus: pointerMinutes,
      moved: false,
    });
  };

  const continueGridRangeSelection = (event, dateKey) => {
    const pointerMinutes = getTimelinePointerMinutes(event);
    setGridSelectionState((prev) => {
      if (!prev.isDragging || prev.anchor === null || prev.dateKey !== dateKey) return prev;
      if (prev.focus === pointerMinutes) return prev;
      return {
        ...prev,
        focus: pointerMinutes,
        moved: prev.moved || Math.abs(pointerMinutes - prev.anchor) >= 5,
      };
    });
  };

  const getSelectionStyleForDay = (dateKey) => {
    if (!gridSelectionState.isDragging || gridSelectionState.dateKey !== dateKey) return null;
    if (gridSelectionState.anchor === null || gridSelectionState.focus === null) return null;

    let start;
    let end;

    if (!gridSelectionState.moved) {
      const hourStart =
        Math.floor((gridSelectionState.anchor - DAY_START_MINUTES) / 60) * 60 + DAY_START_MINUTES;
      start = clampMinutesInDay(hourStart);
      end = clampMinutesInDay(start + 60);
    } else {
      const bounds = getSelectionBounds(gridSelectionState.anchor, gridSelectionState.focus);
      start = bounds.start;
      end = bounds.end;
    }

    return getRangeStyle(start, end);
  };

  const stopGridRangeSelection = () => {
    let finalizedRange = null;

    setGridSelectionState((prev) => {
      if (!prev.isDragging || prev.anchor === null || prev.focus === null || !prev.dateKey) {
        return { isDragging: false, dateKey: null, anchor: null, focus: null, moved: false };
      }

      let startMinutes;
      let endMinutes;

      if (!prev.moved) {
        // Single click = select whole hour block.
        const hourStart =
          Math.floor((prev.anchor - DAY_START_MINUTES) / 60) * 60 + DAY_START_MINUTES;
        startMinutes = clampMinutesInDay(hourStart);
        endMinutes = clampMinutesInDay(startMinutes + 60);
      } else {
        const bounds = getSelectionBounds(prev.anchor, prev.focus);
        startMinutes = bounds.start;
        endMinutes = bounds.end;
      }

      finalizedRange = {
        dateKey: prev.dateKey,
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes),
      };

      return { isDragging: false, dateKey: null, anchor: null, focus: null, moved: false };
    });

    if (finalizedRange) {
      openCreateLessonAt(finalizedRange.dateKey, finalizedRange.startTime, finalizedRange.endTime);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => stopGridRangeSelection();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const buildLessonPayload = () => {
    const payload = {
      title: lessonForm.title.trim(),
      description: composeLessonDescription(
        lessonForm.description,
        lessonForm.selectedStudentIds,
        students
      ),
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

  const selectedLessonAssignedStudents = selectedLesson
    ? getLessonAssignedStudents(selectedLesson)
    : [];
  const selectedLessonCleanDescription = selectedLesson
    ? getLessonCleanDescription(selectedLesson)
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-red-700 text-white py-4 md:py-5 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 md:px-4 flex justify-between items-center gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Lektorský rozvrh</h1>
            <p className="text-slate-200 mt-1 text-sm">Profesionální školní přehled týdne</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={openCreateLesson}
              className="bg-white text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              + Přidat hodinu
            </button>
            <span className="text-blue-100 text-sm">👨‍🏫 {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-slate-900/35 hover:bg-slate-900/50 text-white px-3 py-1.5 rounded-xl text-sm transition-colors duration-300 font-semibold border border-white/20"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </div>

      <div className="w-[98vw] max-w-none mx-auto px-2 md:px-3 py-3 md:py-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-xl mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <button
            onClick={() => setWeekOffset((value) => value - 1)}
            className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold"
          >
            ← Předchozí týden
          </button>

          <p className="font-bold text-gray-800 text-sm md:text-base">{formatWeekRange()}</p>

          <button
            onClick={() => setWeekOffset((value) => value + 1)}
            className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-semibold"
          >
            Další týden →
          </button>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 shadow-xl overflow-hidden ring-1 ring-blue-100/80">
          <div className="overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-0">
              <colgroup>
                <col style={{ width: DAY_LABEL_COLUMN_WIDTH }} />
                {TIME_SLOTS.map((slot) => (
                  <col key={`col-${slot}`} style={{ width: `${100 / TIME_SLOTS.length}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-blue-900 sticky top-0 z-30">
                  <th className="px-3 py-3 text-white font-bold text-left sticky left-0 z-40 bg-blue-900 border-r border-blue-700 text-sm md:text-base">
                    Den
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot}
                      className="px-1 py-3 text-white font-bold text-center border-r border-blue-700/70"
                    >
                      <div className="text-sm md:text-base font-semibold">{slot}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {dayRows.map((dayRow, dayIndex) => (
                  <tr key={dayRow.dateKey} className="align-top">
                    <td
                      className={`px-3 py-3 sticky left-0 z-20 border-r border-b border-slate-200 ${
                        dayIndex % 2 === 0 ? "bg-slate-50" : "bg-slate-100"
                      } ${dayRow.dateKey === todayDateKey ? "ring-1 ring-inset ring-indigo-300" : ""}`}
                    >
                      <div className="font-bold text-slate-800 text-sm md:text-base">{dayRow.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{formatDateShort(dayRow.date)}</div>
                      {dayRow.dateKey === todayDateKey && (
                        <span className="inline-flex mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Dnes
                        </span>
                      )}
                    </td>

                    <td className="p-0 border-b border-r border-slate-200" colSpan={TIME_SLOTS.length}>
                      {(() => {
                        const dayLessons = lessonsByDate.get(dayRow.dateKey) || [];
                        const sortedLessons = [...dayLessons].sort(
                          (a, b) =>
                            timeToMinutes(normalizeTime(a.start_time)) -
                            timeToMinutes(normalizeTime(b.start_time))
                        );
                        const selectionStyle = getSelectionStyleForDay(dayRow.dateKey);
                        const rowHeight = Math.max(110, 30 + sortedLessons.length * 28);

                        return (
                          <div
                            onMouseDown={(event) => startGridRangeSelection(event, dayRow.dateKey)}
                            onMouseMove={(event) => continueGridRangeSelection(event, dayRow.dateKey)}
                            className={`relative overflow-hidden ${
                              dayRow.dateKey === todayDateKey
                                ? "ring-1 ring-indigo-200"
                                : ""
                            }`}
                            style={{
                              height: `${rowHeight}px`,
                              background: getTimeOfDayBackground(),
                            }}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(to right, rgba(59,130,246,0.18) 0, rgba(59,130,246,0.18) 1px, transparent 1px, transparent calc(100% / 12))",
                              }}
                            />

                            {selectionStyle && (
                              <div
                                className="absolute top-0 bottom-0 bg-blue-400/25 border-x border-blue-500/70 pointer-events-none"
                                style={selectionStyle}
                              />
                            )}

                            {sortedLessons.map((lesson, index) => {
                              const assignedStudents = getLessonAssignedStudents(lesson);
                              const startMinutes = clampMinutesInDay(
                                timeToMinutes(normalizeTime(lesson.start_time))
                              );
                              const rawEnd = clampMinutesInDay(
                                timeToMinutes(normalizeTime(lesson.end_time))
                              );
                              const endMinutes = Math.max(rawEnd, startMinutes + 5);
                              const durationMinutes = Math.max(endMinutes - startMinutes, 5);
                              const isCompactCard = durationMinutes <= 60;
                              const rangeStyle = getRangeStyle(startMinutes, endMinutes);

                              return (
                                <div
                                  key={lesson.id}
                                  data-lesson-card="true"
                                  className={`absolute rounded-xl border px-2 py-1.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md overflow-hidden flex flex-col ${
                                    STATUS_META[lesson.status]?.cardClass || "bg-slate-50 border-slate-200"
                                  }`}
                                  style={{
                                    ...rangeStyle,
                                    top: "10%",
                                    height: "80%",
                                    minHeight: "56px",
                                    zIndex: 10 + index,
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-0.5 min-w-0">
                                    <p className={`font-semibold text-gray-900 truncate min-w-0 ${isCompactCard ? "text-[10px]" : "text-xs"}`}>
                                      {lesson.title}
                                    </p>
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                        STATUS_META[lesson.status]?.chipClass ||
                                        "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {STATUS_META[lesson.status]?.short || lesson.status || "Neznámé"}
                                    </span>
                                  </div>
                                  <p className={`text-gray-700 truncate ${isCompactCard ? "text-[9px]" : "text-[10px]"}`}>
                                    {normalizeTime(lesson.start_time)} - {normalizeTime(lesson.end_time)}
                                  </p>
                                  {!isCompactCard && assignedStudents.length > 0 && (
                                    <p className="text-[10px] text-gray-700 truncate mt-0.5">
                                      {assignedStudents.length === 1 ? "Student:" : "Studenti:"} {assignedStudents.map((student) => student.name).join(", ")}
                                    </p>
                                  )}
                                  <div className="mt-auto pt-1 flex gap-1 min-w-0">
                                    <button
                                      onClick={() => openResourceModal(lesson)}
                                      className="flex-1 min-w-0 truncate text-[9px] leading-none bg-orange-500 hover:bg-orange-600 text-white px-1 py-1 rounded-md font-medium"
                                      title="Materiály"
                                    >
                                      {isCompactCard ? "Mat" : "Materiály"}
                                    </button>
                                    <button
                                      onClick={() => openEditLesson(lesson)}
                                      className="flex-1 min-w-0 truncate text-[9px] leading-none bg-blue-600 hover:bg-blue-700 text-white px-1 py-1 rounded-md font-medium"
                                      title="Upravit"
                                    >
                                      {isCompactCard ? "Upr" : "Upravit"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson)}
                                      className="flex-1 min-w-0 truncate text-[9px] leading-none bg-red-500 hover:bg-red-600 text-white px-1 py-1 rounded-md font-medium"
                                      title="Zrušit"
                                    >
                                      {isCompactCard ? "X" : "Zrušit"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {lessonFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {editingLesson ? "Upravit hodinu" : "Přidat novou hodinu"}
                </h2>
                <p className="text-sm text-slate-600 mt-1">Vyplň údaje hodiny do školního rozvrhu.</p>
              </div>
              <button onClick={closeLessonForm} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Název</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(event) => handleLessonFormChange("title", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  placeholder="Např. Konverzace B1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Popis</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(event) => handleLessonFormChange("description", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm min-h-[84px] bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  placeholder="Volitelný popis hodiny"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={lessonForm.date}
                  onChange={(event) => handleLessonFormChange("date", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={lessonForm.status}
                  onChange={(event) => handleLessonFormChange("status", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                >
                  <option value="free">Volná</option>
                  <option value="booked">Zarezervovaná</option>
                  <option value="completed">Dokončená</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Studenti (můžeš vybrat jednoho i více)
                </label>
                <div className="border border-slate-300 rounded-xl p-3 bg-white/90">
                  {students.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      V databázi zatím nejsou žádní studenti. Nejprve vytvoř studentský účet přes registraci.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {students.map((student) => {
                        const studentId = String(student.id);
                        const checked = lessonForm.selectedStudentIds.includes(studentId);

                        return (
                          <label
                            key={studentId}
                            className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 border cursor-pointer ${
                              checked
                                ? "bg-blue-50 border-blue-200 text-blue-800"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                setLessonForm((prev) => {
                                  const currentIds = prev.selectedStudentIds || [];
                                  if (event.target.checked) {
                                    return { ...prev, selectedStudentIds: [...currentIds, studentId] };
                                  }
                                  return {
                                    ...prev,
                                    selectedStudentIds: currentIds.filter((id) => id !== studentId),
                                  };
                                });
                              }}
                              className="accent-blue-600"
                            />
                            <span>{student.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Začátek</label>
                <input
                  type="time"
                  step={300}
                  value={lessonForm.start_time}
                  onChange={(event) => handleLessonFormChange("start_time", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Konec</label>
                <input
                  type="time"
                  step={300}
                  value={lessonForm.end_time}
                  onChange={(event) => handleLessonFormChange("end_time", event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end border-t border-slate-200 pt-4">
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
          <div className="bg-gradient-to-br from-white via-slate-50 to-orange-50 rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-slate-200">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Správa lekce</h2>
                <p className="text-slate-600 text-sm mt-1">
                  {selectedLesson.title} • {selectedLesson.date} • {normalizeTime(selectedLesson.start_time)}–{normalizeTime(selectedLesson.end_time)}
                </p>
                {selectedLessonAssignedStudents.length > 0 && (
                  <p className="text-slate-700 text-sm mt-2">
                    {selectedLessonAssignedStudents.length === 1 ? "Student:" : "Studenti:"} {selectedLessonAssignedStudents.map((student) => student.name).join(", ")}
                  </p>
                )}
                {selectedLessonCleanDescription && (
                  <p className="text-slate-600 text-sm mt-2">{selectedLessonCleanDescription}</p>
                )}
              </div>
              <button onClick={closeResourceModal} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 mb-3">📤 Nahrát soubor</h3>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
                {uploadedFile && <p className="text-xs text-green-700 mt-2">✓ {uploadedFile.name}</p>}
                <button
                  onClick={handleSaveMaterial}
                  disabled={saving}
                  className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl"
                >
                  Uložit materiál
                </button>
              </div>

              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 mb-3">📝 Přidat úkol</h3>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(event) => setAssignmentTitle(event.target.value)}
                  placeholder="Název úkolu"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-2 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <textarea
                  value={assignmentDescription}
                  onChange={(event) => setAssignmentDescription(event.target.value)}
                  placeholder="Popis úkolu"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-2 min-h-[88px] bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <input
                  type="date"
                  value={assignmentDueDate}
                  onChange={(event) => setAssignmentDueDate(event.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-2 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <button
                  onClick={handleCreateAssignment}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl"
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
                          className="w-full text-left border border-slate-200 hover:border-blue-300 rounded-lg p-2 bg-white"
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
              <div className="mt-6 border border-blue-200 bg-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">✏️ Upravit úkol</h3>
                <input
                  type="text"
                  value={editingAssignment.title}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-2 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <textarea
                  value={editingAssignment.description}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-2 min-h-[88px] bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <input
                  type="date"
                  value={editingAssignment.due_date || ""}
                  onChange={(event) =>
                    setEditingAssignment((prev) => ({ ...prev, due_date: event.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm mb-3 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
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
