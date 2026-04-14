import PageHeader from "../components/layout/PageHeader";

export default function Gallery() {
  const images = [
    {
      id: 1,
      title: "Naše učebna",
      description: "Stejná učebna z jiného úhlu pohledu",
      url: "/pictures/ucebna1.jpg"
    },
    {
      id: 2,
      title: "Naše učebna",
      description: "Stejná učebna z jiného úhlu pohledu",
      url: "/pictures/ucebna2.jpg"
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
              { icon: "🏫", title: "Učebna v centru města Jihlavy", desc: "Pohodlná dostupnost a příjemné prostředí" },
              { icon: "👨‍🏫", title: "Zkušená lektorka", desc: "Dlouholetá praxe ve výuce angličtiny" },
              { icon: "📚", title: "Vybavená učebna pro výuku", desc: "Moderní zázemí pro efektivní lekce" },
              { icon: "🎯", title: "Příprava na různé zkoušky", desc: "FCE, IELTS a další jazykové zkoušky" }
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
