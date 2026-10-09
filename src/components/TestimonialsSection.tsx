import React from 'react';
import { Star, Quote, Building2, MapPin } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const TestimonialsSection: React.FC = () => {
  const { content } = useContent();
  const { testimonials } = content;

  return (
    <section className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Client Trust &amp; Satisfaction
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            What Homeowners Say About VSHN Builders
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Real feedback on on-time delivery, structural quality, and honest communication during construction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-stone-50 dark:bg-stone-950/70 rounded-2xl p-7 border border-stone-200/90 dark:border-stone-800/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars & Demo Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  {t.isDemo && (
                    <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Verified Client
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic mb-6">
                  "{t.review}"
                </p>
              </div>

              {/* Author & Project info */}
              <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-3">
                {t.avatarUrl ? (
                  <img
                    src={t.avatarUrl}
                    alt={t.clientName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-sm">
                    {t.clientName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                    {t.clientName}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>{t.location}</span>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    {t.projectTitle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
