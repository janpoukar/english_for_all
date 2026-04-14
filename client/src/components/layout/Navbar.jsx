import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      return;
    }
    setUser(null);
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "Domů" },
    { path: "/courses", label: "Kurzy" },
    { path: "/pricing", label: "Ceník" },
    { path: "/gallery", label: "Fotogalerie" },
    { path: "/dashboard", label: "Rozvrh" },
    { path: "/contact", label: "Kontakt" }
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/");
    setIsOpen(false);
  };

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4 md:px-8 md:py-5">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <img 
            src="/logo.png" 
            alt="English for All Logo" 
            className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition-transform duration-300"
          />
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-red-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-300">
              English for All
            </span>
            <span className="text-xs md:text-sm font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-red-600 bg-clip-text text-transparent">
              – Angličtina pro všechny
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
          {navLinks.map(({ path, label }) => (
            <Link 
              key={path}
              to={path} 
              className="text-gray-700 hover:text-blue-700 font-medium px-4 py-2 rounded-lg transition-all duration-300 relative group text-sm"
            >
              {label}
              <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-red-600 group-hover:w-full transition-all duration-300 rounded-full"></span>
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300">
              <span className="text-sm font-medium text-gray-700">
                {user.role === "admin" ? "🛠️" : user.role === "tutor" ? "👨‍🏫" : "👨‍🎓"} {user.name}
              </span>
              <Link 
                to={
                  user.role === "admin"
                    ? "/admin-dashboard"
                    : user.role === "tutor"
                      ? "/tutor-dashboard"
                      : "/student-dashboard"
                }
                className="btn-primary text-sm font-semibold px-4 py-2"
              >
                {user.role === "admin" ? "Správa" : "Moje lekce"}
              </Link>
              <button 
                onClick={handleLogout}
                className="btn-secondary text-sm font-semibold px-4 py-2"
              >
                Odhlásit
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="ml-4 btn-primary text-sm font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
            >
              Přihlásit se
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
          aria-label="Toggle menu"
        >
          <div className="text-2xl text-gray-700">
            {isOpen ? "✕" : "☰"}
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in-down">
          <div className="px-4 py-4 max-w-7xl mx-auto">
            <div className="flex flex-col space-y-2">
              {navLinks.map(({ path, label }) => (
                <Link 
                  key={path}
                  to={path} 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-700 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-3 rounded-lg transition-all duration-300"
                >
                  {label}
                </Link>
              ))}
              
              {user ? (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-medium text-gray-600 px-4">
                    {user.role === "admin" ? "🛠️ Správce" : user.role === "tutor" ? "👨‍🏫 Lektor" : "👨‍🎓 Student"}: <strong>{user.name}</strong>
                  </p>
                  <Link 
                    to={
                      user.role === "admin"
                        ? "/admin-dashboard"
                        : user.role === "tutor"
                          ? "/tutor-dashboard"
                          : "/student-dashboard"
                    }
                    onClick={() => setIsOpen(false)}
                    className="w-full btn-primary text-center mt-2 font-semibold"
                  >
                    {user.role === "admin" ? "Správa" : "Moje lekce"}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full btn-secondary text-center font-semibold"
                  >
                    Odhlásit se
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="w-full btn-primary text-center mt-4 font-semibold"
                >
                  Přihlásit se
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}