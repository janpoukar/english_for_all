export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-16 shadow-medium border border-gray-100 p-6 hover:shadow-hard hover:-translate-y-2 transition-all duration-300 group ${className}`}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-t-16"></div>
      {children}
    </div>
  );
}