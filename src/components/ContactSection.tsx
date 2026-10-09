import React, { useState } from 'react';
import { Phone, MessageCircle, MapPin, Mail, Clock, Send, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

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

    if (result.success) {
      setSubmissionStatus('success');
      setStatusMessage(result.message || 'Enquiry submitted successfully! Our senior civil engineer will call you shortly.');
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
      setSubmissionStatus('error');
      setStatusMessage(result.error || 'Failed to submit enquiry. Please call us directly at 70925 07374.');
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
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Direct Contact &amp; Office Visit
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">Phone Consultation</span>
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="text-stone-700 dark:text-stone-300 font-semibold hover:text-amber-600 transition-colors"
                    >
                      {settings.phone}
                    </a>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      Direct line with civil engineering founders
                    </span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">WhatsApp Desk</span>
                    <a
                      href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent(
                        'Hello VSHN Builders, I would like to know more about your services and construction packages.'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-700 dark:text-stone-300 font-semibold hover:text-emerald-600 transition-colors"
                    >
                      +91 {settings.whatsapp}
                    </a>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      Instant estimate sharing &amp; plan reviews
                    </span>
                  </div>
                </div>

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
