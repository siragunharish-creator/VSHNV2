import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Home,
  FolderKanban,
  Wrench,
  BadgePercent,
  Image as ImageIcon,
  BookOpen,
  PhoneCall,
  MessageSquareQuote,
  Inbox,
  Lock,
  LogOut,
  Save,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  AlertCircle,
  Sun,
  Moon,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  FileCheck2,
  Layers,
  MapPin,
  Menu,
  Search,
  Filter,
  CheckCircle,
  EyeOff,
  Shield,
  Play,
  Video,
  Instagram,
  Youtube,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useContent } from '../context/ContentContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { WebsiteContent, Project, Service, PricingPackage, Testimonial, MediaItem, ContactSubmission } from '../shared/types.ts';
import { VshnLogo } from '../components/VshnLogo.tsx';
import { ImagePickerField } from '../components/ImagePickerField.tsx';
import { MultiImagePickerField } from '../components/MultiImagePickerField.tsx';

interface AdminConsoleProps {
  onClose: () => void;
  onPreviewSite: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'homepage'
  | 'projects'
  | 'services'
  | 'packages'
  | 'media'
  | 'featuredMedia'
  | 'about'
  | 'contact'
  | 'testimonials'
  | 'enquiries'
  | 'security';

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose, onPreviewSite }) => {
  const { user, logout, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    content,
    draftContent,
    enquiries,
    activities,
    saveDraft,
    publishContent,
    uploadImage,
    deleteMedia,
    updateEnquiryStatus,
    deleteEnquiry,
    resetToDefaults,
    isSaving,
    saveMessage,
  } = useContent();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Media Library filters & search
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  const [mediaStatusFilter, setMediaStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [mediaSearchTerm, setMediaSearchTerm] = useState<string>('');

  const [editableData, setEditableData] = useState<WebsiteContent>(() => {
    return JSON.parse(JSON.stringify(draftContent || content));
  });

  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<MediaItem['category']>('exterior');
  const [isUploading, setIsUploading] = useState(false);

  // Security pass change states
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Editing modals
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingMediaItem, setEditingMediaItem] = useState<{ id: string; title: string; altText: string } | null>(null);

  // Update Media Title / Name
  const handleUpdateMediaTitle = (id: string, newTitle: string, newAltText?: string) => {
    setEditableData((prev) => ({
      ...prev,
      mediaLibrary: (prev.mediaLibrary || []).map((m) =>
        m.id === id ? { ...m, title: newTitle.trim() || m.title, altText: newAltText?.trim() || m.altText || newTitle } : m
      ),
    }));
    showToast('success', 'Image title and details updated in draft.');
  };

  // Media management functions (Active/Inactive toggle, Category change, Delete)
  const handleToggleMediaActive = (id: string) => {
    setEditableData((prev) => {
      const updatedList = (prev.mediaLibrary || []).map((m) => {
        if (m.id === id) {
          const currentIsActive = m.isActive !== false;
          const nextActive = !currentIsActive;
          return {
            ...m,
            isActive: nextActive,
            status: nextActive ? ('active' as const) : ('inactive' as const),
          };
        }
        return m;
      });
      return { ...prev, mediaLibrary: updatedList };
    });
    showToast('success', 'Image status changed successfully.');
  };

  const handleUpdateMediaCategory = (id: string, newCategory: string) => {
    setEditableData((prev) => ({
      ...prev,
      mediaLibrary: (prev.mediaLibrary || []).map((m) =>
        m.id === id ? { ...m, category: newCategory as any } : m
      ),
    }));
    showToast('success', 'Image category updated.');
  };

  const handleDeleteMediaItem = async (id: string) => {
    setEditableData((prev) => ({
      ...prev,
      mediaLibrary: (prev.mediaLibrary || []).filter((m) => m.id !== id),
    }));
    await deleteMedia(id);
    showToast('success', 'Media item removed from library.');
  };

  // Helper notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => setStatusNotification(null), 5000);
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    const res = await saveDraft(editableData);
    if (res.success) {
      showToast('success', 'Draft changes saved successfully.');
    } else {
      showToast('error', res.error || 'Failed to save draft.');
    }
  };

  // Publish Live Action (No window.confirm to avoid iframe blocking!)
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await publishContent(editableData);
      setIsPublishing(false);
      if (res.success) {
        showToast('success', 'Live website updated and published!');
        setShowPublishSuccessModal(true);
      } else {
        showToast('error', res.error || 'Failed to publish changes.');
      }
    } catch (err: any) {
      setIsPublishing(false);
      showToast('error', err.message || 'Error publishing content.');
    }
  };

  // Reset to defaults
  const handleConfirmReset = async () => {
    setIsResetModalOpen(false);
    const res = await resetToDefaults();
    if (res.success) {
      showToast('success', res.message || 'Content reset to official defaults.');
      setEditableData(JSON.parse(JSON.stringify(content)));
    } else {
      showToast('error', res.message || 'Reset failed.');
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'File size exceeds 15MB limit.');
      return;
    }

    setIsUploading(true);
    const res = await uploadImage(file, {
      title: file.name,
      category: uploadCategory,
      altText: file.name,
    });
    setIsUploading(false);

    if (res.success && res.url) {
      showToast('success', `Image uploaded successfully: ${res.url}`);
      // Also append to editableData.mediaLibrary if needed
      setEditableData((prev) => ({
        ...prev,
        mediaLibrary: [
          {
            id: 'med-' + Date.now(),
            url: res.url!,
            title: file.name,
            altText: file.name,
            category: uploadCategory,
            isActive: true,
            status: 'active',
            uploadedAt: new Date().toISOString(),
            sizeBytes: file.size,
          },
          ...(prev.mediaLibrary || []),
        ],
      }));
    } else {
      showToast('error', res.error || 'Failed to upload image.');
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      showToast('error', 'New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    const res = await changePassword(currPass, newPass);
    if (res.success) {
      showToast('success', 'Password updated successfully!');
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      showToast('error', res.error || 'Failed to change password.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'homepage', label: 'Home Page Editor', icon: <Home className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects & Portfolio', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'services', label: 'Services Manager', icon: <Wrench className="w-4 h-4" /> },
    { id: 'packages', label: 'Construction Packages', icon: <BadgePercent className="w-4 h-4" /> },
    { id: 'media', label: 'Media Library & Uploads', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'featuredMedia', label: 'YouTube & Instagram Videos', icon: <Play className="w-4 h-4" /> },
    { id: 'about', label: 'About Us & Values', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Details & SEO', icon: <PhoneCall className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Testimonials / Reviews', icon: <MessageSquareQuote className="w-4 h-4" /> },
    { id: 'enquiries', label: `Customer Enquiries (${enquiries.filter((e) => e.status === 'new').length})`, icon: <Inbox className="w-4 h-4" /> },
    { id: 'security', label: 'Account Security', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-16 shrink-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Sidebar Hamburger Button */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer"
            title="Toggle Sections Menu"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline text-xs font-semibold">Sections</span>
          </button>

          <VshnLogo size="sm" />
          <div className="hidden sm:flex items-center justify-center p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Admin">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Notification Toast */}
          {statusNotification && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold animate-in fade-in ${
                statusNotification.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{statusNotification.message}</span>
            </div>
          )}

          {/* Global Light/Dark Theme Toggle in Admin */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* View Website Live */}
          <button
            onClick={onPreviewSite}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">View Public Site</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Save Draft</span>
          </button>

          {/* Publish Live */}
          <button
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors cursor-pointer disabled:opacity-70"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Publishing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Publish</span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              await logout();
              onClose();
            }}
            aria-label="Logout"
            className="p-2 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Logout Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Close Admin Console */}
          <button
            onClick={onClose}
            aria-label="Close Admin Console"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Drawer Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden animate-in fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Drawer on Mobile / Permanent on Desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:static lg:w-64 lg:shrink-0 lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VshnLogo size="sm" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Navigation
              </span>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-stone-400">
              Content Navigation
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom user badge & reset */}
          <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
            <div className="px-2 py-1.5 text-xs text-stone-500 dark:text-stone-400">
              Logged in as <strong className="text-stone-800 dark:text-stone-200">harish</strong>
            </div>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                setIsResetModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo Defaults</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-stone-50 dark:bg-stone-950">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Mobile Section Switcher Bar */}
            <div className="lg:hidden flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">Section:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {navItems.find((i) => i.id === activeTab)?.label}
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="px-2.5 py-1 rounded-md bg-amber-500 text-stone-950 font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Menu className="w-3 h-3" />
                <span>Switch</span>
              </button>
            </div>
            {/* ================= 1. DASHBOARD ================= */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    Administrator Dashboard
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Overview of VSHN Builders digital presence, projects, customer leads, and recent changes.
                  </p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block">Published Projects</span>
                    <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono mt-1 block">
                      {editableData.projects.filter((p) => p.isPublished).length}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                      {editableData.projects.filter((p) => !p.isPublished).length} drafts
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block">Services Listed</span>
                    <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono mt-1 block">
                      {editableData.services.length}
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1 block">Active on site</span>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block">Construction Packages</span>
                    <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                      {editableData.packages.length}
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Super, Deluxe, Premium
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                    <span className="text-xs font-semibold text-stone-500 block">New Customer Leads</span>
                    <span className="text-3xl font-extrabold text-emerald-600 font-mono mt-1 block">
                      {enquiries.filter((e) => e.status === 'new').length}
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      {enquiries.length} total enquiries
                    </span>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 uppercase tracking-wider text-xs">
                    Quick Administration Shortcuts
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-left transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-bold">Add New Project</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </button>
                    <button
                      onClick={() => setActiveTab('packages')}
                      className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-left transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-bold">Update Sq.Ft Pricing</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </button>
                    <button
                      onClick={() => setActiveTab('media')}
                      className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-left transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-bold">Upload Photos</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </button>
                    <button
                      onClick={() => setActiveTab('enquiries')}
                      className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-left transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-bold">View Customer Leads</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </button>
                  </div>
                </div>

                {/* Recent Activities Log */}
                <div className="p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4">
                    Recent Administrative Activity Log
                  </h3>
                  <div className="space-y-3">
                    {activities.slice(0, 6).map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800 text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900 dark:text-stone-100 block">
                            {act.action}
                          </span>
                          <span className="text-stone-500 dark:text-stone-400">{act.details}</span>
                        </div>
                        <div className="text-right text-[11px] text-stone-400 shrink-0">
                          {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. HOME PAGE EDITOR ================= */}
            {activeTab === 'homepage' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    Home Page Content Editor
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Update the hero banner, taglines, experience numbers, and toggle sections.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Hero Headline */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      Hero Primary Headline
                    </label>
                    <input
                      type="text"
                      value={editableData.settings.hero.headline}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            hero: { ...editableData.settings.hero, headline: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  {/* Hero Subheading */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      Hero Supporting Copy
                    </label>
                    <textarea
                      rows={3}
                      value={editableData.settings.hero.subheading}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            hero: { ...editableData.settings.hero, subheading: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm leading-relaxed"
                    />
                  </div>

                  {/* Company Brand Logo */}
                  <ImagePickerField
                    label="Company Brand Logo"
                    value={editableData.settings.logoUrl || '/vshn-logo.svg'}
                    onChange={(newUrl) =>
                      setEditableData({
                        ...editableData,
                        settings: {
                          ...editableData.settings,
                          logoUrl: newUrl,
                        },
                      })
                    }
                    category="branding"
                    aspectRatio="square"
                    helperText="Upload your official VSHN Builders logo (PNG, JPG, SVG, WebP) or pick from preloaded media."
                  />

                  {/* Hero Background Image */}
                  <ImagePickerField
                    label="Hero Section Background Architectural Photography"
                    value={editableData.settings.hero.backgroundImage}
                    onChange={(newUrl) =>
                      setEditableData({
                        ...editableData,
                        settings: {
                          ...editableData.settings,
                          hero: { ...editableData.settings.hero, backgroundImage: newUrl },
                        },
                      })
                    }
                    category="exterior"
                    aspectRatio="wide"
                    helperText="Upload a high-resolution villa exterior or choose from the architectural library."
                  />

                  {/* CTAs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Primary CTA Label
                      </label>
                      <input
                        type="text"
                        value={editableData.settings.hero.primaryCtaText}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              hero: { ...editableData.settings.hero, primaryCtaText: e.target.value },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Secondary CTA Label
                      </label>
                      <input
                        type="text"
                        value={editableData.settings.hero.secondaryCtaText}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              hero: { ...editableData.settings.hero, secondaryCtaText: e.target.value },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Statistics & Experience */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Company Experience
                      </label>
                      <input
                        type="number"
                        value={editableData.settings.experienceYears}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              experienceYears: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Founders Experience
                      </label>
                      <input
                        type="number"
                        value={editableData.settings.foundersExperienceYears}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              foundersExperienceYears: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Completed Projects
                      </label>
                      <input
                        type="number"
                        value={editableData.settings.completedProjectsCount}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              completedProjectsCount: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Turnkey Sq.Ft Done
                      </label>
                      <input
                        type="text"
                        value={editableData.settings.sqFtConstructed}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              sqFtConstructed: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Home Page Save & Publish Bar */}
                  <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-stone-500">
                      Save home page changes as a draft or publish live directly.
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving || isPublishing}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isSaving || isPublishing}
                        className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
                      >
                        Publish Live to Website
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. PROJECTS MANAGER ================= */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                      Projects &amp; Portfolio Manager
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Add, update, or unpublish residential villa projects shown on the public site.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newProj: Project = {
                        id: 'proj-' + Date.now(),
                        title: 'New Chennai Residential Project',
                        slug: 'new-chennai-project-' + Date.now(),
                        location: 'Chennai',
                        city: 'Chennai',
                        category: 'Residential Villa',
                        status: 'Completed',
                        propertyType: 'Independent Villa',
                        builtUpArea: 2200,
                        floors: 'G+1',
                        completionYear: new Date().getFullYear(),
                        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
                        galleryImages: [
                          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
                        ],
                        description: 'Custom designed residential villa constructed with high structural precision.',
                        keyFeatures: ['Vaastu compliant', 'Tata Tiscon steel reinforcement'],
                        packageUsed: 'Deluxe',
                        isFeatured: false,
                        isPublished: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      setEditableData({
                        ...editableData,
                        projects: [newProj, ...editableData.projects],
                      });
                      setEditingProject(newProj);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editableData.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-white dark:bg-stone-900 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col"
                    >
                      <div className="relative h-44 bg-stone-200 dark:bg-stone-800">
                        <img src={proj.coverImage} alt={proj.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-stone-950/80 text-[10px] text-white font-bold">
                          {proj.isPublished ? 'Live' : 'Draft'}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-amber-600 font-semibold mb-1">
                            {proj.category} · {proj.builtUpArea} sq.ft
                          </div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                            {proj.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {proj.location}, {proj.city}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="text-xs font-semibold text-amber-600 hover:underline flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditableData({
                                ...editableData,
                                projects: editableData.projects.filter((p) => p.id !== proj.id),
                              });
                              showToast('success', `Project "${proj.title}" removed. Click Publish Live to save.`);
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700 p-1"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Project Dialog */}
                {editingProject && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Edit Project: {editingProject.title}</h3>
                        <button onClick={() => setEditingProject(null)} className="p-1 text-stone-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold block mb-1">Project Title</label>
                          <input
                            type="text"
                            value={editingProject.title}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold block mb-1">Location</label>
                            <input
                              type="text"
                              value={editingProject.location}
                              onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                              className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold block mb-1">Built-up Area (sq.ft)</label>
                            <input
                              type="number"
                              value={editingProject.builtUpArea}
                              onChange={(e) => setEditingProject({ ...editingProject, builtUpArea: Number(e.target.value) })}
                              className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="font-bold block mb-1">Floors</label>
                            <input
                              type="text"
                              value={editingProject.floors}
                              onChange={(e) => setEditingProject({ ...editingProject, floors: e.target.value })}
                              className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold block mb-1">Category</label>
                            <select
                              value={editingProject.category}
                              onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                              className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                            >
                              <option value="Residential Villa">Residential Villa</option>
                              <option value="Independent House">Independent House</option>
                              <option value="Duplex">Duplex</option>
                              <option value="Turnkey Construction">Turnkey Construction</option>
                              <option value="Renovation">Renovation</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold block mb-1">Package</label>
                            <select
                              value={editingProject.packageUsed}
                              onChange={(e) => setEditingProject({ ...editingProject, packageUsed: e.target.value as any })}
                              className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                            >
                              <option value="Super">Super (₹2,250)</option>
                              <option value="Deluxe">Deluxe (₹2,450)</option>
                              <option value="Premium">Premium (₹2,650)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <ImagePickerField
                            label="Project Architectural Cover Image"
                            value={editingProject.coverImage}
                            onChange={(newUrl) => setEditingProject({ ...editingProject, coverImage: newUrl })}
                            category="exterior"
                            aspectRatio="video"
                            helperText="Select or upload the main exterior architectural photo for this project."
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Description</label>
                          <textarea
                            rows={3}
                            value={editingProject.description}
                            onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="checkbox"
                              checked={editingProject.isPublished}
                              onChange={(e) => setEditingProject({ ...editingProject, isPublished: e.target.checked })}
                            />
                            <span>Published on Public Website</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="checkbox"
                              checked={editingProject.isFeatured}
                              onChange={(e) => setEditingProject({ ...editingProject, isFeatured: e.target.checked })}
                            />
                            <span>Featured on Homepage</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="px-3 py-1.5 rounded border text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditableData({
                              ...editableData,
                              projects: editableData.projects.map((p) =>
                                p.id === editingProject.id ? editingProject : p
                              ),
                            });
                            setEditingProject(null);
                            showToast('success', 'Project updated in draft.');
                          }}
                          className="px-4 py-1.5 rounded bg-amber-500 font-bold text-stone-950 text-xs"
                        >
                          Apply to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 4. SERVICES MANAGER ================= */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                      Services Manager
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Manage construction and architectural service offerings, starting rates, and deliverables.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editableData.services.map((serv) => (
                    <div
                      key={serv.id}
                      className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{serv.title}</h4>
                          <span className="text-xs font-mono font-bold text-amber-600">{serv.startingPrice}</span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
                          {serv.shortDescription}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center text-xs">
                        <button
                          onClick={() => setEditingService(serv)}
                          className="font-semibold text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Service Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Service Modal */}
                {editingService && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-lg w-full p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold">Edit Service</h3>
                        <button onClick={() => setEditingService(null)} className="p-1 text-stone-400">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold block mb-1">Service Title</label>
                          <input
                            type="text"
                            value={editingService.title}
                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        {/* Service Cover Image Picker */}
                        <ImagePickerField
                          label="Service Architectural Cover Photo"
                          value={editingService.coverImage}
                          onChange={(newUrl) => setEditingService({ ...editingService, coverImage: newUrl })}
                          category="services"
                          aspectRatio="video"
                          helperText="Select or upload the high-resolution cover photo for this construction service."
                        />

                        <div>
                          <label className="font-bold block mb-1">Starting Price Tag</label>
                          <input
                            type="text"
                            value={editingService.startingPrice || ''}
                            onChange={(e) => setEditingService({ ...editingService, startingPrice: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Short Description</label>
                          <textarea
                            rows={2}
                            value={editingService.shortDescription}
                            onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Full Description</label>
                          <textarea
                            rows={4}
                            value={editingService.fullDescription}
                            onChange={(e) => setEditingService({ ...editingService, fullDescription: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-end gap-2">
                        <button onClick={() => setEditingService(null)} className="px-3 py-1.5 rounded border text-xs">
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setEditableData({
                              ...editableData,
                              services: editableData.services.map((s) =>
                                s.id === editingService.id ? editingService : s
                              ),
                            });
                            setEditingService(null);
                            showToast('success', 'Service updated in draft.');
                          }}
                          className="px-4 py-1.5 rounded bg-amber-500 font-bold text-stone-950 text-xs"
                        >
                          Apply to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 5. PACKAGES MANAGER ================= */}
            {activeTab === 'packages' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    Construction Packages &amp; Pricing Manager
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Edit the Super, Deluxe, and Premium packages rates, features, and descriptions. Changes update the public site when published!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {editableData.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold font-serif">{pkg.name} Package</h3>
                          <span className="text-xs text-amber-600 font-semibold">{pkg.badge}</span>
                        </div>

                        <div className="my-3">
                          <label className="text-[11px] font-bold text-stone-500 block mb-1">
                            Price per Sq. Ft. (₹)
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 font-bold">₹</span>
                            <input
                              type="number"
                              value={pkg.ratePerSqFt}
                              onChange={(e) => {
                                const newRate = Number(e.target.value);
                                setEditableData({
                                  ...editableData,
                                  packages: editableData.packages.map((p) =>
                                    p.id === pkg.id ? { ...p, ratePerSqFt: newRate } : p
                                  ),
                                });
                              }}
                              className="w-full p-2 font-mono font-black text-xl text-amber-600 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mt-4 text-xs">
                          <div>
                            <label className="font-bold text-stone-500 block mb-0.5">Tagline</label>
                            <input
                              type="text"
                              value={pkg.tagline}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditableData({
                                  ...editableData,
                                  packages: editableData.packages.map((p) =>
                                    p.id === pkg.id ? { ...p, tagline: val } : p
                                  ),
                                });
                              }}
                              className="w-full p-1.5 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-stone-500 block mb-0.5">Description</label>
                            <textarea
                              rows={2}
                              value={pkg.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditableData({
                                  ...editableData,
                                  packages: editableData.packages.map((p) =>
                                    p.id === pkg.id ? { ...p, description: val } : p
                                  ),
                                });
                              }}
                              className="w-full p-1.5 rounded border bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t text-xs">
                        <span className="text-[11px] font-bold text-stone-500 block mb-1">
                          Inclusions ({pkg.includedHighlights.length} items)
                        </span>
                        <ul className="space-y-1 text-[11px] text-stone-600 dark:text-stone-400">
                          {pkg.includedHighlights.slice(0, 3).map((h, i) => (
                            <li key={i} className="truncate">
                              • {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= 6. MEDIA LIBRARY & UPLOADS ================= */}
            {activeTab === 'media' && (() => {
              const library = editableData.mediaLibrary || [];
              const totalCount = library.length;
              const activeCount = library.filter((m) => m.isActive !== false).length;
              const inactiveCount = library.filter((m) => m.isActive === false).length;

              const filteredMedia = library.filter((item) => {
                // Category filter
                if (mediaCategoryFilter !== 'all' && item.category !== mediaCategoryFilter) {
                  return false;
                }
                // Status filter
                const isItemActive = item.isActive !== false;
                if (mediaStatusFilter === 'active' && !isItemActive) return false;
                if (mediaStatusFilter === 'inactive' && isItemActive) return false;
                // Search term
                if (mediaSearchTerm.trim()) {
                  const q = mediaSearchTerm.toLowerCase();
                  const matchesTitle = item.title?.toLowerCase().includes(q);
                  const matchesUrl = item.url?.toLowerCase().includes(q);
                  const matchesCategory = item.category?.toLowerCase().includes(q);
                  if (!matchesTitle && !matchesUrl && !matchesCategory) return false;
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Header & Stats Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                        Persistent Media &amp; Image Library
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        Manage all website images. Toggle Active/Inactive visibility, change categories, or delete images.
                      </p>
                    </div>

                    {/* Stats Badges */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700">
                        Total: <strong>{totalCount}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Active: <strong>{activeCount}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Inactive: <strong>{inactiveCount}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Filter & Upload Toolbar */}
                  <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                      {/* Search & Filters */}
                      <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={mediaSearchTerm}
                            onChange={(e) => setMediaSearchTerm(e.target.value)}
                            placeholder="Search images by name or URL..."
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-stone-500 whitespace-nowrap">Category:</label>
                          <select
                            value={mediaCategoryFilter}
                            onChange={(e) => setMediaCategoryFilter(e.target.value)}
                            className="p-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold cursor-pointer"
                          >
                            <option value="all">All Categories ({totalCount})</option>
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                            <option value="floor_plan">Floor Plan</option>
                            <option value="3d_render">3D Design</option>
                            <option value="site_work">Site Work</option>
                            <option value="branding">Branding</option>
                            <option value="services">Services</option>
                            <option value="projects">Projects</option>
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-stone-500 whitespace-nowrap">Status:</label>
                          <select
                            value={mediaStatusFilter}
                            onChange={(e) => setMediaStatusFilter(e.target.value as any)}
                            className="p-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold cursor-pointer"
                          >
                            <option value="all">All Statuses ({totalCount})</option>
                            <option value="active">Active Only ({activeCount})</option>
                            <option value="inactive">Inactive Only ({inactiveCount})</option>
                          </select>
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value as any)}
                          className="p-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold cursor-pointer"
                        >
                          <option value="exterior">Upload as: Exterior</option>
                          <option value="interior">Upload as: Interior</option>
                          <option value="floor_plan">Upload as: Floor Plan</option>
                          <option value="3d_render">Upload as: 3D Design</option>
                          <option value="site_work">Upload as: Site Work</option>
                          <option value="branding">Upload as: Branding</option>
                          <option value="services">Upload as: Services</option>
                          <option value="projects">Upload as: Projects</option>
                        </select>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95 disabled:opacity-70 whitespace-nowrap"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Media Grid */}
                  {filteredMedia.length === 0 ? (
                    <div className="p-12 text-center rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                      <ImageIcon className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600" />
                      <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                        No images found matching your selected filters.
                      </p>
                      <button
                        onClick={() => {
                          setMediaCategoryFilter('all');
                          setMediaStatusFilter('all');
                          setMediaSearchTerm('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredMedia.map((item) => {
                        const isItemActive = item.isActive !== false;
                        return (
                          <div
                            key={item.id}
                            className={`group relative bg-white dark:bg-stone-900 rounded-xl overflow-hidden border shadow-xs flex flex-col transition-all duration-200 ${
                              isItemActive
                                ? 'border-stone-200 dark:border-stone-800'
                                : 'border-stone-300 dark:border-stone-700 opacity-75 bg-stone-50/50 dark:bg-stone-950/50'
                            }`}
                          >
                            {/* Image Thumbnail */}
                            <div className="h-40 bg-stone-100 dark:bg-stone-800 overflow-hidden relative group">
                              <img
                                src={item.url}
                                alt={item.title}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Active Status Badge on Image */}
                              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMediaActive(item.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md cursor-pointer flex items-center gap-1 transition-all ${
                                    isItemActive
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-stone-700 text-stone-200 hover:bg-stone-800'
                                  }`}
                                  title="Click to toggle Active / Inactive"
                                >
                                  {isItemActive ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-emerald-200" />
                                      <span>Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3 h-3 text-stone-400" />
                                      <span>Inactive</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Category Badge */}
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-xs text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                                {item.category || 'general'}
                              </div>
                            </div>

                            {/* Card Details */}
                            <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <p className="font-bold text-stone-800 dark:text-stone-200 truncate flex-1" title={item.title}>
                                    {item.title}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMediaItem({ id: item.id, title: item.title, altText: item.altText || '' })}
                                    className="p-1 rounded text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                    title="Edit image name / title"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-stone-400 block font-mono truncate mt-0.5">
                                  {item.url}
                                </span>
                              </div>

                              {/* Category Selector Dropdown (Update option per image) */}
                              <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                                  Change Category:
                                </label>
                                <select
                                  value={item.category || 'exterior'}
                                  onChange={(e) => handleUpdateMediaCategory(item.id, e.target.value)}
                                  className="w-full p-1.5 text-xs rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium cursor-pointer"
                                >
                                  <option value="exterior">Exterior</option>
                                  <option value="interior">Interior</option>
                                  <option value="floor_plan">Floor Plan</option>
                                  <option value="3d_render">3D Design</option>
                                  <option value="site_work">Site Work</option>
                                  <option value="branding">Branding</option>
                                  <option value="services">Services</option>
                                  <option value="projects">Projects</option>
                                </select>
                              </div>

                              {/* Card Actions Footer */}
                              <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                                {/* Toggle Active/Inactive Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleMediaActive(item.id)}
                                  className={`text-[11px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                                    isItemActive
                                      ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  }`}
                                >
                                  {isItemActive ? 'Set Inactive' : 'Set Active'}
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.url);
                                      showToast('success', 'Image URL copied to clipboard!');
                                    }}
                                    className="p-1 rounded text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                    title="Copy URL"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMediaItem(item.id)}
                                    className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Edit Image Modal */}
                  {editingMediaItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
                      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            <Edit className="w-4 h-4 text-amber-500" />
                            <span>Edit Image Details</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditingMediaItem(null)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                              Image Title / Name *
                            </label>
                            <input
                              type="text"
                              value={editingMediaItem.title}
                              onChange={(e) => setEditingMediaItem({ ...editingMediaItem, title: e.target.value })}
                              placeholder="e.g. Modern Villa Front Elevation"
                              className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                              Alt Text / Description
                            </label>
                            <input
                              type="text"
                              value={editingMediaItem.altText}
                              onChange={(e) => setEditingMediaItem({ ...editingMediaItem, altText: e.target.value })}
                              placeholder="e.g. Contemporary architectural villa in Chennai"
                              className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMediaItem(null)}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateMediaTitle(editingMediaItem.id, editingMediaItem.title, editingMediaItem.altText);
                              setEditingMediaItem(null);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                          >
                            Save Name Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ================= 7. YOUTUBE & INSTAGRAM VIDEOS ================= */}
            {activeTab === 'featuredMedia' && (() => {
              const currentMedia = editableData.settings.featuredMedia || {
                youtubeVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                instagramPostUrl: 'https://www.instagram.com/p/DF2N8c5z0fL/',
                title: 'Site Walkthrough & Construction Highlights',
                subtitle: 'Watch our live Chennai site video tours and follow our architectural craft on YouTube & Instagram.',
              };

              // Extract preview IDs
              const ytMatch = currentMedia.youtubeVideoUrl?.match(/[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})/);
              const ytId = ytMatch ? ytMatch[1] || ytMatch[2] || ytMatch[3] : null;

              const igMatch = currentMedia.instagramPostUrl?.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
              const igCode = igMatch ? igMatch[1] : null;

              return (
                <div className="bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Play className="w-5 h-5 text-amber-500" />
                      <span>YouTube &amp; Instagram Video Manager</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Paste any YouTube video/Shorts link and Instagram Reel/Post link. The website will automatically embed and play them!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* YouTube Video Config */}
                    <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-4">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                        <Youtube className="w-5 h-5" />
                        <span>YouTube Video Link</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          YouTube Video URL
                        </label>
                        <input
                          type="text"
                          value={currentMedia.youtubeVideoUrl || ''}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              settings: {
                                ...editableData.settings,
                                featuredMedia: {
                                  ...currentMedia,
                                  youtubeVideoUrl: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs"
                        />
                        <span className="text-[11px] text-stone-400 mt-1 block">
                          Paste any YouTube link, standard video, or YouTube Short.
                        </span>
                      </div>

                      {/* Live Preview */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                          Live Video Player Preview:
                        </label>
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-stone-900 border border-stone-700 flex items-center justify-center">
                          {ytId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                              title="YouTube Preview"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          ) : (
                            <div className="p-4 text-center text-xs text-stone-400">
                              Paste a valid YouTube URL above to preview video playback.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Instagram Post/Reel Config */}
                    <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 space-y-4">
                      <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
                        <Instagram className="w-5 h-5" />
                        <span>Instagram Post / Reel Link</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Instagram Post or Reel URL
                        </label>
                        <input
                          type="text"
                          value={currentMedia.instagramPostUrl || ''}
                          onChange={(e) =>
                            setEditableData({
                              ...editableData,
                              settings: {
                                ...editableData.settings,
                                featuredMedia: {
                                  ...currentMedia,
                                  instagramPostUrl: e.target.value,
                                },
                              },
                            })
                          }
                          placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-xs"
                        />
                        <span className="text-[11px] text-stone-400 mt-1 block">
                          Paste any public Instagram post, Reel, or IGTV URL.
                        </span>
                      </div>

                      {/* Live Preview */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                          Live Instagram Preview:
                        </label>
                        <div className="h-64 w-full rounded-lg overflow-hidden bg-stone-900 border border-stone-700 flex items-center justify-center">
                          {igCode ? (
                            <iframe
                              src={`https://www.instagram.com/p/${igCode}/embed/captioned/`}
                              title="Instagram Preview"
                              className="w-full h-full border-0"
                              scrolling="no"
                              allowTransparency
                            />
                          ) : (
                            <div className="p-4 text-center text-xs text-stone-400">
                              Paste a valid Instagram URL above to preview the post or Reel.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Headings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800 text-xs">
                    <div>
                      <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Showcase Title
                      </label>
                      <input
                        type="text"
                        value={currentMedia.title || ''}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              featuredMedia: {
                                ...currentMedia,
                                title: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                        Showcase Subtitle
                      </label>
                      <input
                        type="text"
                        value={currentMedia.subtitle || ''}
                        onChange={(e) =>
                          setEditableData({
                            ...editableData,
                            settings: {
                              ...editableData.settings,
                              featuredMedia: {
                                ...currentMedia,
                                subtitle: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                    >
                      Publish Live
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ================= 7. ABOUT US & VALUES ================= */}
            {activeTab === 'about' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    About Us &amp; Brand Values (V-S-H-N)
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Edit company history, founders' background, and the 4 core pillars.
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="font-bold block mb-1">About Section Heading</label>
                    <input
                      type="text"
                      value={editableData.settings.aboutSection.introHeading}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            aboutSection: {
                              ...editableData.settings.aboutSection,
                              introHeading: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Company Introduction</label>
                    <textarea
                      rows={3}
                      value={editableData.settings.aboutSection.introParagraph}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            aboutSection: {
                              ...editableData.settings.aboutSection,
                              introParagraph: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Company History &amp; Chennai Story</label>
                    <textarea
                      rows={3}
                      value={editableData.settings.aboutSection.story}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            aboutSection: {
                              ...editableData.settings.aboutSection,
                              story: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 leading-relaxed"
                    />
                  </div>

                  {/* 4 Brand Pillars (V-S-H-N) */}
                  <div className="pt-4 border-t">
                    <span className="font-bold uppercase tracking-wider text-xs block mb-3 text-amber-600">
                      The 4 Pillars (V - S - H - N)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {editableData.settings.brandValues.map((val, idx) => (
                        <div key={val.letter} className="p-3 rounded-lg border bg-stone-50 dark:bg-stone-800/60">
                          <div className="font-bold text-amber-600 text-sm mb-1">
                            {val.letter} — {val.title}
                          </div>
                          <textarea
                            rows={2}
                            value={val.description}
                            onChange={(e) => {
                              const newVals = [...editableData.settings.brandValues];
                              newVals[idx] = { ...newVals[idx], description: e.target.value };
                              setEditableData({
                                ...editableData,
                                settings: {
                                  ...editableData.settings,
                                  brandValues: newVals,
                                },
                              });
                            }}
                            className="w-full p-1.5 rounded border bg-white dark:bg-stone-900 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 8. CONTACT & SETTINGS ================= */}
            {activeTab === 'contact' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    Contact Details &amp; Business Information
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage phone numbers, Google Maps directions, office address, and social channel links.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1">Business Phone Number</label>
                    <input
                      type="text"
                      value={editableData.settings.phone}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, phone: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">WhatsApp Number (Without Country Code)</label>
                    <input
                      type="text"
                      value={editableData.settings.whatsapp}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, whatsapp: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editableData.settings.email}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, email: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Working Hours</label>
                    <input
                      type="text"
                      value={editableData.settings.businessHours}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, businessHours: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Physical Office Address</label>
                    <input
                      type="text"
                      value={editableData.settings.address}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, address: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Google Maps Direction URL</label>
                    <input
                      type="text"
                      value={editableData.settings.googleMapsUrl}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: { ...editableData.settings, googleMapsUrl: e.target.value },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 font-mono text-[11px]"
                    />
                  </div>

                  {/* Socials */}
                  <div>
                    <label className="font-bold block mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={editableData.settings.socials.instagram}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            socials: { ...editableData.settings.socials, instagram: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">YouTube Channel URL</label>
                    <input
                      type="text"
                      value={editableData.settings.socials.youtube}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            socials: { ...editableData.settings.socials, youtube: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 font-mono text-[11px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Threads URL</label>
                    <input
                      type="text"
                      value={editableData.settings.socials.threads}
                      onChange={(e) =>
                        setEditableData({
                          ...editableData,
                          settings: {
                            ...editableData.settings,
                            socials: { ...editableData.settings.socials, threads: e.target.value },
                          },
                        })
                      }
                      className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= 9. TESTIMONIALS ================= */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                      Testimonials &amp; Customer Reviews
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Manage client reviews displayed on the website.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newT: Testimonial = {
                        id: 'test-' + Date.now(),
                        clientName: 'New Client Name',
                        location: 'Chennai',
                        projectTitle: 'Residential House Construction',
                        review: 'Excellent turnkey construction quality and punctual delivery by VSHN Builders.',
                        rating: 5,
                        isPublished: true,
                        isDemo: false,
                        date: 'Recently',
                      };
                      setEditableData({
                        ...editableData,
                        testimonials: [newT, ...editableData.testimonials],
                      });
                      setEditingTestimonial(newT);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 font-bold text-stone-950 text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Testimonial</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editableData.testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{t.clientName}</h4>
                          <span className="text-xs text-amber-500">{'★'.repeat(t.rating)}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">{t.projectTitle} · {t.location}</p>
                        <p className="text-xs text-stone-700 dark:text-stone-300 italic">"{t.review}"</p>
                      </div>

                      <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
                        <button
                          onClick={() => setEditingTestimonial(t)}
                          className="text-amber-600 font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setEditableData({
                              ...editableData,
                              testimonials: editableData.testimonials.filter((item) => item.id !== t.id),
                            });
                            showToast('success', `Review from "${t.clientName}" removed. Click Publish Live to save.`);
                          }}
                          className="text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Testimonial Dialog */}
                {editingTestimonial && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm">Edit Testimonial</h3>
                        <button onClick={() => setEditingTestimonial(null)}>
                          <X className="w-5 h-5 text-stone-400" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold block mb-1">Client Name</label>
                          <input
                            type="text"
                            value={editingTestimonial.clientName}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Location</label>
                          <input
                            type="text"
                            value={editingTestimonial.location}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Project Reference</label>
                          <input
                            type="text"
                            value={editingTestimonial.projectTitle}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, projectTitle: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1">Review Text</label>
                          <textarea
                            rows={3}
                            value={editingTestimonial.review}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, review: e.target.value })}
                            className="w-full p-2 rounded border bg-stone-50 dark:bg-stone-800"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t flex justify-end gap-2">
                        <button onClick={() => setEditingTestimonial(null)} className="px-3 py-1.5 rounded border text-xs">
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setEditableData({
                              ...editableData,
                              testimonials: editableData.testimonials.map((item) =>
                                item.id === editingTestimonial.id ? editingTestimonial : item
                              ),
                            });
                            setEditingTestimonial(null);
                            showToast('success', 'Testimonial updated in draft.');
                          }}
                          className="px-4 py-1.5 rounded bg-amber-500 font-bold text-stone-950 text-xs"
                        >
                          Apply to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 10. CUSTOMER ENQUIRIES ================= */}
            {activeTab === 'enquiries' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                    Customer Enquiries &amp; Consultation Leads
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Direct submissions from the public website consultation form and cost estimator.
                  </p>
                </div>

                {enquiries.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-xl border">
                    <p className="text-xs text-stone-500">No customer enquiries received yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enquiries.map((enq) => (
                      <div
                        key={enq.id}
                        className="p-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{enq.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                enq.status === 'new'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : enq.status === 'contacted'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {enq.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                            <span>Phone: <strong className="text-stone-900 dark:text-stone-100">{enq.phone}</strong></span>
                            <span>Location: <strong>{enq.plotLocation}</strong></span>
                            {enq.preferredPackage && <span>Package: <strong>{enq.preferredPackage}</strong></span>}
                            {enq.estimatedSqFt && <span>Area: <strong>{enq.estimatedSqFt} sq.ft</strong></span>}
                          </div>

                          <p className="text-xs text-stone-700 dark:text-stone-300 italic pt-1">
                            "{enq.message}"
                          </p>

                          <span className="text-[10px] text-stone-400 block pt-1">
                            Received {new Date(enq.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`tel:${enq.phone.replace(/\s+/g, '')}`}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-800 text-white text-xs font-semibold"
                          >
                            Call
                          </a>

                          <a
                            href={`https://wa.me/91${enq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${enq.name}, thank you for contacting VSHN Builders regarding your construction project in ${enq.plotLocation}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                          >
                            WhatsApp
                          </a>

                          <select
                            value={enq.status}
                            onChange={(e) => updateEnquiryStatus(enq.id, e.target.value as any)}
                            className="p-1.5 text-xs rounded border bg-stone-50 dark:bg-stone-800"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="resolved">Resolved</option>
                          </select>

                          <button
                            onClick={async () => {
                              await deleteEnquiry(enq.id);
                              showToast('success', 'Enquiry record deleted.');
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= 11. ACCOUNT SECURITY ================= */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 max-w-md">
                <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mb-2">
                  Administrator Password Security
                </h2>
                <p className="text-xs text-stone-500 mb-6">
                  Change the admin account password. Server will re-salt and hash using PBKDF2.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currPass}
                      onChange={(e) => setCurrPass(e.target.value)}
                      placeholder="Current password"
                      className="w-full p-2.5 rounded-lg border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full p-2.5 rounded-lg border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full p-2.5 rounded-lg border bg-stone-50 dark:bg-stone-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs"
                  >
                    Update Admin Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Bottom Quick Action Bar for Easy Publishing from Any Tab */}
      {activeTab !== 'dashboard' && activeTab !== 'security' && (
        <div className="fixed bottom-4 right-6 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl flex items-center gap-3">
          <span className="hidden md:inline text-xs font-semibold text-stone-600 dark:text-stone-300 pl-2">
            Admin Actions:
          </span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving || isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing Live...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Publish Live to Website</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Publish Success Celebration Modal */}
      {showPublishSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                Website Published Successfully!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                All your changes have been written to the persistent database and are now live for all visitors across Chennai and Tamil Nadu.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPublishSuccessModal(false);
                  onPreviewSite();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>View Live Website Now</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPublishSuccessModal(false)}
                className="py-3 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors"
              >
                Continue in Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                Reset Demo Defaults?
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                This will reset all project details, construction packages, services, and company information back to the official VSHN Builders Chennai baseline defaults.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Yes, Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
