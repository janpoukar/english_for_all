import ServiceCard from "../components/ui/ServiceCard";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";

export default function Courses() {
  const courses = [
    {
      icon: "🌍",
      title: "Začátečníci (A1-A2)",
      description: "Naučte se základy angličtiny - slovní zásobu, gramatiku a jednoduché rozhovory.",
      features: ["Základní slovní zásoba", "Jednoduché věty", "Každodenní situace", "Výslovnost"]
    },
    {
      icon: "📚",
      title: "Střední úroveň (B1-B2)",
      description: "Zlepšите se v psaní, čtení a mluvení. Lépe pochopíte angličtinu v různých kontextech.",
      features: ["Komplexní gramatika", "Akademické texty", "Diskuse a argumenty", "Psaní esejů"]
    },
    {
      icon: "💼",
      title: "Pokročilí (C1-C2)",
      description: "Dosáhněte dokonalosti. Mluvte jako rodilý mluvčí a čtěte složité texty bez problémů.",
      features: ["Nuancované vyjadřování", "Odborné texty", "Kulturní kontexty", "Výtvarné psaní"]
    },
    {
      icon: "🏢",
      title: "Business Angličtina",
      description: "Naučte se profesionální angličtinu pro práci, e-maily a obchodní jednání.",
      features: ["Obchodní komunikace", "Profesionální e-maily", "Prezentace", "Jednání s obchodními partnery"]
    },
    {
      icon: "🎓",
      title: "Příprava testů (TOEFL, IELTS)",
      description: "Intenzivní příprava k mezinárodním testům s garantovanými výsledky.",
      features: ["Strategie testů", "Praxe se starými testy", "Časové management", "Mock zkoušky"]
    },
    {
      icon: "🎬",
      title: "Konverzační Kurzy",
      description: "Zaměřte se na mluvení a porozumění angličtině v různých oblastech.",
      features: ["Aktivní diskuse", "Kulturní témata", "Zvukové materiály", "Filmové scény"]
    }
  ];

  return (
    <main className="w-full overflow-hidden">
      <PageHeader
        title="Naše kurzy"
        subtitle="Najděte kurz, který vám dokonale vyhovuje"
      />

      {/* Courses Grid */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, idx) => (
              <div key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
                <ServiceCard {...course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center">Co získáte v každém kurzu</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "📖", title: "Kvalitní Materiály", desc: "Moderní učebnice a online zdroje" },
              { icon: "👨‍🎓", title: "Experti", desc: "Certifikovaní rodilí mluvčí" },
              { icon: "🎯", title: "Personalizace", desc: "Plán přizpůsobený vám" },
              { icon: "⏱️", title: "Flexibilita", desc: "Výuka podle vašeho tempa" }
            ].map((item, idx) => (
              <div key={idx} className="text-center animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-red-700 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Připraveni začít?</h2>
          <p className="text-xl text-gray-100 mb-8">Vyberte si kurz a zarezervujte si první lekci</p>
          <Link 
            to="/contact" 
            className="px-10 py-4 bg-white text-red-700 font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all inline-block"
          >
            Zarezervovat kurz
          </Link>
        </div>
      </section>
    </main>
  );
}