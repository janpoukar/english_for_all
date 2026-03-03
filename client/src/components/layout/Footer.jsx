import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-blue-950 via-gray-900 to-black text-white">
      {/* Main Footer */}
      <div className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {/* About */}
            <div className="animate-fade-in-up">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                English for All
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                Profesionální výuka angličtiny pro všechny úrovně. Věříme, že každý se může naučit anglicky!
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-700 flex items-center justify-center transition-all hover-lift shadow-md text-lg font-bold hover:shadow-glow duration-300">
                  f
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-700 flex items-center justify-center transition-all hover-lift shadow-md text-lg hover:shadow-glow duration-300">
                  📷
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-800 flex items-center justify-center transition-all hover-lift shadow-md text-sm font-bold hover:shadow-glow duration-300">
                  in
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h4 className="font-bold mb-6 text-lg text-white">Rychlé Odkady</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Domů
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/courses" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Kurzy
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Ceník
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Kontakt
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h4 className="font-bold mb-6 text-lg text-white">Služby</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Individuální výuka
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Skupinové kurzy
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Online lekce
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-all relative group font-medium text-sm">
                    Business Angličtina
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <h4 className="font-bold mb-6 text-lg text-white">Kontakt</h4>
              <ul className="space-y-4">
                <li className="text-gray-300 hover:text-white transition group">
                  <span className="block font-bold text-white mb-1 text-sm group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-orange-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">Adresa</span>
                  <span className="text-xs text-gray-400">Nerudova 42, Praha 1</span>
                </li>
                <li className="text-gray-300 hover:text-white transition group">
                  <span className="block font-bold text-white mb-1 text-sm group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-orange-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">Telefon</span>
                  <span className="text-xs text-gray-400">+420 777 123 456</span>
                </li>
                <li className="text-gray-300 hover:text-white transition group">
                  <span className="block font-bold text-white mb-1 text-sm group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-orange-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">Email</span>
                  <span className="text-xs text-gray-400">info@englishtutor.cz</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-red-700 rounded-2xl p-8 md:p-12 mb-12 animate-fade-in-up shadow-hard hover-lift transform transition-all border border-blue-700/50">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">Přihlaste se k Newsletteru</h3>
                <p className="text-blue-100 text-sm md:text-base">Dostávajte aktuální tipy na učení angličtiny a nové kurzy</p>
              </div>
              <form className="flex gap-2 flex-col md:flex-row">
                <input
                  type="email"
                  placeholder="Váš email"
                  className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 form-input bg-white font-medium text-sm"
                />
                <button
                  type="submit"
                  className="px-6 md:px-8 py-3 bg-white text-blue-900 font-bold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all hover-shine text-sm md:text-base"
                >
                  Přihlásit
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700/50 pt-8">
            <div className="grid md:grid-cols-3 gap-8 text-gray-400 text-xs md:text-sm animate-fade-in-up">
              <div>
                <p>&copy; {currentYear} English for All. Všechna práva vyhrazena.</p>
              </div>
              <div className="text-center">
                <a href="#" className="hover:text-white transition mr-4 font-medium hover:text-blue-400 duration-300">
                  Zásady ochrany
                </a>
                <a href="#" className="hover:text-white transition font-medium hover:text-blue-400 duration-300">
                  Podmínky použití
                </a>
              </div>
              <div className="text-right">
                <p>Vytvořeno pro milovníky jazyků s ❤️</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}