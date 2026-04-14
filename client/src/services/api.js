// API service for Supabase and backend communication
import bcrypt from "bcryptjs";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "efa.anglictina@gmail.com";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const DEMO_STUDENT_EMAIL = import.meta.env.VITE_DEMO_STUDENT_EMAIL || "student@demo.cz";
const DEMO_STUDENT_PASSWORD = import.meta.env.VITE_DEMO_STUDENT_PASSWORD || "demo123";
const DEMO_STUDENT_PROFILE = {
  id: "demo-student",
  name: "David Šimek",
  email: DEMO_STUDENT_EMAIL,
  role: "student",
};

const parseJsonResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }
  return data;
};

// Helper pro Supabase fetch
const supabaseFetch = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP ${response.status}`;

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        message = parsed?.message || parsed?.error || message;
      } catch {
        message = errorText;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
};

// Lessons from Supabase
export const fetchLessons = async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase credentials nejsou nastaveny v .env");
    }
    
    return await supabaseFetch("/lessons?order=date.asc");
  } catch (error) {
    try {
      const response = await fetch(`${API_BASE}/lessons`);
      return await parseJsonResponse(response, "Nepodařilo se načíst lekce");
    } catch (fallbackError) {
      console.error("Error fetching lessons:", error);
      throw fallbackError;
    }
  }
};

export const fetchLessonById = async (id) => {
  try {
    const result = await supabaseFetch(`/lessons?id=eq.${id}`);
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching lesson:", error);
    throw error;
  }
};

export const createLesson = async (lessonData) => {
  try {
    const result = await supabaseFetch("/lessons", {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(lessonData)
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    try {
      const response = await fetch(`${API_BASE}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
      });
      return await parseJsonResponse(response, "Nepodařilo se vytvořit lekci");
    } catch (fallbackError) {
      console.error("Error creating lesson:", error);
      throw fallbackError;
    }
  }
};

export const updateLesson = async (id, updates) => {
  try {
    const result = await supabaseFetch(`/lessons?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(updates)
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    try {
      const response = await fetch(`${API_BASE}/lessons/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return await parseJsonResponse(response, "Nepodařilo se upravit lekci");
    } catch (fallbackError) {
      console.error("Error updating lesson:", error);
      throw fallbackError;
    }
  }
};

