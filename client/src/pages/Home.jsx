import { Link } from "react-router-dom";
import ServiceCard from "../components/ui/ServiceCard";
import WavingFlag from "../components/WavingFlag";

export default function Home() {
  const services = [
    {
      imageSrc: "/pictures/doucovani.png",
      imageAlt: "Doučování",
      title: "Doučování",
      description: "Cílená výuka pro snadnou komunikaci v zahraničí, v běžných situacích i na cestách.",
      features: ["✓ Praktické fráze", "✓ Jistota v běžné komunikaci", "✓ Konverzační trénink", "✓ Důraz na používání jazyka v praxi"]
    },
    {
      imageSrc: "/pictures/graduation.png",
      imageAlt: "Příprava k maturitě",
      title: "Příprava k maturitě",
      description: "Systematická příprava na písemnou i ústní část maturitní zkoušky z angličtiny.",
      features: ["✓ Modelové testy", "✓ Maturitní témata", "✓ Nácvik ústní části", "✓ Strategie pro lepší výsledek"]
    },
    {
      imageSrc: "/pictures/fce.png",
      imageAlt: "Příprava k FCE zkouškám",
      title: "Příprava k FCE zkouškám",
      description: "Komplexní trénink na Cambridge B2 First (FCE) včetně všech částí zkoušky.",
      features: ["✓ Reading, Writing, Listening, Speaking", "✓ Autentické testové úlohy", "✓ Tipy ke každé části", "✓ Postupná příprava na zkoušku"]
    }
  ];

  const locations = [
    {
      name: "Učebna v centru Jihlavy",
      address: "Centrum města Jihlavy",
      imageSrc: "/pictures/jihlava_center.png",
      imageAlt: "Učebna v centru Jihlavy",
      info: "Příjemná učebna v centru města s dobrou dostupností a klidnou atmosférou pro výuku.",
      features: ["Snadná dostupnost", "Vybavená učebna", "Přátelská atmosféra"]
    }
  ];

  return (
    <main className="w-full overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-red-900 text-white py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ pointerEvents: 'none' }}>
          <div className="absolute top-10 -left-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-10 -right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-bounce-slow" style={{ animationDelay: "0.5s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center py-12">
            <div className="animate-slide-in-left">
              <div className="mb-8 inline-block">
                <span className="bg-white/20 glass-effect px-6 py-3 rounded-full text-white text-sm font-semibold">
                  ✨ Nový způsob učení angličtiny
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-white">
                English for All
                <span className="block bg-gradient-to-r from-blue-200 to-blue-300 bg-clip-text text-transparent mt-3 text-5xl md:text-6xl font-black">
                  Angličtina bez komplikací
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed max-w-lg">
                Doučování, příprava k maturitě a příprava k FCE zkouškám na jednom místě.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-16">
                <Link to="/contact" className="btn-primary text-center hover-shine px-8 py-4 text-base md:text-lg font-bold">
                  Zarezervovat lekci
                </Link>
                <Link to="/pricing" className="btn-secondary text-white border-white hover:bg-white/15 text-center px-8 py-4 text-base md:text-lg font-bold">
                  Ceny
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/30">
                <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <p className="text-3xl md:text-4xl font-bold">100+</p>
                  <p className="text-gray-200 text-xs md:text-sm mt-2">Spokojených studentů</p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  <p className="text-3xl md:text-4xl font-bold">20+</p>
                  <p className="text-gray-200 text-xs md:text-sm mt-2">Let zkušeností</p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  <p className="text-3xl md:text-4xl font-bold">95 %</p>
                  <p className="text-gray-200 text-xs md:text-sm mt-2">Úspěšnost</p>
                </div>
              </div>
            </div>

            <div className="animate-slide-in-right hidden md:flex flex-col items-center justify-center">
              <div className="relative mb-12">
                <div className="flex justify-center items-start">
                  <WavingFlag />
                </div>
              </div>
              <div className="w-full space-y-4">
                <div className="card-modern bg-white/10 glass-effect backdrop-blur border border-white/30 hover-lift p-6 transform transition-all">
                  <p className="font-bold text-lg mb-2 text-white">✨ Interaktivní lekce</p>
                  <p className="text-sm text-gray-100">Zábavná a poutavá výuka</p>
                </div>
                <div className="card-modern bg-white/10 glass-effect backdrop-blur border border-white/30 hover-lift p-6 transform transition-all">
                  <p className="font-bold text-lg mb-2 text-white">📊 Pokrok v reálném čase</p>
                  <p className="text-sm text-gray-100">Sledujte své zlepšování</p>
                </div>
                <div className="card-modern bg-white/10 glass-effect backdrop-blur border border-white/30 hover-lift p-6 transform transition-all">
                  <p className="font-bold text-lg mb-2 text-white">📍 Umístění</p>
                  <p className="text-sm text-gray-100">Učebna v centru města Jihlavy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Premium */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-white via-blue-50 to-white relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16 md:mb-20 animate-fade-in-up">
            <span className="badge badge-primary mb-4 inline-block text-xs md:text-sm px-4 py-2">NAŠE SLUŽBY</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-snug">Najděte kurz pro Vás</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, idx) => (
              <div key={idx} style={{ animationDelay: `${idx * 0.15}s` }} className="animate-fade-in-up">
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Premium */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-red-50"></div>
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="animate-slide-in-left">
              <span className="badge badge-primary mb-4 inline-block text-xs md:text-sm px-4 py-2">PROČ SI NÁS VYBRAT</span>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-900 to-red-700 bg-clip-text text-transparent mb-8 leading-snug">
                Vaše perfektní volba
              </h2>
              
              <div className="space-y-5">
                <div className="flex gap-4 hover-lift p-6 rounded-xl transition bg-white/50 border border-blue-100 shadow-soft hover:shadow-medium">
                  <span className="text-3xl md:text-4xl flex-shrink-0 glow-pulse">🎯</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900">Personalizovaný přístup</h3>
                    <p className="text-sm md:text-base text-gray-600">Personalizovaná výuka pro potřeby každého studenta</p>
                  </div>
                </div>
                <div className="flex gap-4 hover-lift p-6 rounded-xl transition bg-white/50 border border-red-100 shadow-soft hover:shadow-medium">
                  <span className="text-3xl md:text-4xl flex-shrink-0 glow-pulse">👨‍🎓</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900">Dlouholeté zkušenosti</h3>
                    <p className="text-sm md:text-base text-gray-600">Dlouholetá praxe ve výuce angličtiny a přípravě na maturitu a zkoušky FCE</p>
                  </div>
                </div>
                <div className="flex gap-4 hover-lift p-6 rounded-xl transition bg-white/50 border border-blue-100 shadow-soft hover:shadow-medium">
                  <span className="text-3xl md:text-4xl flex-shrink-0 glow-pulse">💰</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900">Konkurenční ceny</h3>
                    <p className="text-sm md:text-base text-gray-600">Nejlepší poměr ceny a kvality pro každého studenta</p>
                  </div>
                </div>
                <div className="flex gap-4 hover-lift p-6 rounded-xl transition bg-white/50 border border-red-100 shadow-soft hover:shadow-medium">
                  <span className="text-3xl md:text-4xl flex-shrink-0 glow-pulse">📈</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900">Prokázané výsledky</h3>
                    <p className="text-sm md:text-base text-gray-600">95 % studentů dosahuje svých cílů</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-slide-in-right">
              <div className="bg-gradient-to-br from-blue-900 to-red-700 text-white rounded-3xl p-8 md:p-12 text-center shadow-hard hover-lift transform transition-all">
                <p className="text-7xl md:text-8xl mb-6 animate-bounce-slow">⭐</p>
                <p className="text-5xl md:text-6xl font-black mb-2">4,9 / 5,0</p>
                <p className="text-lg md:text-xl mb-12 text-gray-100 font-semibold">Průměrné hodnocení od studentů</p>
                
                <div className="space-y-3 text-left">
                  <div className="bg-white/10 glass-effect p-4 rounded-lg border border-white/20">
                    <p className="font-semibold text-sm md:text-base">✓ "Mohu doporučit, kladné zkušenosti." - Aneta K.</p>
                  </div>
                  <div className="bg-white/10 glass-effect p-4 rounded-lg border border-white/20">
                    <p className="font-semibold text-sm md:text-base">✓ "Velký pokrok za krátkou dobu" - David N.</p>
                  </div>
                  <div className="bg-white/10 glass-effect p-4 rounded-lg border border-white/20">
                    <p className="font-semibold text-sm md:text-base">✓ "Doporučuji všem přátelům!" - Petra C.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section - Premium */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white via-red-50 to-white relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-15"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-14 md:mb-18 animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight">Lokalita učebny</h2>
            <div className="mx-auto mt-5 h-1.5 w-28 rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-red-600"></div>
          </div>

          <div className="grid md:grid-cols-1 gap-6 md:gap-8 max-w-3xl mx-auto">
            {locations.map((location, idx) => (
              <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.15}s` }}>
                <div className="group relative h-full overflow-hidden rounded-[34px] border border-blue-100/80 bg-white/95 shadow-[0_24px_70px_rgba(0,71,171,0.14)] transition-all duration-500 transform-gpu will-change-transform hover:-translate-y-2 hover:shadow-[0_34px_90px_rgba(0,71,171,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-red-50 opacity-95"></div>
                  <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-blue-200/25 blur-3xl"></div>
                  <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-red-200/20 blur-3xl"></div>
                  <div className="absolute inset-0 rounded-[34px] ring-1 ring-inset ring-white/60 pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="px-6 md:px-10 pt-6 md:pt-10">
                      <img
                        src={location.imageSrc}
                        alt={location.imageAlt}
                        className="block w-full h-64 md:h-80 object-cover rounded-2xl"
                        loading="lazy"
                      />
                    </div>

                    <div className="px-6 md:px-10 py-6 md:py-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{location.name}</h3>
                      <p className="text-gray-600 mb-4 text-base md:text-lg font-semibold">{location.address}</p>
                      <p className="text-gray-700 mb-6 text-sm md:text-base leading-relaxed">{location.info}</p>
                      <div className="grid gap-2 border-t border-blue-100 pt-4 md:pt-6">
                        {location.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm md:text-base text-gray-700 rounded-xl bg-white/70 px-4 py-3 border border-blue-100/70">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                              ✓
                            </span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-blue-950 via-blue-900 to-red-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-bounce-slow"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-snug">Připraveni začít?</h2>
          <p className="text-lg md:text-xl text-gray-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Objednejte si první lekci a posuňte svou angličtinu dál
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary hover-shine px-8 py-4 text-base md:text-lg font-bold">
              Zarezervovat lekci
            </Link>
            <Link to="/pricing" className="btn-secondary text-white border-white hover:bg-white/20 px-8 py-4 text-base md:text-lg font-bold">
              Podívat se na ceník
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}