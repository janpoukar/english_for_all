import { Link } from "react-router-dom";

export default function Pricing() {
  const pricingPlans = [
    {
      name: "Individuální lekce",
      price: "400",
      period: "hodina",
      description: "Přesně pro tebe. Bez rozptylování v přítomnosti ostatních.",
      icon: "👤",
      color: "from-blue-50 via-white to-blue-50",
      borderColor: "border-blue-200",
      features: [
        "Cena za 60 minut výuky",
        "Individuální přístup",
        "Čas dle vašeho harmonogramu",
      ],
    },
    {
      name: "Skupinová lekce",
      price: "500",
      period: "hodina",
      description: "Pro skupinu až do 3 lidí. Zábavnější edukace se spolužáky.",
      icon: "👥",
      color: "from-red-50 via-white to-red-50",
      borderColor: "border-red-200",
      features: [
        "Cena za 60 minut výuky",
        "Skupinový kurz (až 3 lidé)",
        "Časový slot dle skupiny",
      ],
    },
    {
      name: "Doučování ve firmách",
      price: "od 600+",
      period: "hodina",
      description: "Firemní výuka přímo u vás na pracovišti. Obsah na míru podle oboru a týmu.",
      icon: "🏢",
      color: "from-amber-50 via-white to-orange-50",
      borderColor: "border-amber-200",
      features: [
        "Cena od 600 Kč za 60 minut",
        "Program pro týmy a oddělení",
        "Business English, meetingy, prezentace",
      ],
    },
  ];

  const faqs = [
    {
      q: "Jaká je cena individuální lekce?",
      a: "Individuální lekce stojí 400 Kč za hodinu.",
    },
    {
      q: "Jaká je cena skupinové lekce?",
      a: "Skupinová lekce (až 3 lidé) stojí 500 Kč za hodinu.",
    },
    {
      q: "Lze si domluvit čas lekce?",
      a: "Ano, čas lekce je možné domluvit individuálně podle vašich možností.",
    },
    {
      q: "Nabízíte i firemní doučování?",
      a: "Ano, firemní výuka začíná od 600 Kč za hodinu a připravíme ji podle úrovně i zaměření vašeho týmu.",
    },
    {
      q: "Co všechno cena zahrnuje?",
      a: "Individuální přístup, přípravu na lekci a výuku podle vašich cílů.",
    },
    {
      q: "Mohu si naplánovat lekce dle svého harmonogramu?",
      a: "Ano, časy lekcí domlouváme podle toho, co vám vyhovuje.",
    },
  ];

  return (
    <main className="w-full overflow-hidden">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Rozdílné ceny pro různé potřeby</h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-8 font-medium">
            Jasné a přehledné ceny. Platíte pouze za čas, který skutečně využijete.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-b from-white to-blue-50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div key={idx} className="relative rounded-[28px] overflow-hidden transition-all duration-500 border shadow-[0_24px_80px_rgba(0,71,171,0.12)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color}`}></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-red-600 to-orange-500"></div>
                <div className={`absolute inset-0 border-2 ${plan.borderColor} rounded-[28px] pointer-events-none`}></div>

                <div className="relative p-8 md:p-10 h-full flex flex-col text-center">
                  <div className="text-5xl mb-4">{plan.icon}</div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm md:text-base mb-8 max-w-xl mx-auto">{plan.description}</p>

                  <div className="mb-8 flex items-end justify-center gap-2 whitespace-nowrap max-w-full">
                    <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-none">{plan.price} Kč</span>
                    <span className="text-sm sm:text-base lg:text-lg text-gray-600 leading-none">/ {plan.period}</span>
                  </div>

                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center w-full md:w-auto md:min-w-64 mx-auto py-3 px-8 rounded-xl font-bold text-center mb-8 transition-all hover:shadow-lg bg-gradient-to-r from-blue-900 to-red-700 text-white hover:scale-[1.02]"
                  >
                    Rezervovat lekci
                  </Link>

                  <ul className="space-y-3 text-left max-w-md mx-auto">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3 text-gray-800">
                        <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 md:px-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Často kladené otázky</h2>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                <h4 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h4>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Zarezervujte si konzultaci a domluvte si první lekci. Individuální lekce 400 Kč, skupinová 500 Kč a firemní doučování od 600 Kč za hodinu.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-block bg-white text-blue-900 font-bold px-10 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
              >
                Zarezervovat konzultaci
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
