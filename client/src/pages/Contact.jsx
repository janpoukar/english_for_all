import { useState } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    courseType: "Individuální"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data:", formData);
    alert("Děkujeme za váš zájem! Brzy se vám ozveme.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "", courseType: "Individuální" });
  };

  return (
    <main className="w-full overflow-hidden">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
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
              <h2 className="text-4xl font-bold text-gray-800 mb-8">Nás můžete kontaktovat</h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="text-4xl">📍</div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">Adresa</h3>
                    <p className="text-gray-600">Nerudova 42, Praha 1</p>
                    <p className="text-gray-600">Bělska 8, Praha 2</p>
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
                    <p className="text-gray-600">info@englishtutor.cz</p>
                    <p className="text-gray-600">booking@englishtutor.cz</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 bg-blue-50 p-8 rounded-2xl border-l-4 border-blue-900 shadow-sm">
                <p className="text-gray-600">Nejrychlejší odpověď získáte prostřednictvím e-mailu nebo kontaktního formuláře níže.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-medium">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Odešlete nám zprávu</h3>

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
                      <option>Individuální výuka</option>
                      <option>Skupinový kurz</option>
                      <option>Online lekce</option>
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
                  className="w-full btn-primary font-bold py-4 text-lg"
                >
                  Odeslat zprávu
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