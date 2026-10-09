import React, { useState, useMemo } from 'react';
import { Calculator, MessageCircle, ArrowRight, CheckCircle2, Info, Building2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface CostCalculatorProps {
  onOpenConsultationModal: (initialData?: { sqFt: number; package: string; floors: string }) => void;
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({ onOpenConsultationModal }) => {
  const { content } = useContent();
  const { packages, settings } = content;

  // Selected package (default to Deluxe)
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages.find((p) => p.isPopular)?.id || packages[0]?.id || 'pkg-deluxe'
  );
  const [sqFt, setSqFt] = useState<number>(1800);
  const [floors, setFloors] = useState<string>('G+1');

  const currentPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId) || packages[0];
  }, [packages, selectedPackageId]);

  const rate = currentPackage ? currentPackage.ratePerSqFt : 2450;
  const totalCost = sqFt * rate;

  // Indian Rupee currency format helper
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const toLakhs = (val: number) => {
    const lakhs = val / 100000;
    return `${lakhs.toFixed(2)} Lakhs`;
  };

  // Cost breakdown estimations
  const breakdown = useMemo(() => {
    return [
      { label: 'Structural RCC Frame & Brick Masonry', pct: 52, cost: Math.round(totalCost * 0.52) },
      { label: 'Flooring, Tiling & Kitchen Granite', pct: 14, cost: Math.round(totalCost * 0.14) },
      { label: 'Electrical Wiring & Plumbing Conduits', pct: 12, cost: Math.round(totalCost * 0.12) },
      { label: 'Doors, Teak Frames & UPVC Windows', pct: 10, cost: Math.round(totalCost * 0.1) },
      { label: 'Putty, Primer & Exterior/Interior Paint', pct: 8, cost: Math.round(totalCost * 0.08) },
      { label: 'Site Supervision & Project Management', pct: 4, cost: Math.round(totalCost * 0.04) },
    ];
  }, [totalCost]);

  // WhatsApp prefilled link with this exact estimation
  const whatsappEstimateText = encodeURIComponent(
    `Hello VSHN Builders, I used your online Cost Calculator for a project in Chennai/TN:\n\n` +
      `• Built-up Area: ${sqFt} sq.ft\n` +
      `• Floor Configuration: ${floors}\n` +
      `• Selected Package: ${currentPackage?.name} (@ ₹${rate}/sq.ft)\n` +
      `• Estimated Total: ${formatINR(totalCost)} (approx. ${toLakhs(totalCost)})\n\n` +
      `I would like to schedule a site evaluation and discuss architectural drawings.`
  );
  const whatsappUrl = `https://wa.me/91${settings.whatsapp}?text=${whatsappEstimateText}`;

  return (
    <section id="calculator" className="py-20 bg-stone-50 dark:bg-stone-950 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Instant Construction Estimator
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Calculate Your Dream Home Construction Cost
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Select your built-up area and construction package to get an instant transparent estimate based on our current Chennai rates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-8">
            {/* 1. Built-up Area Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="area-range" className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Total Built-up Area (Sq. Ft.)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="area-number"
                    type="number"
                    min="500"
                    max="15000"
                    step="50"
                    value={sqFt}
                    onChange={(e) => setSqFt(Math.max(300, Number(e.target.value) || 0))}
                    className="w-28 text-right font-mono font-bold text-base px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs text-stone-500 font-medium">sq.ft</span>
                </div>
              </div>

              <input
                id="area-range"
                type="range"
                min="600"
                max="6000"
                step="50"
                value={sqFt}
                onChange={(e) => setSqFt(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              {/* Quick Area Presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[1000, 1500, 1800, 2400, 3000, 4000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSqFt(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      sqFt === preset
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    {preset} sq.ft
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Package Selector */}
            <div>
              <label className="block text-sm font-bold text-stone-900 dark:text-stone-100 mb-3">
                Choose Construction Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3.5 rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{pkg.name}</span>
                        {pkg.isPopular && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Popular</span>
                        )}
                      </div>
                      <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        ₹{pkg.ratePerSqFt.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-normal text-stone-500 dark:text-stone-400">/sq.ft</span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                        {pkg.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Floors Configuration */}
            <div>
              <label className="block text-sm font-bold text-stone-900 dark:text-stone-100 mb-2">
                Floor Configuration
              </label>
              <div className="flex flex-wrap gap-2">
                {['Ground Only', 'G+1 (2 Floors)', 'G+2 (3 Floors)', 'G+3 (4 Floors)'].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setFloors(fl)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium border transition-colors ${
                      floors === fl
                        ? 'border-stone-900 dark:border-white bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    {fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Inclusions for current package */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 block">
                Top Inclusions in {currentPackage?.name} Package:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 dark:text-stone-300">
                {currentPackage?.includedHighlights.slice(0, 6).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-5 bg-stone-900 dark:bg-stone-900/90 text-white rounded-xl p-6 sm:p-8 border border-stone-800 shadow-lg">
            <div className="text-xs uppercase font-semibold text-amber-400 tracking-wider mb-1">
              Estimated Investment
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono mb-1">
              {formatINR(totalCost)}
            </div>
            <div className="text-xs text-stone-300 font-medium mb-6">
              Approx. <span className="font-bold text-amber-400">{toLakhs(totalCost)}</span> for {sqFt} sq.ft {floors} with {currentPackage?.name} specifications.
            </div>

            {/* Itemized Cost Breakdown Bar */}
            <div className="space-y-3 mb-8">
              <span className="text-xs font-semibold text-stone-400 block">
                Estimated Work Breakdown:
              </span>
              {breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-300">
                    <span className="truncate pr-2">{item.label}</span>
                    <span className="font-mono text-stone-200">{formatINR(item.cost)}</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-stone-800/60 rounded-lg text-[11px] text-stone-300 mb-6 border border-stone-700/50">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Note: Final pricing depends on project specifications, soil depth, municipal setbacks, and customized material selections.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire This Estimate via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => onOpenConsultationModal({ sqFt, package: currentPackage?.name || 'Deluxe', floors })}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all text-center"
              >
                <span>Book Free Site Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
