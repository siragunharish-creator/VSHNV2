import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebsiteContent, ContactSubmission, ActivityLog, MediaItem } from '../shared/types.ts';
import { initialWebsiteContent } from '../server/defaultData.ts';
import { useAuth } from './AuthContext.tsx';

interface ContentContextType {
  content: WebsiteContent;
  draftContent: WebsiteContent | null;
  enquiries: ContactSubmission[];
  activities: ActivityLog[];
  isLoading: boolean;
  isSaving: boolean;
  saveMessage: string | null;
  refreshContent: () => Promise<void>;
  saveDraft: (updated: WebsiteContent) => Promise<{ success: boolean; error?: string }>;
  publishContent: (updated: WebsiteContent) => Promise<{ success: boolean; error?: string }>;
  uploadImage: (
    fileOrBase64: File | { base64: string; name: string },
    metadata?: { title?: string; category?: MediaItem['category']; altText?: string }
  ) => Promise<{ success: boolean; url?: string; error?: string }>;
  deleteMedia: (id: string) => Promise<boolean>;
  submitContactForm: (data: {
    name: string;
    phone: string;
    email?: string;
    plotLocation: string;
    serviceNeeded: string;
    estimatedSqFt?: number;
    preferredPackage?: string;
    budgetRange?: string;
    message: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateEnquiryStatus: (id: string, status: 'new' | 'contacted' | 'resolved', notes?: string) => Promise<boolean>;
  deleteEnquiry: (id: string) => Promise<boolean>;
  resetToDefaults: () => Promise<{ success: boolean; message?: string }>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const STORAGE_KEY_CONTENT = 'vshn_published_content';
const STORAGE_KEY_DRAFT = 'vshn_draft_content';
const STORAGE_KEY_ENQUIRIES = 'vshn_enquiries';
const STORAGE_KEY_ACTIVITIES = 'vshn_activities';

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<WebsiteContent>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONTENT);
    return saved ? JSON.parse(saved) : initialWebsiteContent;
  });

  const [draftContent, setDraftContent] = useState<WebsiteContent | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
    return saved ? JSON.parse(saved) : null;
  });

  const [enquiries, setEnquiries] = useState<ContactSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ENQUIRIES);
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Helper to log activities
  const logActivity = (action: string, details: string) => {
    const newAct: ActivityLog = {
      id: 'act-' + Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(updated));
  };

  const refreshContent = async () => {
    // Content is already synchronized locally
  };

  // Save Draft (Local)
  const saveDraft = async (updated: WebsiteContent) => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(updated));
      setDraftContent(updated);
      logActivity('Draft Saved', 'Updated website content draft');
      setSaveMessage('Draft saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Live (Local)
  const publishContent = async (updated: WebsiteContent) => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY_CONTENT, JSON.stringify(updated));
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      setContent(updated);
      setDraftContent(null);
      logActivity('Published Changes', 'Applied changes to the live site');
      setSaveMessage('Changes published live to website!');
      setTimeout(() => setSaveMessage(null), 4000);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Upload image (Converts to Data URL so no backend storage needed!)
  const uploadImage = async (
    fileOrBase64: File | { base64: string; name: string },
    metadata?: { title?: string; category?: MediaItem['category']; altText?: string }
  ) => {
    try {
      let dataUrl = '';
      let title = metadata?.title || 'Uploaded Image';

      if (fileOrBase64 instanceof File) {
        title = fileOrBase64.name;
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(fileOrBase64);
        });
      } else {
        dataUrl = fileOrBase64.base64;
        title = fileOrBase64.name;
      }

      logActivity('Image Uploaded', `Uploaded: ${title}`);
      return { success: true, url: dataUrl };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteMedia = async (id: string) => {
    logActivity('Media Removed', `Removed media item ${id}`);
    return true;
  };

  // Customer Contact Form Submission
  const submitContactForm = async (data: any) => {
    try {
      const newEnquiry: ContactSubmission = {
        id: 'enq-' + Date.now(),
        ...data,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      const updated = [newEnquiry, ...enquiries];
      setEnquiries(updated);
      localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(updated));
      logActivity('New Lead', `Lead received from ${data.name} (${data.phone})`);
      return { success: true, message: 'Thank you! Your enquiry has been received.' };
    } catch (err: any) {
      return { success: false, error: 'Failed to record enquiry' };
    }
  };

  const updateEnquiryStatus = async (id: string, status: 'new' | 'contacted' | 'resolved') => {
    const updated = enquiries.map((e) => (e.id === id ? { ...e, status } : e));
    setEnquiries(updated);
    localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(updated));
    return true;
  };

  const deleteEnquiry = async (id: string) => {
    const updated = enquiries.filter((e) => e.id !== id);
    setEnquiries(updated);
    localStorage.setItem(STORAGE_KEY_ENQUIRIES, JSON.stringify(updated));
    return true;
  };

  // Reset to default baseline data
  const resetToDefaults = async () => {
    localStorage.removeItem(STORAGE_KEY_CONTENT);
    localStorage.removeItem(STORAGE_KEY_DRAFT);
    setContent(initialWebsiteContent);
    setDraftContent(null);
    logActivity('Reset Data', 'Reset all fields to default values');
    return { success: true, message: 'Website reset to official defaults' };
  };

  return (
    <ContentContext.Provider
      value={{
        content,
        draftContent,
        enquiries,
        activities,
        isLoading,
        isSaving,
        saveMessage,
        refreshContent,
        saveDraft,
        publishContent,
        uploadImage,
        deleteMedia,
        submitContactForm,
        updateEnquiryStatus,
        deleteEnquiry,
        resetToDefaults,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
