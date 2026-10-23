import React from 'react';
import { Phone, MapPin, Mail, Sun, Moon, Shield, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useContent } from '../context/ContentContext.tsx';
import { VshnLogo } from './VshnLogo.tsx';
import { getCallUrl, getActiveContacts } from '../lib/contactUtils.ts';

interface FooterProps {
  onOpenAdminLogin: () => void;
  onOpenAdminConsole: () => void;
  isAuthenticated: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdminLogin,
  onOpenAdminConsole,
  isAuthenticated,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { content, primaryContact, contacts } = useContent();
  const { settings, packages } = content;
  const activeContacts = getActiveContacts(contacts);

  return (
    <footer className="bg-stone-950 text-white pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <VshnLogo size="lg" className="brightness-125" logoUrl={settings.logoUrl} />
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {settings.supportingTagline}
            </p>
            <p className="text-xs text-stone-400 leading-relaxed">
              Premium residential construction, 2D architectural planning, 3D home design, and turnkey building services in Chennai and across Tamil Nadu.
            </p>

            <div className="pt-2 text-xs text-amber-400 font-semibold">
              {settings.experienceYears} Years in Construction · Over {settings.foundersExperienceYears} Years Founders' Civil Engineering Experience
            </div>
          </div>

          {/* V-S-H-N Pillars Col */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              The VSHN Foundation
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li>
                <span className="font-bold text-white font-mono">V</span> — Value for Money
              </li>
              <li>
                <span className="font-bold text-white font-mono">S</span> — Satisfaction of Customer
              </li>
              <li>
                <span className="font-bold text-white font-mono">H</span> — Hope for Every Family
              </li>
              <li>
                <span className="font-bold text-white font-mono">N</span> — On-Time Milestone Delivery
              </li>
            </ul>

            <div className="pt-3">
              <span className="text-[11px] text-stone-400 block uppercase font-bold tracking-wider mb-1.5">
                Packages Starting Rate
              </span>
              <div className="flex gap-2 text-xs flex-wrap">
                {packages && packages.length > 0 ? (
                  packages.map((pkg) => (
                    <span key={pkg.id} className="px-2 py-1 rounded bg-stone-900 border border-stone-800">
                      {pkg.name} ₹{pkg.ratePerSqFt.toLocaleString('en-IN')}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Super ₹2,350</span>
                    <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Deluxe ₹2,450</span>
                    <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Premium ₹2,650</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#calculator" className="hover:text-white transition-colors">Cost Estimator</a></li>
              <li><a href="#projects" className="hover:text-white transition-colors">Projects Portfolio</a></li>
              <li><a href="#packages" className="hover:text-white transition-colors">Construction Packages</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Chennai Office
            </h4>
            <div className="flex items-start gap-2 text-stone-300">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {settings.address}
              </p>
            </div>
            <div className="space-y-1.5 text-stone-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <a
                  href={getCallUrl(primaryContact?.phoneNumber || settings.phone)}
                  className="hover:text-amber-400 font-semibold transition-colors"
                >
                  {primaryContact?.displayPhone || settings.phone}
                </a>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider ml-1">(Primary)</span>
              </div>
              {activeContacts.filter(c => !c.isPrimary).map(c => (
                <div key={c.id} className="text-[11px] text-stone-400 pl-6 flex items-center justify-between">
                  <span>{c.label}:</span>
                  <a href={getCallUrl(c.phoneNumber)} className="hover:text-stone-200 font-mono transition-colors">
                    {c.displayPhone}
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 transition-colors"
              >
                <span>Google Maps Directions</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar with theme toggle, admin access, copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div>
            &copy; {new Date().getFullYear()} VSHN BUILDERS. All Rights Reserved. Chennai, Tamil Nadu.
          </div>

          <div className="flex items-center gap-4">
            {/* Footer Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Footer Admin Button - Icon Only */}
            {isAuthenticated ? (
              <button
                onClick={onOpenAdminConsole}
                className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Admin Console"
                aria-label="Admin Console"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Admin Login"
                aria-label="Admin Login"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
