import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ArrowUp, CheckCircle2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface FloatingActionsProps {
  onOpenConsultationModal?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { settings } = useContent().content;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isWhatsappClicked, setIsWhatsappClicked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroElement = document.getElementById('hero');
      const threshold = heroElement ? Math.max(heroElement.offsetHeight - 120, 300) : 400;
      setShowScrollTop(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prefilledWhatsappText = encodeURIComponent(
    'Hello VSHN Builders, I am interested in constructing a house in Chennai. I would like to know more about your services and construction packages.'
  );

  const handleWhatsappClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Show floating click animation
    setIsWhatsappClicked(true);
    setTimeout(() => {
      setIsWhatsappClicked(false);
    }, 2500);
  };

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 flex flex-col items-end gap-3 select-none">
      {/* Scroll to Top Floating Button (appears past hero section) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll back to top of page"
          title="Back to Top"
          className="group relative flex items-center justify-center p-3 rounded-full bg-stone-900/90 dark:bg-stone-800/95 text-amber-400 hover:text-white hover:bg-amber-500 dark:hover:bg-amber-400 dark:hover:text-stone-950 shadow-xl backdrop-blur-md transition-all duration-300 border border-stone-700/60 dark:border-stone-600/60 hover:-translate-y-1 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Scroll to top</span>
          {/* Tooltip on hover */}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-md bg-stone-900/90 dark:bg-stone-800 text-stone-100 text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
            Back to Top
          </span>
        </button>
      )}

      {/* Floating Call Button */}
      <a
        href={`tel:${settings.phone.replace(/\s+/g, '')}`}
        aria-label="Call VSHN Builders"
        className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-stone-900/95 dark:bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-all border border-stone-700/80 group hover:shadow-2xl hover:-translate-y-0.5"
      >
        <Phone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Call {settings.phone}
        </span>
      </a>

      {/* Floating Get Free Consultation Button (Right side, directly above WhatsApp) */}
      <button
        type="button"
        onClick={() => {
          if (onOpenConsultationModal) {
            onOpenConsultationModal();
          } else {
            window.open(
              'https://wa.me/917092507374?text=Hi%20VSHN%20BUILDERS%2C%20I%20would%20like%20to%20get%20a%20free%20consultation%20for%20my%20house%20construction%20project.%20Please%20contact%20me.',
              '_blank',
              'noopener,noreferrer'
            );
          }
        }}
        aria-label="Get Free Consultation from VSHN BUILDERS"
        title="Get Free Consultation"
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-[#0a192f] hover:bg-[#112240] text-white shadow-2xl border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 z-40 cursor-pointer"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
          <Phone className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs sm:text-xs font-extrabold tracking-wide text-white">
          Get Free Consultation
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
      </button>

      {/* Floating WhatsApp Button with Floating Pulse & Click Animation */}
      <div className="relative">
        {/* Animated aura ring (floating pulse effect) */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/35 animate-ping opacity-75 pointer-events-none" />

        {/* Click popover notification */}
        {isWhatsappClicked && (
          <div className="absolute right-0 bottom-full mb-3 px-3 py-1.5 rounded-xl bg-stone-900 text-white shadow-2xl border border-emerald-500/50 flex items-center gap-2 whitespace-nowrap text-xs font-semibold animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Connecting to WhatsApp...</span>
          </div>
        )}

        <a
          href={`https://wa.me/91${settings.whatsapp}?text=${prefilledWhatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsappClick}
          aria-label="Chat with VSHN Builders on WhatsApp"
          className={`relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-500 transition-all duration-300 ring-4 ring-emerald-500/30 group hover:scale-105 active:scale-95 ${
            isWhatsappClicked ? 'scale-110 ring-8 ring-emerald-400/50 bg-emerald-500' : ''
          }`}
        >
          <div className="relative">
            <MessageCircle
              className={`w-5 h-5 fill-white group-hover:rotate-12 transition-transform ${
                isWhatsappClicked ? 'animate-bounce' : ''
              }`}
            />
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
};