export const deleteLesson = async (id) => {
  try {
    await supabaseFetch(`/lessons?id=eq.${id}`, {
      method: "DELETE"
    });
    return true;
  } catch (error) {
    try {
      const response = await fetch(`${API_BASE}/lessons/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await parseJsonResponse(response, "Nepodařilo se smazat lekci");
      return true;
    } catch (fallbackError) {
      console.error("Error deleting lesson:", error);
      throw fallbackError;
    }
  }
};

// Users from Supabase
export const fetchUsers = async () => {
  try {
    return await supabaseFetch("/users");
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const fetchTutors = async () => {
  try {
    return await supabaseFetch("/users?role=eq.tutor");
  } catch (error) {
    console.error("Error fetching tutors:", error);
    throw error;
  }
};

// Materials from Supabase
export const fetchMaterials = async (lessonId) => {
  try {
    if (!lessonId) {
      console.warn("fetchMaterials: missing lessonId");
      return [];
    }
    
    const url = `${API_BASE}/materials?lesson_id=${encodeURIComponent(lessonId)}`;
    console.log(`[DEBUG] Fetching materials from: ${url}`);
    
    const response = await fetch(url);
    const result = await parseJsonResponse(response, "Nepodařilo se načíst materiály");
    console.log(`[DEBUG] Materials fetched:`, result);
    return result;
  } catch (error) {
    console.error("Error fetching materials:", error, { lessonId });
    throw error;
  }
};

export const uploadMaterial = async (payload) => {
  try {
    const lessonId = payload?.lessonId || payload?.lesson_id;
    const file = payload?.file;

    if (!lessonId) {
      throw new Error("Chybí ID lekce");
    }

    if (!file) {
      throw new Error("Chybí soubor");
    }

    console.log(`[DEBUG] Uploading material:`, { lessonId, fileName: file.name, fileSize: file.size });

    const formData = new FormData();
    formData.append("lesson_id", lessonId);
    formData.append("file", file);

    const url = `${API_BASE}/materials`;
    console.log(`[DEBUG] POST to: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const result = await parseJsonResponse(response, "Nepodařilo se uložit materiál");
    console.log(`[DEBUG] Material uploaded successfully:`, result);
    return result;
  } catch (error) {
    console.error("Error uploading material:", error);
    throw new Error(`Chyba při nahrávání materiálu: ${error?.message || "neznámá chyba"}`);
  }
};

export const deleteMaterial = async (materialId) => {
  try {
    if (!materialId) {
      throw new Error("Chybí ID materiálu");
    }

    const response = await fetch(`${API_BASE}/materials/${encodeURIComponent(materialId)}`, {
      method: "DELETE",
    });

    return await parseJsonResponse(response, "Nepodařilo se smazat materiál");
  } catch (error) {
    console.error("Error deleting material:", error);
    throw new Error(`Chyba při mazání materiálu: ${error?.message || "neznámá chyba"}`);
  }
};

export const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (fileUrl.startsWith("/")) return `${API_ORIGIN}${fileUrl}`;
  return `${API_ORIGIN}/${fileUrl.replace(/^\/+/, "")}`;
};

export const getMaterialDownloadUrl = (materialId) => {
  if (!materialId) return "";
  return `${API_BASE}/materials/${encodeURIComponent(materialId)}/download`;
};

const normalizeAssignment = (assignment) => {
  if (!assignment || typeof assignment !== "object") return assignment;

  const knownId = assignment.id || assignment.assignment_id || assignment.task_id;
  const discoveredId =
    knownId ||
    Object.entries(assignment).find(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      const normalizedKey = String(key || "").toLowerCase();
      if (normalizedKey === "lesson_id") return false;
      return normalizedKey.endsWith("id");
    })?.[1] ||
    null;

  return {
    ...assignment,
    id: discoveredId,
    status: (assignment.status || "probiha").toLowerCase(),
  };
};

// Assignments from Supabase
export const fetchAssignments = async (lessonId) => {
  try {
    const response = await fetch(`${API_BASE}/assignments?lesson_id=${encodeURIComponent(lessonId)}`);
    const data = await parseJsonResponse(response, "Nepodařilo se načíst úkoly");
    return Array.isArray(data) ? data.map(normalizeAssignment) : [];
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

export const createAssignment = async (assignmentData) => {
  try {
    const response = await fetch(`${API_BASE}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(assignmentData),
    });
    const data = await parseJsonResponse(response, "Nepodařilo se uložit úkol");
    return normalizeAssignment(data);
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

export const updateAssignment = async (id, updates) => {
  try {
    const response = await fetch(`${API_BASE}/assignments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    const data = await parseJsonResponse(response, "Nepodařilo se upravit úkol");
    return normalizeAssignment(data);
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw error;
  }
};

const buildUserSessionPayload = (user) => ({
  token: `dev-fallback-${user.id}`,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});

const INVALID_CREDENTIALS_MESSAGE = "Email nebo heslo není správné";

const normalizeLoginErrorMessage = (message) => {
  const text = String(message || "").toLowerCase();
  if (
    /špatné heslo|spatne heslo|neplatné|neplatne|invalid|uživatel neexistuje|user not found|unauthorized|401|403/.test(
      text
    )
  ) {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  return message || "Přihlášení selhalo";
};

// Auth endpoints (if using backend)
export const loginUser = async (email, password) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const normalizedDemoEmail = DEMO_STUDENT_EMAIL.trim().toLowerCase();

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const data = await response.json().catch(() => null);

    if (response.ok) {
      if (!data?.user || !data?.token) {
        throw new Error("Neplatná odpověď serveru při přihlášení");
      }
      return data;
    }

    const backendMessage = data?.error || data?.message || INVALID_CREDENTIALS_MESSAGE;
    const fallbackAllowed = /neexistuje|špatné heslo|spoj|connect|timeout|enetunreach|econnrefused/i.test(backendMessage);

    if (!fallbackAllowed) {
      throw new Error(normalizeLoginErrorMessage(backendMessage));
    }
  } catch (error) {
    // Dev fallback: if backend DB connection is missing, allow login for local/demo users.
    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error(normalizeLoginErrorMessage(error.message));
      }

      const result = await supabaseFetch(
        `/users?select=id,name,email,role,password_hash&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`
      );
      const user = Array.isArray(result) ? result[0] : null;

      if (!user) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error(INVALID_CREDENTIALS_MESSAGE);
      }

      const plainMatch = user.password_hash === password;
      const seededDemoMatch = /@student\.local$/i.test(user.email || "") && password === DEMO_STUDENT_PASSWORD;
      const bcryptMatch = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

      if (!plainMatch && !seededDemoMatch && !bcryptMatch) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error(INVALID_CREDENTIALS_MESSAGE);
      }

      return buildUserSessionPayload(user);
    } catch (fallbackError) {
      console.error("Error logging in:", error);
      throw new Error(normalizeLoginErrorMessage(fallbackError?.message));
    }
  }
};

