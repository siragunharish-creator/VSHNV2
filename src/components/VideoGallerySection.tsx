import React, { useState } from 'react';
import { Play, Youtube, Instagram, ExternalLink, Sparkles, Film, Pause } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { VideoGalleryItem } from '../shared/types.ts';

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Watch parameter
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be short URL
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // shorts
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Embed URL
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Extracts Instagram shortcode from post or reel URL
 */
function extractInstagramCode(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export const VideoGallerySection: React.FC = () => {
  const { content } = useContent();
  const { videoGallery = [], settings } = content;

  // Filter only published videos and sort by displayOrder
  const publishedVideos = (videoGallery || [])
    .filter((v) => v.isPublished !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'instagram'>('all');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const displayedVideos = publishedVideos.filter((v) => {
    if (activeTab === 'all') return true;
    return v.platform === activeTab;
  });

  const handleTogglePlay = (videoId: string) => {
    // Only one video plays at a time
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
    } else {
      setPlayingVideoId(videoId);
    }
  };

  return (
    <section id="videos" data-section="videos" className="py-20 bg-stone-100/60 dark:bg-stone-900/40 border-b border-stone-200/80 dark:border-stone-800/80 scroll-mt-20 relative">
      {/* Anchor aliases for #video and legacy #media-showcase */}
      <span id="video" className="absolute -top-24 left-0 pointer-events-none" aria-hidden="true" />
      <span id="media-showcase" className="absolute -top-24 left-0 pointer-events-none" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>VSHN Builders Videos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Real Site Walkthroughs &amp; Reels
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            Experience our turnkey home construction in action across Chennai — from foundation reinforcement to turnkey house handovers.
          </p>

          {/* Platform Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setPlayingVideoId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
              }`}
            >
              All Videos ({publishedVideos.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('youtube');
                setPlayingVideoId(null);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'youtube'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube ({publishedVideos.filter((v) => v.platform === 'youtube').length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('instagram');
                setPlayingVideoId(null);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'instagram'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
              }`}
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram Reels ({publishedVideos.filter((v) => v.platform === 'instagram').length})</span>
            </button>
          </div>
        </div>

        {/* Video Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        {displayedVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedVideos.map((video) => {
              const isPlaying = playingVideoId === video.id;
              const ytId = video.platform === 'youtube' ? extractYouTubeId(video.url) : null;
              const igCode = video.platform === 'instagram' ? extractInstagramCode(video.url) : null;
              const isShorts = video.url.includes('/shorts/') || video.platform === 'instagram';

              const fallbackThumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop';
              const thumbnailSrc = video.thumbnailUrl || fallbackThumb;

              return (
                <div
                  key={video.id}
                  className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Media Frame with Responsive Aspect Ratio */}
                  <div
                    className={`relative w-full bg-stone-950 overflow-hidden flex items-center justify-center ${
                      isShorts ? 'aspect-[9/16] max-h-[460px]' : 'aspect-video'
                    }`}
                  >
                    {isPlaying ? (
                      video.platform === 'youtube' && ytId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      ) : video.platform === 'instagram' && igCode ? (
                        <iframe
                          src={`https://www.instagram.com/p/${igCode}/embed/captioned/`}
                          title={video.title}
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="p-6 text-center text-stone-300">
                          <p className="text-xs">Playing video...</p>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-amber-400 underline mt-2 block"
                          >
                            Open directly on platform
                          </a>
                        </div>
                      )
                    ) : (
                      <>
                        <img
                          src={thumbnailSrc}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-stone-950/20 transition-colors" />

                        {/* Interactive Play Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(video.id)}
                          aria-label={`Play video: ${video.title}`}
                          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-500/90 text-stone-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 hover:bg-amber-400 transition-all cursor-pointer z-10"
                        >
                          <Play className="w-6 h-6 fill-stone-950 ml-0.5" />
                        </button>
                      </>
                    )}

                    {/* Platform Badge */}
                    <div className="absolute top-3 left-3 z-20 pointer-events-none">
                      {video.platform === 'youtube' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-bold shadow-md backdrop-blur-xs">
                          <Youtube className="w-3 h-3 fill-white" />
                          <span>YouTube</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold shadow-md backdrop-blur-xs">
                          <Instagram className="w-3 h-3" />
                          <span>Instagram Reel</span>
                        </span>
                      )}
                    </div>

                    {/* Stop / Pause control if currently playing */}
                    {isPlaying && (
                      <button
                        type="button"
                        onClick={() => setPlayingVideoId(null)}
                        title="Close player"
                        className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-stone-900/80 text-white hover:bg-stone-900 text-xs shadow-lg transition-all"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(video.id)}
                        className="font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isPlaying ? 'Pause Video' : 'Watch Inline'}</span>
                      </button>

                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>{video.platform === 'youtube' ? 'YouTube' : 'Instagram'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <Film className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No videos published yet</h3>
            <p className="text-xs text-stone-500 mt-1">Add your YouTube and Instagram site walk videos in the Admin Console.</p>
          </div>
        )}

        {/* Channel Links Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href={settings.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Youtube className="w-4 h-4 fill-white" />
            <span>Visit Official YouTube Channel</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <a
            href={settings.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Instagram className="w-4 h-4" />
            <span>Follow @vshn_builders on Instagram</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>
    </section>
  );
};
