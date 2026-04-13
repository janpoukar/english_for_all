// API service for Supabase and backend communication
import bcrypt from "bcryptjs";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@english.local";
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
    console.error("Error fetching lessons:", error);
    throw error;
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
    console.error("Error creating lesson:", error);
    throw error;
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
    console.error("Error updating lesson:", error);
    throw error;
  }
};

export const deleteLesson = async (id) => {
  try {
    await supabaseFetch(`/lessons?id=eq.${id}`, {
      method: "DELETE"
    });
    return true;
  } catch (error) {
    console.error("Error deleting lesson:", error);
    throw error;
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
    return await supabaseFetch(`/materials?lesson_id=eq.${lessonId}`);
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw error;
  }
};

export const uploadMaterial = async (materialData) => {
  try {
    const result = await supabaseFetch("/materials", {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(materialData)
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error("Error uploading material:", error);
    throw error;
  }
};

// Assignments from Supabase
export const fetchAssignments = async (lessonId) => {
  try {
    return await supabaseFetch(`/assignments?lesson_id=eq.${lessonId}&order=created_at.desc`);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

export const createAssignment = async (assignmentData) => {
  try {
    const result = await supabaseFetch("/assignments", {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(assignmentData)
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

export const updateAssignment = async (id, updates) => {
  try {
    const result = await supabaseFetch(`/assignments?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify(updates)
    });
    return Array.isArray(result) ? result[0] : result;
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
      return data;
    }

    const backendMessage = data?.error || data?.message || "Přihlášení selhalo";
    const fallbackAllowed = /neexistuje|špatné heslo|spoj|connect|timeout|enetunreach|econnrefused/i.test(backendMessage);

    if (!fallbackAllowed) {
      throw new Error(backendMessage);
    }
  } catch (error) {
    // Dev fallback: if backend DB connection is missing, allow login for local/demo users.
    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error(error.message || "Přihlášení selhalo");
      }

      const result = await supabaseFetch(
        `/users?select=id,name,email,role,password_hash&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`
      );
      const user = Array.isArray(result) ? result[0] : null;

      if (!user) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error("Uživatel neexistuje");
      }

      const plainMatch = user.password_hash === password;
      const seededDemoMatch = /@student\.local$/i.test(user.email || "") && password === DEMO_STUDENT_PASSWORD;
      const bcryptMatch = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

      if (!plainMatch && !seededDemoMatch && !bcryptMatch) {
        if (normalizedEmail === normalizedDemoEmail && password === DEMO_STUDENT_PASSWORD) {
          return buildUserSessionPayload(DEMO_STUDENT_PROFILE);
        }

        throw new Error("Špatné heslo");
      }

      return buildUserSessionPayload(user);
    } catch (fallbackError) {
      console.error("Error logging in:", error);
      throw fallbackError;
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
    if (response.user.role === 'admin') {
      return response;
    }
    throw new Error('Nemáš oprávnění admina');
  } catch (err) {
    // Fallback na lokální ověření pro vývojářské účely
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error("Neplatné přihlašovací údaje správce");
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