import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  initialPackage?: string;
  initialSqFt?: number;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  initialService = 'Complete residential construction',
  initialPackage = 'Deluxe',
  initialSqFt,
}) => {
  const { content, submitContactForm } = useContent();
  const { settings, services, packages } = content;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    plotLocation: '',
    serviceNeeded: initialService,
    preferredPackage: initialPackage,
    estimatedSqFt: initialSqFt ? String(initialSqFt) : '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setStatus('error');
      setStatusMsg('Please provide your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    const res = await submitContactForm({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      plotLocation: formData.plotLocation.trim() || 'Chennai',
      serviceNeeded: formData.serviceNeeded,
      preferredPackage: formData.preferredPackage,
      estimatedSqFt: formData.estimatedSqFt ? Number(formData.estimatedSqFt) : undefined,
      message: formData.message.trim() || 'Requesting free site consultation',
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatus('success');
      setStatusMsg(res.message || 'Thank you! We will call you within 2 business hours.');
    } else {
      setStatus('error');
      setStatusMsg(res.error || 'Failed to submit. Please call us directly at 70925 07374.');
    }
  };

  const whatsappText = encodeURIComponent(
    `Hello VSHN Builders, I am requesting a consultation for a home in Chennai (${formData.plotLocation || 'Chennai'}). Package: ${formData.preferredPackage}. Please connect with me.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
            Complimentary Consultation
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif mt-1">
            Book Site Visit &amp; Estimation
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Direct advice from 20+ years experienced civil engineering founders.
          </p>
        </div>

        {status === 'success' ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Request Received!
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
              {statusMsg}
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <a
                href={`https://wa.me/91${settings.whatsapp}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. S. Harish"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="98401 23456"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Plot Area (sq.ft)
                </label>
                <input
                  type="number"
                  value={formData.estimatedSqFt}
                  onChange={(e) => setFormData({ ...formData, estimatedSqFt: e.target.value })}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                Plot Location in Chennai / TN *
              </label>
              <input
                type="text"
                required
                value={formData.plotLocation}
                onChange={(e) => setFormData({ ...formData, plotLocation: e.target.value })}
                placeholder="e.g. Tondiarpet, Kolathur, Anna Nagar"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Package
                </label>
                <select
                  value={formData.preferredPackage}
                  onChange={(e) => setFormData({ ...formData, preferredPackage: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name} (₹{pkg.ratePerSqFt}/sq.ft)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Service
                </label>
                <select
                  value={formData.serviceNeeded}
                  onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                Notes / Specific Preferences
              </label>
              <textarea
                rows={2}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Mention number of floors, budget, or preferred construction start month..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? <span>Submitting...</span> : <><Send className="w-4 h-4" /><span>Confirm Free Consultation</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
