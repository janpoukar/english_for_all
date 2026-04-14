import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    courseType: "Individuální lekce"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("✅ " + (result.message || "Zpráva byla úspěšně odeslána!"));
        setFormData({ name: "", email: "", phone: "", subject: "", message: "", courseType: "Individuální lekce" });
      } else {
        setMessage("❌ " + (result.error || "Nepodařilo se odeslat zprávu. Zkuste to prosím později."));
      }
    } catch (err) {
      console.error("Contact form error:", err);
      setMessage("❌ Chyba při odesílání. Zkuste to prosím později.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full overflow-hidden">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ pointerEvents: 'none' }}>
          <div className="absolute top-10 -left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Kontaktujte Nás</h1>
          <p className="text-xl text-gray-100">Máme otázky? Jsme tu pro vás!</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="animate-slide-in-left">
              <h2 className="text-4xl font-bold text-gray-800 mb-8">Zde nás můžete kontaktovat</h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="text-4xl">📍</div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">Adresa</h3>
                    <p className="text-gray-600">Křížová, Jihlava</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-4xl">📞</div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">Telefon</h3>
                    <p className="text-gray-600">+420 777 123 456</p>
                    <p className="text-gray-600">Po-Pá: 9:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-4xl">📧</div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">E-mail</h3>
                    <p className="text-gray-600">efa.anglictina@gmail.com</p>
                    <p className="text-gray-600">booking@englishtutor.cz</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 bg-blue-50 p-8 rounded-2xl border-l-4 border-blue-900 shadow-sm">
                <p className="text-gray-600">Nejrychlejší odpověď získáte prostřednictvím e-mailu nebo kontaktního formuláře.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-medium">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Odešlete nám zprávu</h3>

                {message && (
                  <div className={`rounded-lg p-3 mb-6 ${message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message}
                  </div>
                )}

                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Jméno *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Vaše jméno"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">E-mail *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="vase@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Telefon</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+420 777 123 456"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Typ kurzu</label>
                    <select 
                      name="courseType" 
                      value={formData.courseType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option>Individuální lekce</option>
                      <option>Skupinový kurz</option>
                      <option>Doučování ve firmách</option>
                      <option>Business angličtina</option>
                      <option>Příprava testů</option>
                      <option>Nevím, pomoc!</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Předmět *</label>
                    <input 
                      type="text" 
                      name="subject" 
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Předmět zprávy"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Zpráva *</label>
                    <textarea 
                      name="message" 
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="form-textarea"
                      placeholder="Vaše zpráva..."
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary font-bold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Odesílám..." : "Odeslat zprávu"}
                </button>

                <p className="text-sm text-gray-600 text-center mt-4 font-medium">Odpovídáme do 24 hodin, obvykle dříve!</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}