// API service for Supabase and backend communication
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
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

// Auth endpoints (if using backend)
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) throw new Error("Registration failed");
    return await response.json();
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};