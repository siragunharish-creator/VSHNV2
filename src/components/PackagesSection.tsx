import React, { useState } from 'react';
import { Check, Info, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface PackagesSectionProps {
  onOpenConsultationModal: (packageName?: string) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { packages, settings } = content;
  const [showComparisonTable, setShowComparisonTable] = useState<boolean>(false);

  // Common comparison categories
  const categoriesToCompare = [
    'Structure & Foundation',
    'Flooring & Tiling',
    'Kitchen',
    'Bathroom & Plumbing',
    'Doors & Windows',
    'Electrical',
    'Painting',
  ];

  return (
    <section id="packages" className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Transparent Turnkey Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Home Construction Packages
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Honest rates per square foot with certified building materials, certified brands, and zero hidden escalation surprises.
          </p>
        </div>

        {/* 3 Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
          {packages.map((pkg) => {
            const isDeluxe = pkg.name.toLowerCase().includes('deluxe') || pkg.isPopular;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all ${
                  isDeluxe
                    ? 'bg-stone-950 text-white dark:bg-stone-950 border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/10 -translate-y-1'
                    : 'bg-stone-50 dark:bg-stone-950/60 text-stone-900 dark:text-stone-100 border border-stone-200/90 dark:border-stone-800 shadow-sm'
                }`}
              >
                {/* Popular Pill / Badge */}
                {isDeluxe && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-black tracking-wide uppercase shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-bold font-serif">{pkg.name} Package</h3>
                      <p className={`text-xs mt-1 ${isDeluxe ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                        {pkg.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="my-6 pb-6 border-b border-stone-200/50 dark:border-stone-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold font-mono tracking-tight text-amber-500">
                        ₹{pkg.ratePerSqFt.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-xs font-medium ${isDeluxe ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}>
                        / sq. ft.
                      </span>
                    </div>
                    <p className={`text-xs mt-2 leading-relaxed ${isDeluxe ? 'text-stone-300' : 'text-stone-600 dark:text-stone-400'}`}>
                      {pkg.description}
                    </p>
                  </div>

                  {/* Highlights List */}
                  <div className="space-y-3 mb-8">
                    <span className={`text-xs uppercase font-bold tracking-wider ${isDeluxe ? 'text-amber-400' : 'text-stone-500 dark:text-stone-400'}`}>
                      Included Specifications:
                    </span>
                    <ul className="space-y-2.5 text-xs">
                      {pkg.includedHighlights.map((hl, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isDeluxe ? 'text-amber-400' : 'text-emerald-600'}`} />
                          <span className={isDeluxe ? 'text-stone-200' : 'text-stone-700 dark:text-stone-300'}>
                            {hl}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => onOpenConsultationModal(pkg.name)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-center transition-all ${
                      isDeluxe
                        ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md'
                        : 'bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white dark:hover:bg-stone-700'
                    }`}
                  >
                    Select {pkg.name} Package
                  </button>

                  <a
                    href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent(
                      `Hello VSHN Builders, I am interested in the ${pkg.name} Construction Package (₹${pkg.ratePerSqFt}/sq.ft). Please share detailed BOQ specifications.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-medium text-xs text-center border transition-all ${
                      isDeluxe
                        ? 'border-stone-700 hover:bg-stone-800/80 text-stone-200'
                        : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp Inquiry for {pkg.name}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Notice (Mandatory Requirement) */}
        <div className="p-4 sm:p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3 mb-8">
          <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-300 leading-relaxed">
            <span className="font-bold text-stone-900 dark:text-stone-100">Important Note on Pricing: </span>
            Final construction pricing depends on project specifications, soil depth requirements, architectural elevation complexity, municipal setback conditions, and individual brand customizations. We provide complete transparent itemized bills of quantities (BOQ) with zero hidden escalations.
          </div>
        </div>

        {/* Toggle Detailed Comparison Table Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowComparisonTable(!showComparisonTable)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>{showComparisonTable ? 'Hide Specification Comparison' : 'Compare Full Technical Specifications'}</span>
            <ArrowRight className={`w-4 h-4 transition-transform ${showComparisonTable ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Comparison Table */}
        {showComparisonTable && (
          <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 animate-in fade-in">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-700">
                  <th className="p-4 font-bold w-1/4">Specification Category</th>
                  {packages.map((pkg) => (
                    <th key={pkg.id} className="p-4 font-bold w-1/4">
                      {pkg.name} (₹{pkg.ratePerSqFt}/sq.ft)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {categoriesToCompare.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="p-4 font-semibold text-stone-900 dark:text-stone-100">{cat}</td>
                    {packages.map((pkg) => {
                      const spec = pkg.specifications.find((s) => s.category.toLowerCase().includes(cat.toLowerCase().slice(0, 5))) || pkg.specifications[idx];
                      return (
                        <td key={pkg.id} className="p-4 leading-relaxed">
                          {spec?.details || 'Standard certified brand grade'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
