import React, { useState, useEffect } from 'react';
import { Sun, Moon, Shield, Phone, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useContent } from '../context/ContentContext.tsx';
import { VshnLogo } from './VshnLogo.tsx';

interface NavbarProps {
  onOpenAdminLogin: () => void;
  onOpenAdminConsole: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdminLogin,
  onOpenAdminConsole,
  activeSection = 'home',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { content } = useContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Cost Calculator', href: '#calculator' },
    { label: 'Projects', href: '#projects' },
    { label: 'Packages', href: '#packages' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-stone-950/95 backdrop-blur-md shadow-sm border-b border-stone-200/80 dark:border-stone-800/80 py-2.5'
          : 'bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm border-b border-stone-100 dark:border-stone-900 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#home" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg">
            <VshnLogo size="md" showTagline={true} logoUrl={content.settings.logoUrl} />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium tracking-tight rounded-md transition-colors ${
                  activeSection === link.href.slice(1)
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100/60 dark:hover:bg-stone-900/60'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions: Theme Toggle, Admin Button, Call CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* MANDATORY FEATURE ONE: Global Light/Dark Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {/* MANDATORY FEATURE TWO: Clearly Visible Admin Button */}
            {isAuthenticated ? (
              <button
                onClick={onOpenAdminConsole}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Open Admin Console"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200/90 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Admin Login"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Call Now Button */}
            <a
              href={`tel:${content.settings.phone.replace(/\s+/g, '')}`}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-400 shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{content.settings.phone}</span>
            </a>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 pt-3 pb-6 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1 mb-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-900 flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-900/60 rounded-lg">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Appearance Theme</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-stone-700"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-stone-700" /> Dark Mode
                  </>
                )}
              </button>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminConsole();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold text-sm shadow-sm"
              >
                <Shield className="w-4 h-4" />
                Go to Admin Console
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminLogin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-semibold text-sm border border-stone-200 dark:border-stone-800"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Admin Portal Login
              </button>
            )}

            <a
              href={`tel:${content.settings.phone.replace(/\s+/g, '')}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-semibold text-sm shadow-sm"
            >
              <Phone className="w-4 h-4" />
              Call {content.settings.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
