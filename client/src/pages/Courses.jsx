import ServiceCard from "../components/ui/ServiceCard";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";

export default function Courses() {
  const courses = [
    {
      imageSrc: "/pictures/begginer.jpg",
      imageAlt: "Začátečníci - učební materiály",
      title: "Začátečníci (A1–A2)",
      description: "Naučte se základy angličtiny - slovní zásobu, gramatiku a jednoduché rozhovory.",
      features: ["Základní slovní zásoba", "Jednoduché věty", "Každodenní situace", "Výslovnost"]
    },
    {
      imageSrc: "/pictures/advanced.jpg",
      imageAlt: "Střední úroveň – pokročilejší výuka",
      title: "Střední úroveň (B1–B2)",
      description: "Zlepšete se v psaní, čtení a mluvení. Lépe pochopíte angličtinu v různých kontextech.",
      features: ["Komplexní gramatika", "Akademické texty", "Diskuse a argumenty", "Psaní esejů"]
    },
    {
      imageSrc: "/pictures/pro.jpg",
      imageAlt: "Pokročilý kurz angličtiny",
      title: "Pokročilí (C1+)",
      description: "Dosáhněte pokročilé úrovně. Mluvte plynule a čtěte složité texty bez problémů.",
      features: ["Nuancované vyjadřování", "Odborné texty", "Kulturní kontexty", "Tvůrčí psaní"]
    },
    {
      imageSrc: "/pictures/maturita.jpg",
      imageAlt: "Maturitní příprava",
      title: "Příprava k maturitě",
      description: "Cílená příprava na maturitní zkoušku z angličtiny včetně modelových úloh.",
      features: ["Poslech", "Čtení s porozuměním", "Psaní", "Ústní část a modelové otázky"]
    },
    {
      imageSrc: "/pictures/priprava_na_testy.png",
      imageAlt: "Příprava na jazykové testy",
      title: "Příprava na testy (FCE, TOEFL, IELTS)",
      description: "Intenzivní příprava k mezinárodním testům s důrazem na FCE a další zkoušky.",
      features: ["FCE strategie", "Procvičování reálných testů", "Časový management", "Modelové zkoušky"]
    },
    {
      imageSrc: "/pictures/conversation.jpg",
      imageAlt: "Konverzace v angličtině",
      title: "Konverzace",
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
              { icon: "📖", title: "Kvalitní materiály", desc: "Moderní učebnice a online zdroje" },
              { icon: "👨‍🎓", title: "Zkušení lektoři", desc: "Zkušení lektoři s praxí" },
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