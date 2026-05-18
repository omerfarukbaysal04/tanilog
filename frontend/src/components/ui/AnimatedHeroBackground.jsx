/**
 * AnimatedHeroBackground — Landing page hero için floating SVG tıbbi ikonlar.
 * Kalp, nabız, DNA, hap, stetoskop, kalkan gibi SVG path'ler yavaşça yüzerek hareket eder.
 */
export default function AnimatedHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-teal-500/8 rounded-full animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-teal-400/5 rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Floating Medical Icons */}
      {/* Heart */}
      <svg
        className="absolute top-[12%] left-[8%] w-12 h-12 text-teal-500/15 animate-float"
        style={{ animationDuration: '7s', animationDelay: '0s' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* Pulse Line */}
      <svg
        className="absolute top-[20%] right-[12%] w-20 h-10 text-teal-400/12 animate-float-slow"
        style={{ animationDuration: '9s', animationDelay: '1s' }}
        viewBox="0 0 100 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="0,20 20,20 30,5 40,35 50,15 60,25 70,20 100,20" />
      </svg>

      {/* DNA Helix */}
      <svg
        className="absolute top-[55%] left-[5%] w-10 h-16 text-teal-500/10 animate-float-reverse"
        style={{ animationDuration: '8s', animationDelay: '2s' }}
        viewBox="0 0 24 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 2c0 8 16 8 16 16s-16 8-16 16" />
        <path d="M20 2c0 8-16 8-16 16s16 8 16 16" />
        <line x1="6" y1="10" x2="18" y2="10" opacity="0.5" />
        <line x1="6" y1="20" x2="18" y2="20" opacity="0.5" />
        <line x1="6" y1="30" x2="18" y2="30" opacity="0.5" />
      </svg>

      {/* Pill / Capsule */}
      <svg
        className="absolute bottom-[30%] right-[8%] w-10 h-10 text-teal-400/10 animate-float"
        style={{ animationDuration: '6s', animationDelay: '3s' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <rect x="3" y="10" width="18" height="8" rx="4" transform="rotate(-45 12 12)" opacity="0.6" />
        <rect x="12" y="10" width="9" height="8" rx="0" transform="rotate(-45 12 12)" opacity="0.3" />
      </svg>

      {/* Shield / Protection */}
      <svg
        className="absolute top-[35%] right-[25%] w-9 h-9 text-teal-500/8 animate-float-slow"
        style={{ animationDuration: '10s', animationDelay: '1.5s' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      </svg>

      {/* Stethoscope */}
      <svg
        className="absolute bottom-[20%] left-[15%] w-11 h-11 text-teal-400/10 animate-float"
        style={{ animationDuration: '8s', animationDelay: '0.5s' }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M4 12V6a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v6" />
        <path d="M4 12a4 4 0 0 0 8 0" />
        <line x1="8" y1="16" x2="8" y2="20" />
        <circle cx="8" cy="22" r="1" fill="currentColor" />
        <circle cx="18" cy="14" r="3" />
        <line x1="18" y1="11" x2="18" y2="8" />
      </svg>

      {/* Cross / Medical Plus */}
      <svg
        className="absolute top-[65%] right-[18%] w-8 h-8 text-teal-500/8 animate-float-reverse"
        style={{ animationDuration: '9s', animationDelay: '4s' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9 2h6v6h6v6h-6v6H9v-6H3V8h6V2z" opacity="0.6" />
      </svg>

      {/* Small circles decoration */}
      <div className="absolute top-[25%] left-[35%] w-2 h-2 bg-teal-400/20 rounded-full animate-float" style={{ animationDuration: '5s' }} />
      <div className="absolute top-[45%] right-[35%] w-1.5 h-1.5 bg-teal-500/15 rounded-full animate-float-slow" style={{ animationDuration: '7s', animationDelay: '2s' }} />
      <div className="absolute bottom-[35%] left-[40%] w-2.5 h-2.5 bg-teal-400/10 rounded-full animate-float-reverse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-[70%] left-[25%] w-1 h-1 bg-teal-300/20 rounded-full animate-float" style={{ animationDuration: '4s', animationDelay: '3s' }} />
      <div className="absolute top-[15%] right-[40%] w-1.5 h-1.5 bg-cyan-400/15 rounded-full animate-float-slow" style={{ animationDuration: '8s', animationDelay: '5s' }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,184,165,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,184,165,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
