export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Zásady ochrany osobních údajů</h1>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">1. Jaké údaje zpracováváme</h2>
          <p>
            Zpracováváme pouze údaje potřebné pro fungování služby: jméno, email, přihlášení,
            informace o lekcích a dobrovolně zaslané údaje ve formulářích.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">2. Proč údaje zpracováváme</h2>
          <p>
            Údaje používáme pro správu účtu, plánování lekcí, komunikaci se studenty a provoz webu.
            Newsletter zasíláme pouze po přihlášení.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">3. Jak dlouho údaje uchováváme</h2>
          <p>
            Údaje uchováváme po dobu trvání účtu nebo po dobu nezbytnou pro splnění právních povinností.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">4. Vaše práva</h2>
          <p>
            Máte právo na přístup, opravu, výmaz, omezení zpracování a námitku. Pro uplatnění práv nás
            kontaktujte na emailu uvedeném na stránce Kontakt.
          </p>
        </section>
      </div>
    </main>
  );
}
