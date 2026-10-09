import React from 'react';
import { ShieldCheck, Award, MapPin, CheckCircle2, Building, Clock, FileCheck2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const AboutSection: React.FC = () => {
  const { content } = useContent();
  const { settings } = content;
  const { aboutSection } = settings;

  return (
    <section id="about" className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Column with Architectural Image & Stats Overlay */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-800">
              <img
                src={aboutSection.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop'}
                alt="VSHN Builders Chennai Construction"
                className="w-full h-[450px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/80 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {settings.experienceYears} Years Building Construction
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      20+ Years Combined Founders' Civil Engineering Experience
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metro Landmark Tag */}
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Headquartered Near New Washermenpet Metro, Tondiarpet Depot, Chennai</span>
            </div>
          </div>

          {/* Story & Philosophy Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400">
                About VSHN Builders
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif mt-2">
                {aboutSection.introHeading}
              </h2>
            </div>

            <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
              {aboutSection.introParagraph}
            </p>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {aboutSection.story}
            </p>

            {/* Founder Quote Card */}
            <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border-l-4 border-amber-500 border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
              <p className="text-xs sm:text-sm italic text-stone-800 dark:text-stone-200">
                "{aboutSection.founderMessage}"
              </p>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                — {aboutSection.founderName}{' '}
                <span className="text-stone-500 dark:text-stone-400 font-normal">
                  ({aboutSection.founderTitle})
                </span>
              </div>
            </div>

            {/* Mission & Vision Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4" /> Our Mission
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {aboutSection.mission}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <Building className="w-4 h-4" /> Our Vision
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {aboutSection.vision}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
