export default function WavingFlag() {
  return (
    <div className="flex items-start gap-4">
      {/* Tyč */}
      <div className="w-1.5 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-500 rounded-t" style={{ height: '240px' }} />
      
      {/* SVG Vlajka s CSS animací */}
      <svg
        width="400"
        height="240"
        viewBox="0 0 400 240"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
          marginTop: '12px'
        }}
      >
        <defs>
          <style>{`
            @keyframes wave {
              0%, 100% { transform: scaleY(1); }
              25% { transform: scaleY(0.98) skewY(-0.5deg); }
              50% { transform: scaleY(0.95) skewY(-1deg); }
              75% { transform: scaleY(0.98) skewY(-0.5deg); }
            }
            
            .flag-wave {
              animation: wave 3s ease-in-out infinite;
              transform-origin: left center;
            }
          `}</style>
        </defs>

        {/* Hlavní vlajka */}
        <g className="flag-wave">
          {/* Pozadí (modrá) */}
          <rect width="400" height="240" fill="#012169" />

          {/* Bílý diagonální kříž */}
          <line x1="0" y1="0" x2="400" y2="240" stroke="#FFFFFF" strokeWidth="40" />
          <line x1="400" y1="0" x2="0" y2="240" stroke="#FFFFFF" strokeWidth="40" />

          {/* Červený diagonální kříž */}
          <line x1="0" y1="0" x2="400" y2="240" stroke="#C8102E" strokeWidth="24" />
          <line x1="400" y1="0" x2="0" y2="240" stroke="#C8102E" strokeWidth="24" />

          {/* Bílý kříž */}
          <line x1="200" y1="0" x2="200" y2="240" stroke="#FFFFFF" strokeWidth="60" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="#FFFFFF" strokeWidth="60" />

          {/* Červený kříž */}
          <line x1="200" y1="0" x2="200" y2="240" stroke="#C8102E" strokeWidth="36" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="#C8102E" strokeWidth="36" />
        </g>
      </svg>
    </div>
  );
}
