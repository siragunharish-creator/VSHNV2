import React, { useState, useEffect } from 'react';
import { Phone, ArrowUp, CheckCircle2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';

interface FloatingActionsProps {
  onOpenConsultationModal?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { settings } = content;
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

  // Clean WhatsApp number to digits only (e.g. removes spaces, +, dashes)
  const cleanWhatsappDigits = (settings.whatsapp || '7092507374').replace(/\D/g, '').replace(/^91/, '');
  const targetWhatsappUrl = `https://wa.me/91${cleanWhatsappDigits}?text=${prefilledWhatsappText}`;

  const handleWhatsappClick = () => {
    setIsWhatsappClicked(true);
    setTimeout(() => {
      setIsWhatsappClicked(false);
    }, 2500);
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 select-none pointer-events-auto">
      {/* Scroll to Top Floating Button (appears past hero section) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll back to top of page"
          title="Back to Top"
          className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-900/90 dark:bg-stone-800/95 text-amber-400 hover:text-white hover:bg-amber-500 dark:hover:bg-amber-400 dark:hover:text-stone-950 shadow-xl backdrop-blur-md transition-all duration-300 border border-stone-700/60 dark:border-stone-600/60 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Scroll to top</span>
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
        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
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
            window.open(targetWhatsappUrl, '_blank', 'noopener,noreferrer');
          }
        }}
        aria-label="Get Free Consultation from VSHN BUILDERS"
        title="Get Free Consultation"
        className="group relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#0a192f] hover:bg-[#112240] text-white shadow-2xl border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 z-40 cursor-pointer"
      >
        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
          <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </span>
        <span className="text-[11px] sm:text-xs font-extrabold tracking-wide text-white">
          Get Free Consultation
        </span>
        <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
      </button>

      {/* Floating WhatsApp Button with Authentic WhatsApp Logo */}
      <div className="relative">
        {/* Animated aura ring (floating pulse effect) */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-75 pointer-events-none" />

        {/* Click popover notification */}
        {isWhatsappClicked && (
          <div className="absolute right-0 bottom-full mb-3 px-3 py-1.5 rounded-xl bg-stone-900 text-white shadow-2xl border border-emerald-500/50 flex items-center gap-2 whitespace-nowrap text-xs font-semibold animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Connecting to WhatsApp...</span>
          </div>
        )}

        <a
          href={targetWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsappClick}
          aria-label="Chat with VSHN Builders on WhatsApp"
          title="Chat with VSHN Builders on WhatsApp"
          className={`relative flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl transition-all duration-300 ring-4 ring-[#25D366]/30 group hover:scale-105 active:scale-95 cursor-pointer ${
            isWhatsappClicked ? 'scale-110 ring-8 ring-[#25D366]/60 bg-[#20ba59]' : ''
          }`}
        >
          <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
            <WhatsAppIcon
              className={`w-6 h-6 text-white group-hover:scale-110 transition-transform ${
                isWhatsappClicked ? 'animate-bounce' : ''
              }`}
            />
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide text-white">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
};
