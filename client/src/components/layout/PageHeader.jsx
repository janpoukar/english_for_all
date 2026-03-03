export default function PageHeader({ title, subtitle }) {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 text-white py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{title}</h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-medium">{subtitle}</p>
      </div>
    </section>
  );
}
