import React from 'react';

interface VshnLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  logoUrl?: string;
}

export const VshnLogo: React.FC<VshnLogoProps> = ({
  className = '',
  showTagline = false,
  size = 'md',
  variant = 'full',
  logoUrl,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const sizeClasses = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  }[size];

  // If a custom uploaded logo URL is provided (and not the default svg path) and hasn't errored
  const hasCustomLogo = logoUrl && logoUrl !== '/vshn-logo.svg' && !imageError;

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {hasCustomLogo ? (
          <img
            src={logoUrl}
            alt="VSHN Builders"
            onError={() => setImageError(true)}
            className={`${sizeClasses} aspect-square object-contain drop-shadow-sm`}
          />
        ) : (
          <svg viewBox="0 0 100 100" className={`${sizeClasses} aspect-square drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="iconRoofGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="iconKeyGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <path d="M 20 50 L 50 18 L 80 50 Z" stroke="url(#iconRoofGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="42" y="34" width="7" height="7" fill="#EA580C" rx="1" />
            <rect x="53" y="34" width="7" height="7" fill="#EA580C" rx="1" />
            {/* Key bow and shaft */}
            <circle cx="28" cy="62" r="10" stroke="url(#iconKeyGrad)" strokeWidth="5" fill="none" />
            <rect x="36" y="59.5" width="46" height="5" fill="url(#iconKeyGrad)" rx="2" />
            <rect x="74" y="64" width="4" height="6" fill="url(#iconKeyGrad)" />
            <rect x="80" y="64" width="4" height="8" fill="url(#iconKeyGrad)" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Mark Graphic */}
      <div className="relative shrink-0 flex items-center justify-center">
        {hasCustomLogo ? (
          <img
            src={logoUrl}
            alt="VSHN BUILDERS"
            onError={() => setImageError(true)}
            className={`${sizeClasses} w-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]`}
          />
        ) : (
          <svg
            viewBox="0 0 500 240"
            className={`${sizeClasses} w-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
          <defs>
            <linearGradient id="vshnRoofGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E63920" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <linearGradient id="vshnRoofGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D94600" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
            <linearGradient id="vshnKeyGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="30%" stopColor="#F97316" />
              <stop offset="60%" stopColor="#FBBF24" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>

          {/* Roof 1 (Left) */}
          <path d="M 70 85 L 140 25 L 210 85 Z" fill="none" stroke="url(#vshnRoofGrad1)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="105" y="55" width="11" height="11" fill="#EA580C" rx="1.5" />
          <rect x="123" y="55" width="11" height="11" fill="#EA580C" rx="1.5" />
          <rect x="105" y="71" width="11" height="11" fill="#DC2626" rx="1.5" />
          <rect x="123" y="71" width="11" height="11" fill="#DC2626" rx="1.5" />

          {/* Roof 2 (Right) */}
          <path d="M 155 85 L 255 12 L 400 85 Z" fill="none" stroke="url(#vshnRoofGrad2)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="210" y="50" width="13" height="13" fill="#F97316" rx="2" />
          <rect x="231" y="50" width="13" height="13" fill="#F97316" rx="2" />
          <rect x="210" y="68" width="13" height="13" fill="#EF4444" rx="2" />
          <rect x="231" y="68" width="13" height="13" fill="#EF4444" rx="2" />

          {/* VSHN Bold Typography (Adapts cleanly to dark/light) */}
          <g className="fill-blue-900 dark:fill-blue-400">
            {/* V */}
            <path d="M 115 95 L 138 95 L 155 150 L 172 95 L 195 95 L 167 165 L 143 165 Z" />
            {/* S */}
            <path d="M 235 110 C 235 98 225 93 210 93 C 195 93 186 100 186 112 C 186 128 235 120 235 145 C 235 160 220 166 205 166 C 188 166 178 158 178 145 L 198 145 C 198 153 204 156 208 156 C 215 156 220 152 220 146 C 220 132 171 138 171 113 C 171 99 184 85 210 85 C 232 85 248 95 248 110 Z" />
            {/* H */}
            <path d="M 252 95 L 268 95 L 268 120 L 298 120 L 298 95 L 314 95 L 314 165 L 298 165 L 298 135 L 268 135 L 268 165 L 252 165 Z" />
            {/* N */}
            <path d="M 324 95 L 340 95 L 368 138 L 368 95 L 384 95 L 384 165 L 368 165 L 340 122 L 340 165 L 324 165 Z" />
          </g>

          {/* Golden Key cutting across */}
          <g>
            <path d="M 68 132 C 68 116 48 104 34 118 C 22 130 22 144 34 156 C 48 170 68 158 68 142 Z" fill="none" stroke="url(#vshnKeyGrad)" strokeWidth="8" strokeLinecap="round" />
            <circle cx="48" cy="136" r="6" fill="#FFF" className="dark:fill-stone-900" />
            <rect x="65" y="132" width="310" height="9" fill="url(#vshnKeyGrad)" rx="3" />
            <rect x="345" y="141" width="10" height="15" fill="url(#vshnKeyGrad)" rx="1.5" />
            <rect x="365" y="141" width="10" height="12" fill="url(#vshnKeyGrad)" rx="1.5" />
            <rect x="385" y="141" width="9" height="17" fill="url(#vshnKeyGrad)" rx="1.5" />
          </g>

          {/* BUILDERS Text */}
          <text
            x="250"
            y="205"
            textAnchor="middle"
            fontFamily="'Cinzel', 'Plus Jakarta Sans', serif, sans-serif"
            fontWeight="800"
            fontSize="34"
            letterSpacing="7"
            className="fill-blue-950 dark:fill-stone-100"
          >
            BUILDERS
          </text>
          <line x1="85" y1="216" x2="415" y2="216" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
        )}
      </div>

      {showTagline && (
        <div className="hidden sm:flex flex-col border-l border-stone-200 dark:border-stone-800 pl-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Chennai, Tamil Nadu
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            Building Dreams. Creating Trust.
          </span>
        </div>
      )}
    </div>
  );
};
