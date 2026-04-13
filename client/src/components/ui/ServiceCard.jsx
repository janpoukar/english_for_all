export default function ServiceCard({ icon, imageSrc, imageAlt, title, description, features }) {
  return (
    <div className="group bg-white rounded-16 overflow-hidden shadow-medium hover:shadow-hard transition-all duration-500 hover:-translate-y-6 border border-gray-100 hover:border-blue-200 animate-fade-in-up relative">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-red-600 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
      
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          {imageSrc ? (
            <div className="w-20 h-20 md:w-24 md:h-24 p-2 bg-gradient-to-br from-blue-100 to-red-100 rounded-2xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:from-blue-200 group-hover:to-red-200 overflow-hidden flex items-center justify-center">
              <img src={imageSrc} alt={imageAlt || title} className="w-full h-full object-contain" loading="lazy" />
            </div>
          ) : (
            <div className="text-6xl p-4 bg-gradient-to-br from-blue-100 to-red-100 rounded-2xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:from-blue-200 group-hover:to-red-200">
              {icon}
            </div>
          )}
          <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-red-600 group-hover:bg-clip-text transition-all duration-300">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6 text-base leading-relaxed min-h-[3.5rem] group-hover:text-gray-700 transition-colors">
          {description}
        </p>
        
        {features && features.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-gray-100">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center text-gray-700 text-sm group/item hover:text-gray-900">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold mr-3 flex-shrink-0 group-hover/item:scale-125 group-hover/item:shadow-glow transition-all duration-300">
                  ✓
                </span>
                <span className="group-hover/item:text-gray-900 group-hover/item:font-medium transition-all duration-300">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
