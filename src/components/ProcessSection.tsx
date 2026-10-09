import React from 'react';
import { Compass, PencilRuler, FileText, Hammer, KeyRound } from 'lucide-react';

export const ProcessSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Site Visit & Evaluation',
      desc: 'Our senior engineer visits your plot in Chennai/TN for soil condition assessment, road width check, orientation, and Vaastu alignments.',
      icon: <Compass className="w-5 h-5 text-amber-500" />,
    },
    {
      num: '02',
      title: '2D Planning & 3D Design',
      desc: 'Our architects develop functional 2D floor plans customized to your plot dimensions and realistic 3D exterior elevations before bricklaying.',
      icon: <PencilRuler className="w-5 h-5 text-blue-500" />,
    },
    {
      num: '03',
      title: 'Transparent Contract & BOQ',
      desc: 'We prepare an itemized Bill of Quantities with zero hidden clauses. Clear payment schedule tied strictly to physical construction milestones.',
      icon: <FileText className="w-5 h-5 text-emerald-500" />,
    },
    {
      num: '04',
      title: 'Precision Construction',
      desc: 'Daily site supervision with Tata Tiscon steel and Ultratech cement. You receive daily evening photo/video progress updates on WhatsApp.',
      icon: <Hammer className="w-5 h-5 text-rose-500" />,
    },
    {
      num: '05',
      title: 'On-Time Key Handover',
      desc: '100% on-time delivery with final deep cleaning, deep plumbing pressure testing, electrical sign-off, and structural guarantee certificate.',
      icon: <KeyRound className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <section className="py-20 bg-stone-50 dark:bg-stone-950 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Hassle-Free Construction Journey
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Our 5-Step Turnkey Process
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            How we take complete responsibility for your dream home from bare ground to keys in your hand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="bg-white dark:bg-stone-900 rounded-xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
                    {step.num}
                  </span>
                  <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                    {step.icon}
                  </div>
                </div>

                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-0.5 bg-stone-300 dark:bg-stone-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