export const registerUser = async (email, password, name, role = "student") => {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });
    return await parseJsonResponse(response, "Registrace selhala");
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const loginAdmin = async (email, password) => {
  // Zkusit přihlášení přes backend (pokud admin existuje v DB)
  try {
    const response = await loginUser(email, password);
    if (response?.user?.role === 'admin') {
      return response;
    }
    throw new Error('Nemáš oprávnění admina');
  } catch (err) {
    // Fallback na lokální ověření pro vývojářské účely
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      token: "admin-local-token-" + Date.now(),
      user: {
        id: "admin-local",
        name: "Správce",
        email: ADMIN_EMAIL,
        role: "admin",
      },
    };
  }
};

export const createUser = async (userData) => {
  try {
    const result = await supabaseFetch("/users", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(userData),
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const result = await supabaseFetch(`/users?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const adminChangePassword = async (userId, newPassword, token) => {
  if (!userId || !newPassword) {
    throw new Error("Vyber uživatele a vlož heslo");
  }

  if (newPassword.length < 6) {
    throw new Error("Heslo musí mít alespoň 6 znaků");
  }

  try {
    const response = await fetch(`${API_BASE}/auth/admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, newPassword }),
    });

    const data = await response.json().catch(() => null);
    if (response.ok) {
      return data || { success: true };
    }

    const message = data?.error || data?.message || `Chyba: ${response.status}`;
    const fallbackAllowed = /connect|enetunreach|econnrefused|timeout|failed to fetch|network|spoj/i.test(message);

    if (!fallbackAllowed) {
      throw new Error(message);
    }
  } catch (error) {
    const rawMessage = String(error?.message || "").toLowerCase();
    const fallbackAllowed = /connect|enetunreach|econnrefused|timeout|failed to fetch|network|spoj/.test(rawMessage);

    if (!fallbackAllowed) {
      throw error;
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabaseFetch(`/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({ password_hash: hashedPassword }),
    });
    return { success: true, message: "Heslo bylo změněno (fallback)" };
  } catch (fallbackError) {
    throw new Error(fallbackError?.message || "Chyba při změně hesla");
  }
};

export const deleteUser = async (id) => {
  try {
    await supabaseFetch(`/users?id=eq.${id}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const fetchContactMessages = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/contact`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await parseJsonResponse(response, "Nepodařilo se načíst kontaktní zprávy");
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    throw error;
  }
};

export const markContactMessageAsRead = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE}/contact/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ read: true }),
    });
    return await parseJsonResponse(response, "Nepodařilo se aktualizovat zprávu");
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const deleteContactMessage = async (id, token) => {
  try {
    const response = await fetch(`${API_BASE}/contact/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete message");
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact message:", error);
    throw error;
  }
};