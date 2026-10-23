import React, { useState, useEffect } from 'react';
import { Phone, ArrowUp, CheckCircle2, ChevronUp, X, MessageCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';
import { getWhatsAppUrl, getCallUrl, getActiveContacts } from '../lib/contactUtils.ts';

interface FloatingActionsProps {
  onOpenConsultationModal?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenConsultationModal }) => {
  const { primaryContact, contacts } = useContent();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isWhatsappClicked, setIsWhatsappClicked] = useState(false);
  const [isChooserOpen, setIsChooserOpen] = useState(false);

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

  const activeContacts = getActiveContacts(contacts);
  const targetWhatsappUrl = getWhatsAppUrl(
    primaryContact.phoneNumber,
    'Hi VSHN Builders, I am interested in building my dream home. Please share the details.'
  );
  const targetCallUrl = getCallUrl(primaryContact.phoneNumber);

  const handleWhatsappClick = () => {
    setIsWhatsappClicked(true);
    setTimeout(() => {
      setIsWhatsappClicked(false);
    }, 2500);
  };

  return (
    <>
      <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 select-none pointer-events-auto">
        {/* Scroll to Top Floating Button */}
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

        {/* Floating Call Button for Primary Contact */}
        <div className="flex items-center gap-1.5">
          <a
            href={targetCallUrl}
            aria-label={`Call VSHN Builders Primary Contact (${primaryContact.displayPhone})`}
            title={`Call Primary Contact: ${primaryContact.displayPhone}`}
            className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-stone-900/95 dark:bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-all border border-stone-700/80 group hover:shadow-2xl hover:-translate-y-0.5"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-bold tracking-wide">
              Call {primaryContact.displayPhone}
            </span>
          </a>

          {/* Quick Chooser Toggle (if multiple lines exist) */}
          {activeContacts.length > 1 && (
            <button
              type="button"
              onClick={() => setIsChooserOpen(!isChooserOpen)}
              className="p-3 sm:px-2.5 sm:py-3 rounded-full bg-stone-800/90 hover:bg-stone-700 text-amber-400 text-xs font-bold shadow-xl border border-stone-700 transition-all cursor-pointer"
              title="View all direct contact lines"
              aria-label="View all contact numbers"
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${isChooserOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Floating Get Free Consultation Button */}
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

        {/* Floating WhatsApp Button for Primary Contact with Authentic WhatsApp Logo */}
        <div className="relative">
          {/* Animated aura ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-75 pointer-events-none" />

          {/* Click popover notification */}
          {isWhatsappClicked && (
            <div className="absolute right-0 bottom-full mb-3 px-3 py-1.5 rounded-xl bg-stone-900 text-white shadow-2xl border border-emerald-500/50 flex items-center gap-2 whitespace-nowrap text-xs font-semibold animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Connecting to Primary WhatsApp ({primaryContact.displayPhone})...</span>
            </div>
          )}

          <a
            href={targetWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsappClick}
            aria-label={`Chat with VSHN Builders on WhatsApp (${primaryContact.displayPhone})`}
            title={`Chat with Primary Contact on WhatsApp: ${primaryContact.displayPhone}`}
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
              WhatsApp ({primaryContact.displayPhone})
            </span>
          </a>
        </div>
      </div>

      {/* Accessible Contact Chooser Sheet / Popover for Mobile & Desktop */}
      {isChooserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-8 sm:pb-24 p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsChooserOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h4 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
                  Connect with VSHN Builders
                </h4>
                <p className="text-[11px] text-stone-500">
                  Choose a direct line to call or chat on WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChooserOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                aria-label="Close contact selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {activeContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-xl border transition-all ${
                    contact.isPrimary
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/50'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      {contact.label}
                      {contact.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-stone-950 uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-mono font-semibold text-stone-600 dark:text-stone-400">
                      {contact.displayPhone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {contact.isCallEnabled && (
                      <a
                        href={getCallUrl(contact.phoneNumber)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-stone-900 dark:bg-stone-800 text-white text-xs font-semibold hover:bg-stone-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Call</span>
                      </a>
                    )}
                    {contact.isWhatsAppEnabled && (
                      <a
                        href={getWhatsAppUrl(contact.phoneNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
