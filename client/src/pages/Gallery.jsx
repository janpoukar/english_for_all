import PageHeader from "../components/layout/PageHeader";

export default function Gallery() {
  const images = [
    {
      id: 1,
      title: "Moderní učebna",
      description: "Naše hlavní učebna vybavená nejnovější technologií",
      url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop"
    },
    {
      id: 2,
      title: "Skupinová lekce",
      description: "Studenti během skupinové konverzační lekce",
      url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
    },
    {
      id: 3,
      title: "Individuální výuka",
      description: "One-on-one výuka s naším certifikovaným lektorem",
      url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
    },
    {
      id: 4,
      title: "Knihovna",
      description: "Bohatá sbírka anglických knih a materiálů",
      url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop"
    },
    {
      id: 5,
      title: "Online platforma",
      description: "Studujte odkudkoliv s naší online platformou",
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop"
    },
    {
      id: 6,
      title: "Diplomy a certifikáty",
      description: "Absolventi s jejich dosažení",
      url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop"
    }
  ];

  return (
    <main className="w-full overflow-hidden">
      <PageHeader
        title="Fotogalerie"
        subtitle="Nahlédněte do našeho světa výuky angličtiny"
      />

      {/* Gallery Grid */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {images.map((image, idx) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-all duration-500 animate-fade-in-up bg-white"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                    <p className="text-sm text-gray-200">{image.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center">Naše Prostory</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "🏫", title: "2 Lokace", desc: "V centru Prahy" },
              { icon: "👨‍🏫", title: "15+ Lektorů", desc: "Certifikovaní rodilí mluvčí" },
              { icon: "📚", title: "5 Učeben", desc: "Moderně vybavené prostory" },
              { icon: "💻", title: "Online", desc: "Flexibilní výuka odkudkoliv" }
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
      <section className="py-20 md:py-32 bg-gradient-to-r from-blue-700 to-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Navštivte nás osobně!</h2>
          <p className="text-xl text-gray-100 mb-8">Přijďte se podívat na naše prostory a seznamte se s lektory</p>
          <a 
            href="/contact" 
            className="inline-block px-10 py-4 bg-white text-blue-700 font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all"
          >
            Kontaktovat nás
          </a>
        </div>
      </section>
    </main>
  );
}
