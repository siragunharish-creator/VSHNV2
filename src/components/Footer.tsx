import React from 'react';
import { Phone, MapPin, Mail, Sun, Moon, Shield, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useContent } from '../context/ContentContext.tsx';
import { VshnLogo } from './VshnLogo.tsx';

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
  const { content } = useContent();
  const { settings } = content;

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
              12 Years in Construction · Over 20 Years Founders' Civil Engineering Experience
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
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Super ₹2,250</span>
                <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Deluxe ₹2,450</span>
                <span className="px-2 py-1 rounded bg-stone-900 border border-stone-800">Premium ₹2,650</span>
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
            <div className="flex items-center gap-2 text-stone-300">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:text-white font-semibold">
                {settings.phone}
              </a>
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

            {/* Footer Admin Button */}
            {isAuthenticated ? (
              <button
                onClick={onOpenAdminConsole}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:text-emerald-300 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
