import React, { useState } from 'react';
import { Eye, MapPin, Maximize2, Layers, Calendar, ChevronRight, X, MessageCircle, Check } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { Project } from '../shared/types.ts';

export const ProjectsSection: React.FC = () => {
  const { content } = useContent();
  const { projects, settings } = content;
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [modalActiveImage, setModalActiveImage] = useState<string>('');
  const [modalTab, setModalTab] = useState<'photos' | 'floorplans' | '3d'>('photos');

  const categories = ['All', 'Residential Villa', 'Independent House', 'Duplex'];

  const filteredProjects = projects.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const openProjectModal = (proj: Project) => {
    setActiveProject(proj);
    setModalActiveImage(proj.coverImage);
    setModalTab('photos');
  };

  return (
    <section id="projects" className="py-20 bg-stone-50 dark:bg-stone-950 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Portfolio of Excellence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Featured Chennai Homes &amp; Villas
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Explore turnkey residences engineered with structural mastery, refined finishes, and tailored space planning.
          </p>
        </div>

        {/* Filter Tabs (Interactive Segmented Control per anti-slop guidelines) */}
        <div className="flex items-center justify-center mb-12 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-stone-900 rounded-xl border border-stone-300/60 dark:border-stone-800">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-stone-900 rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-lg transition-all group flex flex-col"
            >
              {/* Image Preview with Hover Overlay */}
              <div
                className="relative h-60 overflow-hidden bg-stone-200 dark:bg-stone-800 cursor-pointer"
                onClick={() => openProjectModal(project)}
              >
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Status indicator (Unboxed text) */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-stone-950/80 backdrop-blur-xs text-[11px] font-semibold text-white">
                  {project.category} · {project.status}
                </div>

                {project.packageUsed && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-amber-500 text-stone-950 text-[11px] font-bold shadow-xs">
                    {project.packageUsed} Package
                  </div>
                )}

                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/90 text-stone-950 font-bold text-xs shadow-md">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Project &amp; Gallery</span>
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{project.location}, {project.city}</span>
                  </div>

                  <h3
                    onClick={() => openProjectModal(project)}
                    className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
                  >
                    {project.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mb-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Metadata Specs (Zero-pill text format with dots) */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">{project.builtUpArea} sq.ft</span>
                    <span aria-hidden="true">·</span>
                    <span>{project.floors}</span>
                    <span aria-hidden="true">·</span>
                    <span>{project.completionYear}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openProjectModal(project)}
                    className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1"
                  >
                    <span>Full Gallery &amp; Plans</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent(
                      `Hello VSHN Builders, I am interested in your project: "${project.title}" in ${project.location}. Can we build something similar?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Enquire on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl relative p-5 sm:p-8">
            {/* Close Button */}
            <button
              onClick={() => setActiveProject(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-10 p-2 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="pr-10 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <span>{activeProject.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeProject.location}, {activeProject.city}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-serif">
                {activeProject.title}
              </h3>
            </div>

            {/* Gallery Tabs (Photos, Floorplans, 3D Design) */}
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setModalTab('photos');
                  setModalActiveImage(activeProject.coverImage);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  modalTab === 'photos'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Photos ({activeProject.galleryImages?.length || 1})
              </button>

              {activeProject.floorPlanImages && activeProject.floorPlanImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('floorplans');
                    setModalActiveImage(activeProject.floorPlanImages![0]);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    modalTab === 'floorplans'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  Floor Plans ({activeProject.floorPlanImages.length})
                </button>
              )}

              {activeProject.threeDDesignImages && activeProject.threeDDesignImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setModalTab('3d');
                    setModalActiveImage(activeProject.threeDDesignImages![0]);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    modalTab === '3d'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  3D Visualization ({activeProject.threeDDesignImages.length})
                </button>
              )}
            </div>

            {/* Active Display Image */}
            <div className="relative h-64 sm:h-96 rounded-xl overflow-hidden bg-stone-950 mb-4">
              <img
                src={modalActiveImage || activeProject.coverImage}
                alt={activeProject.title}
                className="w-full h-full object-contain sm:object-cover"
              />
            </div>

            {/* Thumbnail Strip */}
            {modalTab === 'photos' && activeProject.galleryImages && activeProject.galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                {activeProject.galleryImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setModalActiveImage(img)}
                    className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      modalActiveImage === img ? 'border-amber-500 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Specifications Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 mb-6 text-xs">
              <div>
                <span className="text-stone-500 dark:text-stone-400 block font-medium">Built-up Area</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{activeProject.builtUpArea} sq.ft</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block font-medium">Floors</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{activeProject.floors}</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block font-medium">Handover Year</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{activeProject.completionYear}</span>
              </div>
              <div>
                <span className="text-stone-500 dark:text-stone-400 block font-medium">Package Executed</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{activeProject.packageUsed || 'Deluxe'}</span>
              </div>
            </div>

            {/* Description & Key Features */}
            <div className="space-y-4 mb-6">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeProject.description}
              </p>

              {activeProject.keyFeatures && activeProject.keyFeatures.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-stone-500 dark:text-stone-400 tracking-wider mb-2">
                    Key Engineering &amp; Architectural Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeProject.keyFeatures.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/91${settings.whatsapp}?text=${encodeURIComponent(
                  `Hello VSHN Builders, I am looking to construct a home in Chennai inspired by "${activeProject.title}" (${activeProject.builtUpArea} sq.ft). Please share details.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire About Similar Construction on WhatsApp</span>
              </a>

              <a
                href="#contact"
                onClick={() => setActiveProject(null)}
                className="py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm text-center shadow-md transition-colors"
              >
                Book Site Consultation
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
