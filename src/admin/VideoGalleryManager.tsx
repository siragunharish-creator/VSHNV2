import React, { useState } from 'react';
import {
  Film,
  Play,
  Youtube,
  Instagram,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  X,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { VideoGalleryItem, WebsiteContent } from '../shared/types.ts';
import { useContent } from '../context/ContentContext.tsx';
import { ImagePickerField } from '../components/ImagePickerField.tsx';

interface VideoGalleryManagerProps {
  editableData: WebsiteContent;
  setEditableData: React.Dispatch<React.SetStateAction<WebsiteContent>>;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

/**
 * Normalizes and extracts platform details from raw video URLs
 */
function parseAndValidateVideoUrl(rawUrl: string, explicitPlatform: 'auto' | 'youtube' | 'instagram' | string): {
  isValid: boolean;
  platform: 'youtube' | 'instagram';
  cleanUrl: string;
  videoId?: string;
  error?: string;
} {
  const url = rawUrl.trim();
  if (!url) return { isValid: false, platform: 'youtube', cleanUrl: '', error: 'URL cannot be empty' };

  // Detect platform
  let detectedPlatform: 'youtube' | 'instagram' = 'youtube';
  if (explicitPlatform === 'instagram' || url.toLowerCase().includes('instagram.com')) {
    detectedPlatform = 'instagram';
  } else if (explicitPlatform === 'youtube' || url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be')) {
    detectedPlatform = 'youtube';
  } else if (explicitPlatform === 'auto') {
    return {
      isValid: false,
      platform: 'youtube',
      cleanUrl: url,
      error: 'Could not auto-detect platform. Please enter a valid YouTube or Instagram URL.',
    };
  }

  if (detectedPlatform === 'youtube') {
    // Normalization for YouTube: watch, youtu.be, shorts, embed
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);

    const videoId = watchMatch?.[1] || shortMatch?.[1] || shortsMatch?.[1] || embedMatch?.[1];

    if (!videoId) {
      return {
        isValid: false,
        platform: 'youtube',
        cleanUrl: url,
        error: 'Invalid YouTube URL. Please provide a standard YouTube video, Shorts, or youtu.be link.',
      };
    }

    return {
      isValid: true,
      platform: 'youtube',
      cleanUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
    };
  }

  if (detectedPlatform === 'instagram') {
    // Normalization for Instagram: reel, p, tv
    const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    const code = igMatch?.[1];

    if (!code) {
      return {
        isValid: false,
        platform: 'instagram',
        cleanUrl: url,
        error: 'Invalid Instagram URL. Please provide a post or Reel URL (e.g. instagram.com/reel/XYZ/).',
      };
    }

    return {
      isValid: true,
      platform: 'instagram',
      cleanUrl: `https://www.instagram.com/reel/${code}/`,
      videoId: code,
    };
  }

  return { isValid: false, platform: 'youtube', cleanUrl: url, error: 'Unsupported URL format' };
}

export const VideoGalleryManager: React.FC<VideoGalleryManagerProps> = ({
  editableData,
  setEditableData,
  showToast,
}) => {
  const { content, publishContent } = useContent();

  const videos: VideoGalleryItem[] = editableData.videoGallery || [];

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'youtube' | 'instagram'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'published' | 'hidden'>('all');

  // Modal / Form state for Add or Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState<'auto' | 'youtube' | 'instagram' | string>('auto');
  const [formOrientation, setFormOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [formDescription, setFormDescription] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(videos.length + 1);
  const [formError, setFormError] = useState<string | null>(null);

  // Interactive Preview State
  const [previewVideo, setPreviewVideo] = useState<VideoGalleryItem | null>(null);

  // Delete Confirmation State
  const [videoToDelete, setVideoToDelete] = useState<VideoGalleryItem | null>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormUrl('');
    setFormPlatform('auto');
    setFormOrientation('landscape');
    setFormDescription('');
    setFormThumbnail('');
    setFormIsPublished(true);
    setFormOrder(videos.length + 1);
    setFormError(null);
    setEditingVideoId(null);
  };

  // Open modal for new video
  const handleOpenAdd = () => {
    resetForm();
    setFormOrder(videos.length + 1);
    setIsModalOpen(true);
  };

  // Open modal to edit existing video
  const handleOpenEdit = (v: VideoGalleryItem) => {
    setEditingVideoId(v.id);
    setFormTitle(v.title);
    setFormUrl(v.url);
    setFormPlatform(v.platform);

    const isPort =
      v.orientation === 'portrait' ||
      v.aspectRatio === 'portrait' ||
      v.aspectRatio === '9:16' ||
      (v.orientation !== 'landscape' && v.url?.toLowerCase().includes('/shorts/'));

    setFormOrientation(isPort ? 'portrait' : 'landscape');
    setFormDescription(v.description || '');
    setFormThumbnail(v.thumbnailUrl || '');
    setFormIsPublished(v.isPublished);
    setFormOrder(v.displayOrder);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handler for URL input change that auto-selects portrait for YouTube Shorts
  const handleUrlChange = (newUrl: string) => {
    setFormUrl(newUrl);
    if (newUrl.toLowerCase().includes('/shorts/')) {
      setFormOrientation('portrait');
    }
  };

  // Submit form (add or update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Please enter a video title.');
      return;
    }

    const parseRes = parseAndValidateVideoUrl(formUrl, formPlatform);
    if (!parseRes.isValid) {
      setFormError(parseRes.error || 'Invalid video URL.');
      return;
    }

    let defaultThumb = formThumbnail.trim();
    if (!defaultThumb && parseRes.platform === 'youtube' && parseRes.videoId) {
      defaultThumb = `https://img.youtube.com/vi/${parseRes.videoId}/hqdefault.jpg`;
    }

    if (editingVideoId) {
      // Update existing video
      const updatedList = videos.map((v) =>
        v.id === editingVideoId
          ? {
              ...v,
              title: formTitle.trim(),
              url: parseRes.cleanUrl,
              platform: parseRes.platform,
              orientation: formOrientation,
              aspectRatio: (formOrientation === 'portrait' ? '9:16' : '16:9') as any,
              description: formDescription.trim() || undefined,
              thumbnailUrl: defaultThumb || undefined,
              isPublished: formIsPublished,
              displayOrder: formOrder,
              updatedAt: new Date().toISOString(),
            }
          : v
      );
      // Sort by display order
      updatedList.sort((a, b) => a.displayOrder - b.displayOrder);
      setEditableData({ ...editableData, videoGallery: updatedList });
      if (showToast) showToast('success', 'Video details updated in list.');
    } else {
      // Add new video
      const newVideo: VideoGalleryItem = {
        id: 'vid-' + Date.now(),
        title: formTitle.trim(),
        url: parseRes.cleanUrl,
        platform: parseRes.platform,
        orientation: formOrientation,
        aspectRatio: (formOrientation === 'portrait' ? '9:16' : '16:9') as any,
        description: formDescription.trim() || undefined,
        thumbnailUrl: defaultThumb || undefined,
        isPublished: formIsPublished,
        displayOrder: formOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = [...videos, newVideo].sort((a, b) => a.displayOrder - b.displayOrder);
      setEditableData({ ...editableData, videoGallery: updatedList });
      if (showToast) showToast('success', 'New video added to gallery.');
    }

    setIsModalOpen(false);
    resetForm();
  };

  // 1-Click quick toggle between Landscape and Portrait from card
  const handleToggleOrientation = (id: string) => {
    const updated = videos.map((v) => {
      if (v.id === id) {
        const currentlyPortrait =
          v.orientation === 'portrait' ||
          v.aspectRatio === 'portrait' ||
          v.aspectRatio === '9:16' ||
          (v.orientation !== 'landscape' && v.url?.toLowerCase().includes('/shorts/'));
        const next: 'landscape' | 'portrait' = currentlyPortrait ? 'landscape' : 'portrait';
        return {
          ...v,
          orientation: next,
          aspectRatio: (next === 'portrait' ? '9:16' : '16:9') as any,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });
    setEditableData({ ...editableData, videoGallery: updated });
    const target = updated.find((v) => v.id === id);
    if (showToast) {
      showToast(
        'info',
        `Orientation changed to ${target?.orientation === 'portrait' ? 'Portrait (9:16 Shorts)' : 'Landscape (16:9) Standard'}. Click "Save & Publish" to commit.`
      );
    }
  };

  // Toggle publish / hide
  const handleTogglePublish = (id: string) => {
    const updated = videos.map((v) => (v.id === id ? { ...v, isPublished: !v.isPublished } : v));
    setEditableData({ ...editableData, videoGallery: updated });
    if (showToast) showToast('info', 'Video visibility status toggled.');
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!videoToDelete) return;
    const updated = videos.filter((v) => v.id !== videoToDelete.id);
    setEditableData({ ...editableData, videoGallery: updated });
    setVideoToDelete(null);
    if (showToast) showToast('success', 'Video deleted.');
  };

  // Move video up or down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const list = [...videos];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-assign displayOrder sequential 1, 2, 3...
    const normalized = list.map((v, i) => ({ ...v, displayOrder: i + 1 }));
    setEditableData({ ...editableData, videoGallery: normalized });
  };

  // Save changes to backend and Supabase
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await publishContent(editableData);
      if (res.success) {
        setSaveSuccess(true);
        if (showToast) showToast('success', 'Video Gallery changes saved and published live!');
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        if (showToast) showToast('error', res.error || 'Failed to save video gallery.');
      }
    } catch (err: any) {
      if (showToast) showToast('error', err.message || 'Error saving video gallery.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered video list
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || v.platform === platformFilter;
    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'published' && v.isPublished) ||
      (visibilityFilter === 'hidden' && !v.isPublished);

    return matchesSearch && matchesPlatform && matchesVisibility;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>Video Content</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Video Gallery Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Showcase real construction-site videos, completed turnkey house designs, walkthroughs, YouTube videos, and Instagram Reels. Add as many videos as you need.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-950 flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Video</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-950 font-bold" />
                <span>Saved &amp; Published!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Video Gallery successfully updated!</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Published videos are now live on the public website and stored in your Supabase database.
            </p>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search videos by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
          >
            <option value="all">All Platforms ({videos.length})</option>
            <option value="youtube">YouTube Only ({videos.filter((v) => v.platform === 'youtube').length})</option>
            <option value="instagram">Instagram Only ({videos.filter((v) => v.platform === 'instagram').length})</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
          >
            <option value="all">All Visibility</option>
            <option value="published">Published ({videos.filter((v) => v.isPublished).length})</option>
            <option value="hidden">Hidden ({videos.filter((v) => !v.isPublished).length})</option>
          </select>
        </div>
      </div>

      {/* Video Cards Grid / Table */}
      {filteredVideos.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
          <Film className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No videos found</h3>
          <p className="text-xs text-stone-500">
            {searchTerm || platformFilter !== 'all' || visibilityFilter !== 'all'
              ? 'Try adjusting your search filters or click "Add New Video" above.'
              : 'Add your first construction video to showcase on the website.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video, idx) => {
            return (
              <div
                key={video.id}
                className={`flex flex-col justify-between bg-white dark:bg-stone-900 rounded-xl border transition-all ${
                  video.isPublished
                    ? 'border-stone-200 dark:border-stone-800 shadow-xs'
                    : 'border-dashed border-stone-300 dark:border-stone-700 opacity-75'
                }`}
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div className="relative aspect-video bg-stone-950 rounded-t-xl overflow-hidden group">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-600 bg-stone-900">
                        <Film className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-stone-950/30" />

                    {/* Platform & Orientation Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-md">
                        <Youtube className="w-3 h-3 fill-white" />
                        <span>YouTube</span>
                      </span>

                      {/* Orientation Quick-Toggle Badge */}
                      {(() => {
                        const isPortrait =
                          video.orientation === 'portrait' ||
                          video.aspectRatio === 'portrait' ||
                          video.aspectRatio === '9:16' ||
                          (video.orientation !== 'landscape' && video.url?.toLowerCase().includes('/shorts/'));
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleOrientation(video.id);
                            }}
                            title="Click to toggle between Landscape (16:9) and Portrait (9:16 Shorts)"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold shadow-md transition-all hover:scale-105 cursor-pointer ${
                              isPortrait
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80'
                            }`}
                          >
                            {isPortrait ? (
                              <>
                                <Smartphone className="w-3 h-3" />
                                <span>Portrait (9:16)</span>
                              </>
                            ) : (
                              <>
                                <Monitor className="w-3 h-3" />
                                <span>Landscape (16:9)</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded bg-stone-900/80 text-white text-[10px] font-mono font-bold">
                        #{video.displayOrder}
                      </span>
                    </div>

                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewVideo(video)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500/90 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      title="Preview video playback"
                    >
                      <Play className="w-5 h-5 fill-stone-950 ml-0.5" />
                    </button>
                  </div>

                  {/* Video Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-2">
                        {video.title}
                      </h4>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          video.isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-stone-500/10 text-stone-500'
                        }`}
                      >
                        {video.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </div>

                    {video.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}

                    <div className="text-[11px] text-stone-400 truncate">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 font-mono text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{video.url}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-stone-50 dark:bg-stone-950/40 rounded-b-xl border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1 text-xs">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredVideos.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(video.id)}
                      className={`p-1.5 rounded transition-colors ${
                        video.isPublished
                          ? 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                          : 'text-amber-600 bg-amber-500/10'
                      }`}
                      title={video.isPublished ? 'Hide from public website' : 'Publish on public website'}
                    >
                      {video.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(video)}
                      className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                      title="Edit video"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setVideoToDelete(video)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-red-600"
                      title="Delete video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  {editingVideoId ? 'Edit Video Details' : 'Add New Video to Gallery'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Tondiarpet G+2 Luxury Villa Handover Walkthrough"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold"
                />
              </div>

              {/* Video URL & Platform Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-700 dark:text-stone-300">
                  YouTube Video Link or Direct Video URL *
                </label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/... or https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono"
                />

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-stone-500 font-semibold">Platform:</span>
                  {(['auto', 'youtube'] as const).map((plat) => (
                    <label key={plat} className="inline-flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="radio"
                        name="videoPlatform"
                        value={plat}
                        checked={formPlatform === plat}
                        onChange={() => setFormPlatform(plat)}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span className="capitalize">{plat === 'auto' ? 'Auto-Detect' : 'YouTube'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Orientation / Aspect Ratio: Landscape vs Portrait (Shorts) */}
              <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 dark:text-stone-200 text-xs">
                    Display Format / Orientation *
                  </label>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    formOrientation === 'portrait'
                      ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-800'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800'
                  }`}>
                    {formOrientation === 'portrait' ? '9:16 Portrait (Shorts)' : '16:9 Landscape (Standard)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormOrientation('landscape')}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formOrientation === 'landscape'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 ring-2 ring-amber-500/30 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${formOrientation === 'landscape' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>Landscape (16:9)</span>
                        {formOrientation === 'landscape' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5 leading-tight">
                        Standard horizontal video
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormOrientation('portrait')}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      formOrientation === 'portrait'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 text-stone-900 dark:text-stone-100 ring-2 ring-purple-500/30 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${formOrientation === 'portrait' ? 'bg-purple-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        <span>Portrait (9:16)</span>
                        {formOrientation === 'portrait' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5 leading-tight">
                        YouTube Shorts / Reels
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Highlights the concrete slab reinforcement, foundation detailing, and finishing craft."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                />
              </div>

              {/* Custom Thumbnail */}
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700 dark:text-stone-300">
                  Custom Thumbnail URL (Optional)
                </label>
                <ImagePickerField
                  label="Thumbnail Image"
                  value={formThumbnail}
                  onChange={(url) => setFormThumbnail(url)}
                  category="exterior"
                  aspectRatio="video"
                  helperText="Leave empty for YouTube to auto-fetch the high-res thumbnail cover."
                />
              </div>

              {/* Settings: Published & Display Order */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value || '1', 10))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono font-bold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      Publish Live
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md cursor-pointer"
                >
                  {editingVideoId ? 'Update Video' : 'Add Video to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Video Preview Modal */}
      {previewVideo && (() => {
        const isPortrait = previewVideo.orientation === 'portrait' ||
          previewVideo.aspectRatio === 'portrait' ||
          previewVideo.aspectRatio === '9:16' ||
          (previewVideo.orientation !== 'landscape' && previewVideo.url?.toLowerCase().includes('/shorts/'));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in">
            <div className={`w-full ${isPortrait ? 'max-w-sm' : 'max-w-2xl'} bg-stone-900 text-white rounded-2xl border border-stone-800 shadow-2xl overflow-hidden`}>
              <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {previewVideo.platform === 'youtube' ? (
                    <Youtube className="w-5 h-5 text-red-500" />
                  ) : (
                    <Instagram className="w-5 h-5 text-pink-500" />
                  )}
                  <h3 className="text-sm font-bold truncate max-w-xs">{previewVideo.title}</h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isPortrait ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'bg-stone-800 text-stone-300'
                  }`}>
                    {isPortrait ? '9:16 Portrait' : '16:9 Landscape'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`relative ${isPortrait ? 'aspect-[9/16] max-h-[560px] mx-auto' : 'aspect-video'} bg-black flex items-center justify-center`}>
              {previewVideo.platform === 'youtube' ? (
                (() => {
                  const match = previewVideo.url.match(/[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|shorts\/([a-zA-Z0-9_-]{11})/);
                  const id = match ? match[1] || match[2] || match[3] : null;
                  return id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1`}
                      title={previewVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <p className="text-xs text-stone-400">Could not extract YouTube video ID.</p>
                  );
                })()
              ) : (
                (() => {
                  const match = previewVideo.url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
                  const code = match ? match[1] : null;
                  return code ? (
                    <iframe
                      src={`https://www.instagram.com/p/${code}/embed/captioned/`}
                      title={previewVideo.title}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400">
                      <p>Instagram Post / Reel: {previewVideo.url}</p>
                      <a
                        href={previewVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 underline mt-2 block"
                      >
                        Open on Instagram
                      </a>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="p-4 bg-stone-900 flex items-center justify-between text-xs">
              <span className="text-stone-400 truncate max-w-sm">{previewVideo.description || previewVideo.url}</span>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Delete Video from Gallery?
              </h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to remove <strong>"{videoToDelete.title}"</strong>? This will remove it from the public video gallery.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVideoToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Yes, Delete Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
