import React, { useState } from 'react';
import { Image as ImageIcon, Filter, Maximize2, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

export const GallerySection: React.FC = () => {
  const { content } = useContent();
  const { mediaLibrary, projects } = content;

  // Compile full gallery images from active mediaLibrary items + project gallery images
  const mediaItems = (mediaLibrary || [])
    .filter((m) => m.isActive !== false)
    .map((m) => ({
      id: m.id,
      url: m.url,
      title: m.title || 'Architectural View',
      category: m.category || 'exterior',
      altText: m.altText || m.title || 'VSHN Builders Project',
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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };

  const prevLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <section id="gallery" className="py-20 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Real Site Photography
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Architectural Construction Gallery
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Browse our completed homes, living halls, modular kitchens, structural drawings, and 3D architectural elevations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
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
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <ImageIcon className="w-10 h-10 mx-auto text-stone-400 mb-2" />
            <p className="text-sm">No images in this category yet. Upload new photos in the Admin Console!</p>
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
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop';
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

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
