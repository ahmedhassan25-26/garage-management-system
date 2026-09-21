const GarageHero = () => {
  return (
    <svg
      className="garage-hero"
      viewBox="0 0 520 420"
      width="100%"
      height="auto"
      role="img"
      aria-label="Modern auto workshop illustration showcasing a vehicle on a service lift with tools"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#172033" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-car" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7ecf3" />
          <stop offset="100%" stopColor="#c7d0dd" />
        </linearGradient>
      </defs>

      <ellipse cx="260" cy="330" rx="170" ry="18" fill="#0b1020" opacity="0.35" />

      {/* Workshop bay floor grid */}
      <g stroke="#2b3a5e" strokeWidth="1" opacity="0.4">
        <line x1="70" y1="250" x2="70" y2="330" />
        <line x1="130" y1="250" x2="130" y2="330" />
        <line x1="190" y1="250" x2="190" y2="330" />
        <line x1="250" y1="250" x2="250" y2="330" />
        <line x1="310" y1="250" x2="310" y2="330" />
        <line x1="370" y1="250" x2="370" y2="330" />
        <line x1="430" y1="250" x2="430" y2="330" />
      </g>

      <rect x="0" y="0" width="520" height="420" fill="url(#hero-glow)" rx="24" />

      {/* Service lift columns */}
      <rect x="150" y="150" width="14" height="180" rx="7" fill="#2b3a5e" />
      <rect x="356" y="150" width="14" height="180" rx="7" fill="#2b3a5e" />

      {/* Lift arms */}
      <rect x="150" y="176" width="70" height="10" rx="5" fill="#3b6b9e" />
      <rect x="300" y="176" width="70" height="10" rx="5" fill="#3b6b9e" />

      {/* Car body */}
      <path
        d="M150 190
           L172 170 Q182 158 200 158 L286 158
           Q300 158 306 168 L330 190 Z"
        fill="#1d2636"
      />
      <path
        d="M150 190 L370 190
           L350 212 Q340 220 322 220 L198 220
           Q180 220 170 212 Z"
        fill="url(#hero-car)"
        stroke="#1d2636"
        strokeWidth="2"
      />

      {/* Windshield */}
      <path
        d="M178 190 L186 176 Q188 172 193 172 L236 172 L236 190 Z"
        fill="#bfe0ff"
        opacity="0.55"
      />

      {/* Rear window */}
      <path
        d="M298 190 L290 174 Q288 172 284 172 L266 172 L266 190 Z"
        fill="#bfe0ff"
        opacity="0.45"
      />

      {/* Wheels */}
      <circle cx="205" cy="222" r="20" fill="#111827" />
      <circle cx="205" cy="222" r="9" fill="#52648a" />
      <circle cx="318" cy="222" r="20" fill="#111827" />
      <circle cx="318" cy="222" r="9" fill="#52648a" />

      {/* Headlight / taillight */}
      <rect x="364" y="196" width="9" height="12" rx="3" fill="#fbbf24" opacity="0.9" />

      {/* Lifted signal glow above lift */}
      <path d="M190 140 q30 -22 62 0" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Scanning dot */}
      <circle cx="214" cy="138" r="4" fill="#38bdf8">
        <animate attributeName="cx" values="214;268;214" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Wrench (tool rack) */}
      <g transform="translate(404 120)">
        <rect x="0" y="0" width="7" height="7" rx="1.5" fill="#38bdf8" />
        <rect x="0" y="12" width="7" height="7" rx="1.5" fill="#fbbf24" />
        <path
          d="M30 4 a7 7 0 0 1 12 0 l4 -4 l4 4 l-4 4 a7 7 0 0 1 -12 0 z"
          fill="#cbd5e1"
        />
      </g>

      {/* Gauge cluster */}
      <g transform="translate(52 132)">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#3b6b9e" strokeWidth="2" opacity="0.7" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 4" opacity="0.8" />
        <path d="M20 20 L27 13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
};

export default GarageHero;