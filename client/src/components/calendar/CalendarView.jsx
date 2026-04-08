import { useEffect, useState } from "react";
import Card from "../ui/Card";
import { fetchLessons } from "../../services/api";

export default function CalendarView() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLessons = async () => {
      try {
        const data = await fetchLessons();
        if (!isMounted) return;
        
        if (Array.isArray(data)) {
          setLessons(data);
          setError("");
        } else {
          throw new Error("Neplatný formát dat");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error:", err);
        
        let errorMsg = "Nepodařilo se načíst lekce";
        if (err.message.includes("Supabase credentials")) {
          errorMsg = "Chybí Supabase credentials v .env souboru";
        } else if (err.message.includes("HTTP")) {
          errorMsg = "Chyba komunikace s Supabase";
        }
        
        setError(errorMsg);
        setLessons([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <p className="font-semibold text-gray-700 mt-4">Načítání lekcí…</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-semibold text-red-700">⚠️ {error}</p>
          <p className="text-sm text-red-600 mt-3 font-medium">Zkontroluj prosím:</p>
          <ul className="text-sm text-red-600 mt-2 ml-4 list-disc space-y-1">
            <li>Supabase URL v .env (`VITE_SUPABASE_URL`)</li>
            <li>Supabase API Key v .env (`VITE_SUPABASE_ANON_KEY`)</li>
            <li>Tabulka `lessons` existuje v Supabase</li>
            <li>RLS politiky jsou nastavené (SELECT allowed)</li>
            <li>Vite dev server se restartoval (Ctrl+C a npm run dev)</li>
          </ul>
          <p className="text-xs text-red-500 mt-4 font-mono bg-red-100 p-2 rounded">
            Otevři Browser console (F12) pro více detailů
          </p>
        </div>
      </Card>
    );
  }

  if (lessons.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-4xl mb-4">📅</p>
          <p className="font-semibold text-gray-700">Zatím tu nejsou žádné naplánované lekce.</p>
          <p className="text-sm text-gray-500 mt-2">Lekce se zde zobrazí, jakmile budou přidány do Supabase.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (
        <Card key={lesson.id} className="bg-gradient-to-r from-blue-50 via-yellow-100 to-blue-50 hover:from-blue-50 hover:via-yellow-200 hover:to-blue-50 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-900 flex-1">{lesson.title}</h3>
            <span className="text-2xl">📚</span>
          </div>
          
          {lesson.description && (
            <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>
          )}
          
          <div className="text-5xl font-bold text-gray-900 my-8 w-full text-center">
            {lesson.start_time?.substring(0, 5) || 'N/A'} - {lesson.end_time?.substring(0, 5) || 'N/A'}
          </div>
          
          <div className="space-y-2 pt-4 border-t border-yellow-400 opacity-60 mt-auto">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-base">📅</span>
              <span className="font-medium">
                {new Date(lesson.date).toLocaleDateString('cs-CZ', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            {lesson.status && (
              <div className="mt-3 pt-3 border-t border-yellow-400 opacity-60">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  lesson.status === 'free' ? 'bg-green-200 text-green-800' :
                  lesson.status === 'booked' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {lesson.status === 'free' ? '✅ Volná' :
                   lesson.status === 'booked' ? '📍 Zarezervována' :
                   '✓ Hotovo'}
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}