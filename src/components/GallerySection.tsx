import React, { useState } from 'react';
import { Image as ImageIcon, Filter, Maximize2, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const GallerySection: React.FC = () => {
  const { content, isLoading, refreshContent } = useContent();
  const { mediaLibrary } = content;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compile full gallery images from active mediaLibrary items
  const mediaItems = (mediaLibrary || [])
    .filter((m) => m && m.isActive !== false && m.url)
    .map((m) => ({
      id: m.id || m.url,
      url: m.url,
      title: m.title || 'Architectural View',
      category: m.category || 'exterior',
      altText: m.altText || m.title || 'VSHN Builders Chennai Project',
    }));

  // Categories list
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'exterior', label: 'Exterior Facades' },
    { id: 'interior', label: 'Interiors & Living' },
    { id: 'floor_plan', label: 'Floor Plans' },
    { id: '3d_render', label: '3D Elevations' },
    { id: 'site_work', label: 'On-Site Construction' },
  ];

  const filteredItems = mediaItems.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshContent();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextLightbox = () => {
    if (lightboxIndex === null || filteredItems.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };

  const prevLightbox = () => {
    if (lightboxIndex === null || filteredItems.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <section id="gallery" className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            Real Site Photography & Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Architectural Construction Gallery
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Browse our completed homes, living halls, modular kitchens, structural drawings, and 3D architectural elevations.
          </p>
        </div>

        {/* Action bar: Filter Pills + Refresh Photos */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-2">
          {/* Categories */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sync / Refresh Button */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {filteredItems.length} {filteredItems.length === 1 ? 'photo' : 'photos'}
            </span>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-60"
              title="Refresh gallery to load latest photos from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : 'text-stone-500'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && mediaItems.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-64 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 animate-pulse flex flex-col justify-end p-4"
              >
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-stone-50 dark:bg-stone-950/50 rounded-2xl border border-stone-200 dark:border-stone-800">
            <ImageIcon className="w-12 h-12 mx-auto text-stone-400 mb-3" />
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
              No photos found in this category
            </h3>
            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
              Photos uploaded by the administrator in the Admin Console will appear here automatically.
            </p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Reload Gallery
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openLightbox(idx)}
                className="group relative rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-64 flex flex-col justify-end"
              >
                <img
                  src={item.url}
                  alt={item.altText}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-stone-950/70 backdrop-blur-xs text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                  {item.category.replace('_', ' ')}
                </div>

                {/* Quick Expand Icon */}
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-stone-950/70 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>

                {/* Bottom Details */}
                <div className="relative p-4 z-10 text-white">
                  <h4 className="text-sm font-bold truncate drop-shadow-sm">{item.title}</h4>
                  <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
                    {item.altText || 'VSHN Builders Chennai turnkey construction'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md animate-in fade-in"
            onClick={closeLightbox}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 p-2 text-stone-300 hover:text-white bg-stone-800/80 rounded-full transition-colors cursor-pointer"
                aria-label="Close image lightbox"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Prev / Next controls */}
              <button
                onClick={prevLightbox}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-stone-200 hover:text-white bg-stone-900/80 hover:bg-stone-800 rounded-full transition-colors cursor-pointer shadow-xl z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextLightbox}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-stone-200 hover:text-white bg-stone-900/80 hover:bg-stone-800 rounded-full transition-colors cursor-pointer shadow-xl z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Frame */}
              <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-stone-900 border border-stone-800">
                <img
                  src={filteredItems[lightboxIndex].url}
                  alt={filteredItems[lightboxIndex].title}
                  className="max-h-[75vh] max-w-full object-contain"
                />
              </div>

              {/* Caption */}
              <div className="w-full mt-3 p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {filteredItems[lightboxIndex].title}
                  </h4>
                  <span className="text-xs text-amber-400 capitalize">
                    {filteredItems[lightboxIndex].category.replace('_', ' ')}
                  </span>
                </div>

                <span className="text-xs text-stone-400">
                  {lightboxIndex + 1} of {filteredItems.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
