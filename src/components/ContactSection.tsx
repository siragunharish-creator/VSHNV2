import React, { useState } from 'react';
import { Phone, MessageCircle, MapPin, Mail, Clock, Send, CheckCircle2, AlertCircle, ArrowUpRight, Star } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { WhatsAppIcon } from './WhatsAppIcon.tsx';
import { getWhatsAppUrl, getCallUrl, getActiveContacts } from '../lib/contactUtils.ts';

interface ContactSectionProps {
  initialService?: string;
  initialPackage?: string;
  initialSqFt?: number;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  initialService = 'Complete residential construction',
  initialPackage = 'Deluxe',
  initialSqFt,
}) => {
  const { content, primaryContact, contacts, submitContactForm } = useContent();
  const { settings, services, packages } = content;
  const activeContacts = getActiveContacts(contacts);

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
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmissionStatus('error');
      setStatusMessage('Please enter your Name and Phone Number.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    // 1. Submit contact form to save enquiry
    const result = await submitContactForm({
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

    // 2. Format prefilled WhatsApp message
    const formattedSummary = `*VSHN BUILDERS CONSULTATION REQUEST*
• Name: ${formData.name.trim()}
• Phone: ${formData.phone.trim()}
• Location: ${formData.plotLocation.trim() || 'Chennai'}
• Package: ${formData.preferredPackage}
• Service: ${formData.serviceNeeded}
${formData.estimatedSqFt ? `• Area: ${formData.estimatedSqFt} sq.ft\n` : ''}${formData.message.trim() ? `• Notes: ${formData.message.trim()}\n` : ''}
Hello VSHN Builders, I have submitted my consultation form on your website. Please connect with me.`;

    // 3. Automatically copy to clipboard
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedSummary);
      }
    } catch (err) {
      console.warn('Clipboard write prevented:', err);
    }

    // 4. Automatically open WhatsApp prefilled in new tab targeting primary contact
    const targetPhone = primaryContact?.phoneNumber || settings.whatsapp || '7092507374';
    const waUrl = getWhatsAppUrl(targetPhone, formattedSummary);
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = waUrl;
    }

    if (result.success) {
      setSubmissionStatus('success');
      setStatusMessage('Enquiry saved! Your details were automatically copied and WhatsApp has opened.');
      setFormData({
        name: '',
        phone: '',
        email: '',
        plotLocation: '',
        serviceNeeded: 'Complete residential construction',
        preferredPackage: 'Deluxe',
        estimatedSqFt: '',
        message: '',
      });
    } else {
      setSubmissionStatus('success');
      setStatusMessage('Consultation details formatted & copied! WhatsApp opened with pre-filled message.');
    }
  };

  return (
    <section id="contact" className="py-20 bg-white dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Let's Build Your Dream Home
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Contact VSHN Builders
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Book a complimentary site inspection, request custom 2D/3D layouts, or discuss our construction packages in Chennai &amp; Tamil Nadu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Company Contact Information Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-stone-50 dark:bg-stone-950 p-6 sm:p-8 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Direct Contact &amp; Office Visit
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Connect directly with our civil engineering founders and support desk.
                </p>
              </div>

              {/* All Active Business Contact Numbers */}
              <div className="space-y-3.5">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Active Contact Lines
                </span>
                {activeContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      contact.isPrimary
                        ? 'bg-amber-500/5 border-amber-300 dark:border-amber-700/60 shadow-xs'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        {contact.label}
                        {contact.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Primary
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs sm:text-sm font-mono font-bold text-stone-800 dark:text-stone-200">
                        {contact.displayPhone}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {contact.isCallEnabled !== false && (
                          <a
                            href={getCallUrl(contact.phoneNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white shadow-xs transition-colors"
                            title={`Call ${contact.label}`}
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>Call</span>
                          </a>
                        )}

                        {contact.isWhatsAppEnabled !== false && (
                          <a
                            href={getWhatsAppUrl(
                              contact.phoneNumber,
                              'Hi VSHN Builders, I am interested in building my dream home. Please share the details.'
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                            title={`WhatsApp ${contact.label}`}
                          >
                            <WhatsAppIcon className="w-3 h-3 text-white" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-xs sm:text-sm pt-2 border-t border-stone-200 dark:border-stone-800">

                {/* Business Address & Metro */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">Office Location</span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {settings.address}
                    </p>
                    <a
                      href={settings.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline mt-1.5"
                    >
                      <span>Get Google Maps Directions</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">Working Hours</span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {settings.businessHours}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-3">
                  Official Social Channels
                </span>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={settings.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 transition-colors flex items-center gap-1"
                  >
                    <span>Instagram</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-500" />
                  </a>
                  <a
                    href={settings.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 transition-colors flex items-center gap-1"
                  >
                    <span>YouTube</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-500" />
                  </a>
                  <a
                    href={settings.socials.threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-300 transition-colors flex items-center gap-1"
                  >
                    <span>Threads</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Form Column */}
          <div className="lg:col-span-7 bg-stone-50 dark:bg-stone-950 p-6 sm:p-8 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif mb-1">
              Book a Free Construction Consultation
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
              Fill in your requirement below and we will connect with you within 2 business hours.
            </p>

            {submissionStatus === 'success' && (
              <div className="p-4 mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">{statusMessage}</div>
              </div>
            )}

            {submissionStatus === 'error' && (
              <div className="p-4 mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">{statusMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. S. Harish"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 98401 23456"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Plot Location */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Plot Location in Chennai / TN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plotLocation}
                    onChange={(e) => setFormData({ ...formData, plotLocation: e.target.value })}
                    placeholder="e.g. Tondiarpet / Anna Nagar / ECR"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Service */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Service Needed
                  </label>
                  <select
                    value={formData.serviceNeeded}
                    onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Package */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Preferred Package
                  </label>
                  <select
                    value={formData.preferredPackage}
                    onChange={(e) => setFormData({ ...formData, preferredPackage: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} (₹{pkg.ratePerSqFt}/sq.ft)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Area */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Approx. Sq. Ft.
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedSqFt}
                    onChange={(e) => setFormData({ ...formData, estimatedSqFt: e.target.value })}
                    placeholder="e.g. 1800"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Specific Requirements / Remarks
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Plot dimensions, number of floors, timeline, or questions..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span>Recording Enquiry...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Free Consultation Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
