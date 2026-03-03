export default function Button({ children, onClick, type="button", className="", variant="primary", size="md" }) {
  const baseStyles = "font-semibold rounded-lg transition-all duration-300 cursor-pointer border-none relative overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-700 to-red-600 text-white hover:shadow-glow hover:shadow-lg shadow-md hover:-translate-y-1 active:translate-y-0",
    secondary: "border-2 border-blue-700 text-blue-700 hover:bg-blue-50 hover:shadow-md hover:-translate-y-1 active:translate-y-0",
    dark: "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:-translate-y-1 active:translate-y-0",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-500"></span>
    </button>
  );
}