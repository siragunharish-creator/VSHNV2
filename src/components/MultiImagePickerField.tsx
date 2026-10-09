import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { MediaItem } from '../shared/types.ts';

interface MultiImagePickerFieldProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  category?: MediaItem['category'];
  helperText?: string;
}

export const MultiImagePickerField: React.FC<MultiImagePickerFieldProps> = ({
  label,
  values = [],
  onChange,
  category = 'exterior',
  helperText,
}) => {
  const { content, uploadImage } = useContent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allAvailableImages: MediaItem[] = [
    {
      id: 'preloaded-hero',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
      title: 'Contemporary Luxury Villa (Hero)',
      altText: 'Modern residential villa in Chennai',
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
      title: 'Modern Dining & Kitchen',
      altText: 'Modern dining interior',
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
    ...(content.mediaLibrary || []).filter((item) => !item.id.startsWith('preloaded-')),
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage(`File ${file.name} exceeds 15MB limit.`);
        continue;
      }
      try {
        const res = await uploadImage(file, {
          title: file.name,
          category,
          altText: file.name,
        });
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        }
      } catch (err: any) {
        setErrorMessage(err.message || `Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      onChange([...values, ...uploadedUrls]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImageAt = (index: number) => {
    const updated = [...values];
    updated.splice(index, 1);
    onChange(updated);
  };

  const toggleSelectLibrary = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls(selectedUrls.filter((u) => u !== url));
    } else {
      setSelectedUrls([...selectedUrls, url]);
    }
  };

  const handleConfirmLibrary = () => {
    const newItems = selectedUrls.filter((u) => !values.includes(u));
    onChange([...values, ...newItems]);
    setSelectedUrls([]);
    setIsMediaLibraryOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
          {label} ({values.length} images)
        </label>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        className="hidden"
      />

      {/* Grid of current thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {values.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-video rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900"
          >
            <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImageAt(idx)}
              className="absolute top-1 right-1 p-1 rounded-full bg-stone-950/80 text-white hover:bg-rose-600 transition-colors opacity-80 group-hover:opacity-100"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add Buttons */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="aspect-video rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-900/40 flex flex-col items-center justify-center text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors cursor-pointer text-[11px] p-2"
        >
          {isUploading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <>
              <Upload className="w-4 h-4 mb-1" />
              <span>Upload</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedUrls([]);
            setIsMediaLibraryOpen(true);
          }}
          className="aspect-video rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-900/40 flex flex-col items-center justify-center text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors cursor-pointer text-[11px] p-2"
        >
          <ImageIcon className="w-4 h-4 mb-1" />
          <span>From Library</span>
        </button>
      </div>

      {errorMessage && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
        </p>
      )}

      {helperText && (
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          {helperText}
        </p>
      )}

      {/* Media Library Multi-Select Modal */}
      {isMediaLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Select Multiple Images for {label}</span>
              </h3>
              <button onClick={() => setIsMediaLibraryOpen(false)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allAvailableImages.map((img) => {
                  const isChecked = selectedUrls.includes(img.url) || values.includes(img.url);
                  return (
                    <div
                      key={img.id}
                      onClick={() => toggleSelectLibrary(img.url)}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                          : 'border-transparent hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="aspect-video bg-stone-950 overflow-hidden relative">
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        {isChecked && (
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 text-[10px] font-bold">
                            Selected
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 bg-white dark:bg-stone-900 text-[11px] truncate">
                        {img.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
              <span className="text-xs text-stone-500">
                {selectedUrls.length} images selected to add
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaLibraryOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLibrary}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs"
                >
                  Add Selected to Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
