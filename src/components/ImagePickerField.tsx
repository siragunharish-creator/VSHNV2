import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check, RefreshCw, Eye, AlertCircle, Link } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { MediaItem } from '../shared/types.ts';

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category?: MediaItem['category'];
  helperText?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  className?: string;
}

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label,
  value,
  onChange,
  category = 'exterior',
  helperText,
  aspectRatio = 'video',
  className = '',
}) => {
  const { content, uploadImage } = useContent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Preloaded static images + uploaded media library images combined
  const allAvailableImages: MediaItem[] = [
    // Preloaded static brand and portfolio images
    {
      id: 'preloaded-logo',
      url: '/vshn-logo.svg',
      title: 'VSHN Builders Brand Logo',
      altText: 'Official VSHN Builders vector brand logo',
      category: 'branding',
      uploadedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'preloaded-hero',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
      title: 'Contemporary Luxury Villa (Hero)',
      altText: 'Modern residential villa in Chennai with warm lighting',
      category: 'exterior',
      uploadedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'preloaded-villa-2',
      url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop',
      title: 'Anna Nagar Luxury Villa Facade',
      altText: 'Modern white and stone facade residential villa',
      category: 'exterior',
      uploadedAt: '2025-01-02T00:00:00.000Z',
    },
    {
      id: 'preloaded-duplex',
      url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1600&auto=format&fit=crop',
      title: 'ECR Sea Breeze Tropical Duplex',
      altText: 'Beachside modern duplex villa architecture',
      category: 'exterior',
      uploadedAt: '2025-01-03T00:00:00.000Z',
    },
    {
      id: 'preloaded-urban',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
      title: 'Velachery Urban Smart Residence',
      altText: 'Compact modern independent house',
      category: 'exterior',
      uploadedAt: '2025-01-04T00:00:00.000Z',
    },
    {
      id: 'preloaded-interior-1',
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop',
      title: 'Double-Height Living Room Interior',
      altText: 'Spacious interior hall with contemporary furniture',
      category: 'interior',
      uploadedAt: '2025-01-05T00:00:00.000Z',
    },
    {
      id: 'preloaded-interior-2',
      url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=1600&auto=format&fit=crop',
      title: 'Designer Dining & Modular Kitchen',
      altText: 'Modern luxury kitchen and dining layout',
      category: 'interior',
      uploadedAt: '2025-01-06T00:00:00.000Z',
    },
    {
      id: 'preloaded-blueprint',
      url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1600&auto=format&fit=crop',
      title: 'Architectural 2D Blueprint',
      altText: 'Architectural floor plans and dimensioned layout',
      category: 'floor_plan',
      uploadedAt: '2025-01-07T00:00:00.000Z',
    },
    {
      id: 'preloaded-3d',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
      title: '3D House Elevation Rendering',
      altText: 'Photorealistic 3D visualization render',
      category: '3d_render',
      uploadedAt: '2025-01-08T00:00:00.000Z',
    },
    {
      id: 'preloaded-site',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=1200&auto=format&fit=crop',
      title: 'Turnkey Construction Site Work',
      altText: 'Civil construction site execution in Chennai',
      category: 'site_work',
      uploadedAt: '2025-01-09T00:00:00.000Z',
    },
    {
      id: 'preloaded-renov',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
      title: 'Home Renovation & Remodeling',
      altText: 'Structural retrofit and remodeling site',
      category: 'exterior',
      uploadedAt: '2025-01-10T00:00:00.000Z',
    },
    // User uploaded media from database
    ...(content.mediaLibrary || []).filter(
      (item) => !item.id.startsWith('preloaded-')
    ),
  ];

  // Aspect ratio helper classes
  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    auto: 'h-48',
  }[aspectRatio];

  // Handle local file selection from computer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // 1. Validate file type
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isExtensionValid = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extension || '');

    if (!validTypes.includes(file.type) && !isExtensionValid) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, or SVG).');
      return;
    }

    // 2. Validate file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please select a smaller image.');
      return;
    }

    // 3. Show instant local preview
    const reader = new FileReader();
    reader.onload = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 4. Perform upload to server
    setIsUploading(true);
    setUploadProgress(30);

    try {
      setUploadProgress(70);
      const res = await uploadImage(file, {
        title: file.name,
        category,
        altText: file.name,
      });

      setUploadProgress(100);
      setIsUploading(false);

      if (res.success && res.url) {
        onChange(res.url);
        setLocalPreview(null);
      } else {
        setErrorMessage(res.error || 'Failed to upload image. Please try again.');
        setLocalPreview(null);
      }
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Network error during image upload.');
      setLocalPreview(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered media library images
  const filteredLibraryImages = allAvailableImages.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    return item.category === activeCategoryFilter;
  });

  // Handle selecting an image from the library
  const handleConfirmLibrarySelection = () => {
    if (selectedLibraryImage) {
      onChange(selectedLibraryImage);
      setIsMediaLibraryOpen(false);
      setSelectedLibraryImage(null);
    }
  };

  const displayImage = localPreview || value;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Helper */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-500 hover:text-rose-700 font-medium transition-colors"
          >
            Remove Image
          </button>
        )}
      </div>

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Image Preview Box or Empty Dropzone */}
      <div className="relative rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-50 dark:bg-stone-900/60 shadow-xs">
        {displayImage ? (
          <div className="relative group">
            <div className={`w-full ${aspectClass} overflow-hidden bg-stone-950 flex items-center justify-center`}>
              <img
                src={displayImage}
                alt={label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                onError={(e) => {
                  // Fallback for broken image
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload New</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLibraryImage(value);
                  setIsMediaLibraryOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Select from Library</span>
              </button>
            </div>

            {/* Badge showing current URL / filename */}
            <div className="p-2.5 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-mono text-[11px] text-stone-600 dark:text-stone-400">
                {displayImage}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 p-1"
                  title="Edit direct URL"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-600 font-semibold hover:underline text-[11px]"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State Dropzone */
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                No image selected for {label}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Upload from your computer or choose from preloaded architectural library
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Computer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMediaLibraryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Browse Media Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Loading Progress Bar */}
        {isUploading && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-10 animate-in fade-in">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mb-2" />
            <p className="text-xs font-bold">Uploading &amp; Persisting to Server...</p>
            <div className="w-48 bg-stone-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress || 60}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Direct URL Input Toggle */}
      {showUrlInput && (
        <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center gap-2 text-xs">
          <input
            type="text"
            value={customUrlInput}
            onChange={(e) => setCustomUrlInput(e.target.value)}
            placeholder="Paste direct image URL (e.g. https://... or /uploads/...)"
            className="flex-1 p-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-[11px]"
          />
          <button
            type="button"
            onClick={() => {
              if (customUrlInput.trim()) {
                onChange(customUrlInput.trim());
                setShowUrlInput(false);
                setCustomUrlInput('');
              }
            }}
            className="px-3 py-1.5 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-bold text-xs"
          >
            Apply
          </button>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          {helperText}
        </p>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHOOSE FROM MEDIA LIBRARY (Preloaded + Uploaded Gallery)           */}
      {/* ========================================================================= */}
      {isMediaLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  <span>Select Image for {label}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Choose from preloaded architectural assets or your uploaded media
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMediaLibraryOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filters Bar */}
            <div className="px-5 py-2.5 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {[
                { id: 'all', label: `All (${allAvailableImages.length})` },
                { id: 'exterior', label: 'Exterior Facades' },
                { id: 'interior', label: 'Interiors' },
                { id: 'floor_plan', label: 'Floor Plans' },
                { id: '3d_render', label: '3D Renders' },
                { id: 'branding', label: 'Branding & Logo' },
                { id: 'site_work', label: 'Site Works' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeCategoryFilter === tab.id
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredLibraryImages.map((img) => {
                  const isSelected = selectedLibraryImage === img.url || (!selectedLibraryImage && value === img.url);
                  return (
                    <div
                      key={img.id}
                      onClick={() => setSelectedLibraryImage(img.url)}
                      onDoubleClick={() => {
                        onChange(img.url);
                        setIsMediaLibraryOpen(false);
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-stone-100 dark:bg-stone-800 flex flex-col ${
                        isSelected
                          ? 'border-amber-500 ring-4 ring-amber-500/20 shadow-md scale-98'
                          : 'border-transparent hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-stone-950 relative">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-stone-950/80 text-[10px] text-stone-300 font-medium">
                          {img.category}
                        </span>
                      </div>

                      <div className="p-2 bg-white dark:bg-stone-900 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {img.title}
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono truncate mt-0.5">
                          {img.url.startsWith('/') ? img.url : img.url.slice(0, 32) + '...'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer with Selection Actions */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-stone-500 truncate">
                {selectedLibraryImage ? (
                  <span>Selected: <strong className="font-mono text-stone-800 dark:text-stone-200">{selectedLibraryImage}</strong></span>
                ) : (
                  <span>Click an image to preview, double-click to instantly apply.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMediaLibraryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLibrarySelection}
                  disabled={!selectedLibraryImage}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  Confirm Image Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
