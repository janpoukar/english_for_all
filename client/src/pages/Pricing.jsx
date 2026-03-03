import { Link } from "react-router-dom";

export default function Pricing() {
  const pricingPlans = [
    {
      name: "Začátečník",
      price: "299",
      period: "měsíc",
      description: "Perfektní pro první kroky s angličtinou",
      icon: "📚",
      color: "from-blue-50 to-blue-100",
      borderColor: "border-blue-300",
      features: [
        "4 lekce za měsíc",
        "45 minut za lekci",
        "Online výuka",
        "Záznamy lekcí",
        "Přístup k materiálům",
        "Email podpora"
      ],
      highlighted: false
    },
    {
      name: "Profesionál",
      price: "599",
      period: "měsíc",
      description: "Naše nejpopulárnější plán s maximálním pokrokem",
      icon: "🎯",
      color: "from-red-50 to-red-100",
      borderColor: "border-red-400",
      badge: "Nejpopulárnější",
      features: [
        "12 lekcí za měsíc",
        "60 minut za lekci",
        "Online i offline",
        "Záznamy lekcí",
        "Kompletní učební materiály",
        "Prioritní podpora",
        "Zkoušková příprava",
        "Měsíční hodnocení"
      ],
      highlighted: true
    },
    {
      name: "Expert",
      price: "999",
      period: "měsíc",
      description: "Individuální přístup s personalizovaným plánem",
      icon: "👑",
      color: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-400",
      features: [
        "Unlimited lekce",
        "90 minut za lekci",
        "1-on-1 výuka",
        "Záznamy lekcí",
        "Kompletní balíček materiálů",
        "24/7 podpora",
        "Cambridge/TOEFL příprava",
        "Týdenní hodnocení",
        "Vlastní studijní plán"
      ],
      highlighted: false
    }
  ];

  return (
    <main className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Přehledný Ceník</h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-8 font-medium">
            Vyberte si plán, který vám nejlépe vyhovuje. Všechny plány zahrnují záznamy lekcí a přístup k učebním materiálům.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-b from-white to-blue-50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-hard border border-gray-100 group ${
                  plan.highlighted ? "md:scale-105 shadow-hard md:shadow-hard" : "shadow-medium hover:-translate-y-2"
                }`}
              >
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color}`}></div>

                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-red-600 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                {/* Border glow */}
                <div
                  className={`absolute inset-0 border-2 ${plan.borderColor} rounded-2xl group-hover:shadow-glow transition-all duration-300`}
                ></div>

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 text-xs font-bold rounded-bl-lg shadow-md">
                    ⭐ {plan.badge}
                  </div>
                )}

                {/* Content */}
                <div className="relative p-8 h-full flex flex-col">\

                  <div className="text-5xl mb-4">{plan.icon}</div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price} Kč
                    </span>
                    <span className="text-gray-600 ml-2">/ {plan.period}</span>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to="/contact"
                    className={`w-full py-3 px-6 rounded-lg font-bold text-center mb-8 transition-all hover:shadow-lg ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-blue-900 to-red-700 text-white hover:scale-105"
                        : "bg-gradient-to-r from-blue-900 to-red-700 text-white hover:scale-105"
                    }`}
                  >
                    Vybrat plán
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-800">
                        <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            Často kladené otázky
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Mohu měnit plán kdykoliv?",
                a: "Ano, můžete kdykoliv upgradovat nebo downgradovat svůj plán. Změna se projeví od dalšího měsíce."
              },
              {
                q: "Je zahrnuta peníze zpět záruka?",
                a: "Pokud nejste spokojeni v prvních 30 dnech, vrátíme vám 100% peníz, bez jakýchkoliv otázek."
              },
              {
                q: "Jak dlouho trvají lekce?",
                a: "Délka lekcí se liší podle plánu: Začátečník (45 min), Profesionál (60 min), Expert (90 min)."
              },
              {
                q: "Mohu si naplánovat lekce dle svého harmonogramu?",
                a: "Absolutně! Můžete si vybrat časy, které vám vyhovují, a my se vám přizpůsobíme."
              },
              {
                q: "Co když si budu potřebovat více lekcí?",
                a: "Můžete si koupit dodatečné lekce k jakémukoliv plánu. Kontaktujte náš tým pro více informací."
              },
              {
                q: "Je dostupná offline výuka?",
                a: "Offline výuka je dostupná pouze v plánu Profesionál a Expert v Praze. Online výuka je možná u všech plánů."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900 to-red-800"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10">
          <div className="bg-white/10 glass-effect rounded-3xl p-8 md:p-16 text-center backdrop-blur-xl border border-white/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
              Připraveni začít svou cestu k angličtině?
            </h2>
            <p className="text-xl text-gray-100 mb-12 max-w-2xl mx-auto">
              Zájmete si bezplatnou počáteční konzultaci a zjistěte, který plán je pro vás nejlepší. Žádné závazky, pouze profesionální porada.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block bg-white text-blue-900 font-bold px-10 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Zarezervovat bezplatnou konzultaci
              </Link>
              <Link
                to="/courses"
                className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-10 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Podívat se na služby
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}