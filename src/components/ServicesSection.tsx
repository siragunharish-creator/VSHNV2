import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { Service } from '../shared/types.ts';

interface ServicesSectionProps {
  onOpenConsultationModal: (serviceName?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { services, settings } = content;
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section id="services" className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Comprehensive Building Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Our Architectural &amp; Construction Services
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            From initial 2D blueprints and 3D elevations to turnkey foundation-to-finish home building across Chennai and Tamil Nadu.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col bg-stone-50 dark:bg-stone-950/60 rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 shadow-xs hover:shadow-md transition-all group"
            >
              {/* Cover Image */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-stone-200 dark:bg-stone-800">
                <img
                  src={service.coverImage}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {service.startingPrice && (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-stone-900/85 backdrop-blur-xs text-[11px] font-bold text-amber-400">
                    {service.startingPrice}
                  </div>
                )}
              </div>

              {/* Service Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                    {service.shortDescription}
                  </p>

                  {/* Bullet Benefits */}
                  <ul className="space-y-1.5 mb-6 text-xs text-stone-700 dark:text-stone-300">
                    {service.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenConsultationModal(service.title)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-xs"
                  >
                    <span>Enquire</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setSelectedService(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden mb-6 -mx-2 sm:-mx-4 mt-2">
              <img
                src={selectedService.coverImage}
                alt={selectedService.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                    {selectedService.title}
                  </h3>
                  {selectedService.startingPrice && (
                    <span className="text-xs font-semibold text-amber-400">
                      Pricing: {selectedService.startingPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                  Service Overview
                </h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selectedService.fullDescription}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                  Key Advantages
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedService.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedService.deliverables && selectedService.deliverables.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                    Deliverables
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedService.deliverables.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const title = selectedService.title;
                    setSelectedService(null);
                    onOpenConsultationModal(title);
                  }}
                  className="flex-1 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm text-center shadow-md transition-colors"
                >
                  Book Consultation For This Service
                </button>
                <a
                  href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent(
                    `Hello VSHN Builders, I am interested in your service: ${selectedService.title}. Please provide details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center transition-colors"
                >
                  WhatsApp Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
