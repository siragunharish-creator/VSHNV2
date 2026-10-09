import React from 'react';
import { Award, Users, HeartHandshake, Timer, CheckCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const BrandValuesSection: React.FC = () => {
  const { content } = useContent();
  const { settings } = content;

  const valueIcons: Record<string, React.ReactNode> = {
    V: <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    S: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    H: <HeartHandshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    N: <Timer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  };

  return (
    <section className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            The VSHN Promise &amp; Philosophy
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            What Our Name Stands For
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            Our company name represents our four unbreakable pillars of construction excellence in Chennai and Tamil Nadu.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {settings.brandValues.map((val) => (
            <div
              key={val.letter}
              className="relative p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 font-mono text-2xl font-black text-amber-600 dark:text-amber-400 border border-stone-200/60 dark:border-stone-700/60 group-hover:scale-105 transition-transform">
                  {val.letter}
                </span>
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                  {valueIcons[val.letter] || <CheckCircle className="w-5 h-5 text-amber-500" />}
                </div>
              </div>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">
                {val.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                {val.description}
              </p>
            </div>
          ))}
        </div>

        {/* Founders Experience Callout Box */}
        <div className="mt-12 p-6 sm:p-8 rounded-xl bg-stone-900 dark:bg-stone-950 text-white border border-stone-800 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                12 Years In Construction · Over 20 Years Founders' Experience
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                Built by Civil Engineers, Not Middlemen Contractors
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                When you construct with VSHN Builders, your home is engineered by seasoned structural professionals with over two decades of soil, foundation, concrete technology, and turnkey execution expertise across Chennai.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <a
                href="#calculator"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-colors text-center"
              >
                Calculate Construction Cost
              </a>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=VSHN+Builders,+AA+Garden,+42%2F60,+Ottravadai+St,+Press+Colony,+Tondiarpet,+Chennai,+Tamil+Nadu+600081"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 transition-colors text-center"
              >
                Visit Office in Tondiarpet
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
