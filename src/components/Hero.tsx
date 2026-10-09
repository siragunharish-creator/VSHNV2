import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Clock, Compass, Sparkles } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface HeroProps {
  onOpenConsultationModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { settings } = content;
  const hero = settings.hero;

  return (
    <section id="home" className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background Architectural Photography */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.backgroundImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop'}
          alt="Premium Architecture in Chennai by VSHN Builders"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Subtle dual gradient scrim for high text contrast in both light and dark mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/75 to-stone-950/40 dark:from-stone-950/95 dark:via-stone-950/85 dark:to-stone-950/50" />
        <div className="absolute inset-0 bg-radial at-top-left from-transparent via-stone-950/40 to-stone-950/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="max-w-3xl">
          {/* Location & Tagline Kicker (Unboxed clean typography per anti-slop guidelines) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide uppercase text-amber-400 mb-4">
            <span>Chennai &amp; Tamil Nadu</span>
            <span aria-hidden="true" className="text-amber-500/60">·</span>
            <span>12 Years In Construction</span>
            <span aria-hidden="true" className="text-amber-500/60">·</span>
            <span>20+ Yrs Founders' Exp</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm font-serif">
            {hero.headline || 'Your Dream Home. Our Responsibility.'}
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed mb-8 max-w-2xl font-normal">
            {hero.subheading ||
              'From thoughtful planning and architectural design to complete home construction, VSHN Builders helps turn your vision into a home built with care, quality, and trust.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-12">
            <button
              onClick={onOpenConsultationModal}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <span>{hero.primaryCtaText || 'Get Free Consultation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={hero.secondaryCtaLink || '#projects'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur-md border border-white/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>{hero.secondaryCtaText || 'Explore Our Projects'}</span>
            </a>
          </div>

          {/* Key Assurance Bullet Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/15">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {settings.experienceYears} <span className="text-amber-400 text-lg">Yrs</span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">Active Construction</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {settings.completedProjectsCount}+
              </div>
              <p className="text-xs text-stone-300 mt-0.5">Completed Turnkey Homes</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ₹2,350
              </div>
              <p className="text-xs text-stone-300 mt-0.5">Starting Package / sq.ft</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                100%
              </div>
              <p className="text-xs text-stone-300 mt-0.5">On-Time Delivery Guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
