import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [content, setContent] = useState<WebsiteContent>(initialWebsiteContent);
  const [draftContent, setDraftContent] = useState<WebsiteContent | null>(null);
  const [enquiries, setEnquiries] = useState<ContactSubmission[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch content function
  const refreshContent = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated && token) {
        // Fetch full admin data
        const res = await fetch('/api/admin/data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setContent(data.published || initialWebsiteContent);
          setDraftContent(data.draft || null);
          setEnquiries(data.enquiries || []);
          setActivities(data.activities || []);
          setIsLoading(false);
          return;
        }
      }

      // Public content fallback
      const pubRes = await fetch('/api/content');
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        setContent(pubData);
      }
    } catch (err) {
      console.warn('Using client fallback default data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  // Save Draft
  const saveDraft = async (updated: WebsiteContent): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Unauthorized' };
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: updated, isPublish: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');
      setDraftContent(updated);
      setSaveMessage('Draft saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
      await refreshContent();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Content
  const publishContent = async (updated: WebsiteContent): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Unauthorized' };
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: updated, isPublish: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish changes');
      setContent(updated);
      setDraftContent(null);
      setSaveMessage('Changes published live to website!');
      setTimeout(() => setSaveMessage(null), 4000);
      await refreshContent();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Upload image
  const uploadImage = async (
    fileOrBase64: File | { base64: string; name: string },
    metadata?: { title?: string; category?: MediaItem['category']; altText?: string }
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      let res: Response;
      if (fileOrBase64 instanceof File) {
        const formData = new FormData();
        formData.append('image', fileOrBase64);
        if (metadata?.title) formData.append('title', metadata.title);
        if (metadata?.category) formData.append('category', metadata.category);
        if (metadata?.altText) formData.append('altText', metadata.altText);

        res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64: fileOrBase64.base64,
            name: fileOrBase64.name,
            title: metadata?.title || fileOrBase64.name,
            category: metadata?.category || 'exterior',
            altText: metadata?.altText,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Image upload failed' };
      }

      await refreshContent();
      return { success: true, url: data.url };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Delete media
  const deleteMedia = async (id: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Public contact submission
  const submitContactForm = async (data: any): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Submission failed' };
      }
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to submit enquiry' };
    }
  };

  // Update enquiry
  const updateEnquiryStatus = async (id: string, status: 'new' | 'contacted' | 'resolved', notes?: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Delete enquiry
  const deleteEnquiry = async (id: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Reset to default authentic data
  const resetToDefaults = async (): Promise<{ success: boolean; message?: string }> => {
    if (!token) return { success: false, message: 'Unauthorized' };
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        await refreshContent();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
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
