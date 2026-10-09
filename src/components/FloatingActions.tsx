import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const FloatingActions: React.FC = () => {
  const { content } = useContent();
  const { settings } = content;
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prefilledWhatsappText = encodeURIComponent(
    'Hello VSHN Builders, I am interested in constructing a house in Chennai. I would like to know more about your services and construction packages.'
  );

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="p-2.5 rounded-full bg-stone-900/80 dark:bg-stone-800/90 text-white shadow-lg backdrop-blur-xs hover:bg-stone-950 transition-all border border-stone-700/50"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Floating Call Button */}
      <a
        href={`tel:${settings.phone.replace(/\s+/g, '')}`}
        aria-label="Call VSHN Builders"
        className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-stone-900 dark:bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-all border border-stone-700/80 group"
      >
        <Phone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Call 70925 07374
        </span>
      </a>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/91${settings.whatsapp}?text=${prefilledWhatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with VSHN Builders on WhatsApp"
        className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-emerald-600 text-white shadow-2xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all ring-4 ring-emerald-500/20 group"
      >
        <MessageCircle className="w-5 h-5 fill-white group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Chat on WhatsApp
        </span>
      </a>
    </div>
  );
};
