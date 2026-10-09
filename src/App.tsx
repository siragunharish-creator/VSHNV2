import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ContentProvider, useContent } from './context/ContentContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { BrandValuesSection } from './components/BrandValuesSection.tsx';
import { CostCalculator } from './components/CostCalculator.tsx';
import { ServicesSection } from './components/ServicesSection.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { PackagesSection } from './components/PackagesSection.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { ProcessSection } from './components/ProcessSection.tsx';
import { TestimonialsSection } from './components/TestimonialsSection.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingActions } from './components/FloatingActions.tsx';
import { ConsultationModal } from './components/ConsultationModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminConsole } from './admin/AdminConsole.tsx';

function MainSite() {
  const { isAuthenticated } = useAuth();
  const { content, isLoading } = useContent();

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationModalData, setConsultationModalData] = useState<{
    service?: string;
    package?: string;
    sqFt?: number;
  }>({});

  const handleOpenConsultation = (serviceOrPkg?: string, sqFt?: number) => {
    let pkg: string | undefined = undefined;
    let srv: string | undefined = undefined;

    if (serviceOrPkg) {
      if (['Super', 'Deluxe', 'Premium'].includes(serviceOrPkg)) {
        pkg = serviceOrPkg;
      } else {
        srv = serviceOrPkg;
      }
    }

    setConsultationModalData({
      service: srv || 'Complete residential construction',
      package: pkg || 'Deluxe',
      sqFt,
    });
    setIsConsultationModalOpen(true);
  };

  const handleOpenCalculatorConsultation = (data?: { sqFt: number; package: string; floors: string }) => {
    setConsultationModalData({
      service: 'Complete residential construction',
      package: data?.package || 'Deluxe',
      sqFt: data?.sqFt || 1800,
    });
    setIsConsultationModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenAdminConsole={() => setIsAdminConsoleOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onOpenConsultationModal={() => handleOpenConsultation()} />

        {/* Brand Values (V-S-H-N) */}
        <BrandValuesSection />

        {/* Interactive Cost Calculator */}
        <CostCalculator onOpenConsultationModal={handleOpenCalculatorConsultation} />

        {/* Services Showcase */}
        <ServicesSection onOpenConsultationModal={(service) => handleOpenConsultation(service)} />

        {/* Projects / Portfolio */}
        <ProjectsSection />

        {/* Construction Packages (Super, Deluxe, Premium) */}
        <PackagesSection onOpenConsultationModal={(pkg) => handleOpenConsultation(pkg)} />

        {/* 5-Step Process */}
        <ProcessSection />

        {/* About Company & Founders */}
        <AboutSection />

        {/* Client Testimonials */}
        <TestimonialsSection />

        {/* FAQ Accordion */}
        <FaqSection />

        {/* Contact Form & Office Map */}
        <ContactSection
          initialService={consultationModalData.service}
          initialPackage={consultationModalData.package}
          initialSqFt={consultationModalData.sqFt}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenAdminConsole={() => setIsAdminConsoleOpen(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Floating Call & WhatsApp Desk */}
      <FloatingActions />

      {/* Interactive Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        initialService={consultationModalData.service}
        initialPackage={consultationModalData.package}
        initialSqFt={consultationModalData.sqFt}
      />

      {/* Secure Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setIsAdminConsoleOpen(true)}
      />

      {/* Full Admin Console */}
      {isAdminConsoleOpen && isAuthenticated && (
        <AdminConsole
          onClose={() => setIsAdminConsoleOpen(false)}
          onPreviewSite={() => setIsAdminConsoleOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ContentProvider>
          <MainSite />
        </ContentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
