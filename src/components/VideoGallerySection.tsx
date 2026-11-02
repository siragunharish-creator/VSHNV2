import React, { useState } from 'react';
import { Play, Youtube, Sparkles, Film, Pause, Volume2, VolumeX, AlertTriangle, RefreshCw } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { VideoGalleryItem } from '../shared/types.ts';

/**
 * Robust YouTube video ID parser supporting:
 * - standard: https://www.youtube.com/watch?v=VIDEO_ID
 * - short link: https://youtu.be/VIDEO_ID
 * - shorts: https://www.youtube.com/shorts/VIDEO_ID
 * - embed: https://www.youtube.com/embed/VIDEO_ID
 * - mobile: https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // youtube.com/watch?v=ID or &v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Direct 11-char ID check
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const VideoGallerySection: React.FC = () => {
  const { content } = useContent();
  const { videoGallery = [], settings } = content;

  // Filter only published videos and sort by displayOrder
  const publishedVideos = (videoGallery || [])
    .filter((v) => v.isPublished !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Single active video player state (no multiple videos playing simultaneously)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [loadingVideoIds, setLoadingVideoIds] = useState<Record<string, boolean>>({});
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});

  const handleStartPlay = (videoId: string) => {
    if (playingVideoId === videoId) {
      // Toggle pause
      setPlayingVideoId(null);
    } else {
      // Single active video: stop any previously playing video and activate this one
      setLoadingVideoIds((prev) => ({ ...prev, [videoId]: true }));
      setMutedStates((prev) => ({ ...prev, [videoId]: true })); // Autoplay muted by browser policy
      setPlayingVideoId(videoId);
    }
  };

  const handleStopPlay = () => {
    setPlayingVideoId(null);
  };

  const handleIframeLoaded = (videoId: string) => {
    setLoadingVideoIds((prev) => ({ ...prev, [videoId]: false }));
  };

  const toggleMute = (videoId: string) => {
    setMutedStates((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  return (
    <section
      id="videos"
      data-section="videos"
      className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-b border-stone-200/80 dark:border-stone-800/80 scroll-mt-20 relative"
    >
      {/* Anchor aliases for #video and legacy #media-showcase so navigation never fails */}
      <span id="video" className="absolute -top-24 left-0 pointer-events-none" aria-hidden="true" />
      <span id="media-showcase" className="absolute -top-24 left-0 pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>VSHN Builders Site Videos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            Real Site Walkthroughs &amp; Progress
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            Watch our civil engineers and site supervisors in action across Chennai — from earth excavation and column casting to premium interior handovers.
          </p>
        </div>

        {/* Video Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        {publishedVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {publishedVideos.map((video) => {
              const isPlaying = playingVideoId === video.id;
              const isLoading = loadingVideoIds[video.id];
              const isMuted = mutedStates[video.id] ?? true;

              const ytId = extractYouTubeId(video.url);
              const isPortrait =
                video.orientation === 'portrait' ||
                video.aspectRatio === 'portrait' ||
                video.aspectRatio === '9:16' ||
                (video.orientation !== 'landscape' && video.url?.toLowerCase().includes('/shorts/'));
              const isShorts = isPortrait || video.url?.toLowerCase().includes('/shorts/');
              const isDirectVideo =
                !ytId && (video.url?.endsWith('.mp4') || video.url?.endsWith('.webm') || video.platform === 'video');

              // Thumbnail logic: high-res YouTube thumbnail or custom/fallback
              const fallbackThumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop';
              const thumbnailSrc = video.thumbnailUrl || fallbackThumb;

              return (
                <div
                  key={video.id}
                  className="group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Video Player Frame with Responsive Aspect Ratio */}
                  <div
                    className={`relative w-full bg-slate-950 overflow-hidden flex items-center justify-center ${
                      isPortrait ? 'aspect-[9/16] max-h-[560px]' : 'aspect-video'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        {/* Loading State Spinner */}
                        {isLoading && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-white gap-2">
                            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
                            <span className="text-xs font-semibold text-slate-300">Loading video...</span>
                          </div>
                        )}

                        {/* YouTube Player Embed */}
                        {ytId ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${
                              isMuted ? '1' : '0'
                            }&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => handleIframeLoaded(video.id)}
                            className="w-full h-full border-0 z-10"
                          />
                        ) : isDirectVideo ? (
                          /* Direct HTML5 video player */
                          <video
                            src={video.url}
                            controls
                            autoPlay
                            muted={isMuted}
                            playsInline
                            preload="metadata"
                            onLoadedData={() => handleIframeLoaded(video.id)}
                            className="w-full h-full object-cover z-10"
                          />
                        ) : (
                          /* Fallback Message for Invalid/Unavailable URL */
                          <div className="p-6 text-center text-slate-300 z-10 space-y-2">
                            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                            <p className="text-xs font-bold text-white">Video unavailable</p>
                            <p className="text-[11px] text-slate-400 max-w-xs">
                              Please verify the video URL in the Admin Console.
                            </p>
                            <button
                              type="button"
                              onClick={handleStopPlay}
                              className="mt-2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400"
                            >
                              Close Player
                            </button>
                          </div>
                        )}

                        {/* Top Controls Overlay: Pause / Close and Mute / Unmute */}
                        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 pointer-events-auto">
                          {ytId && (
                            <button
                              type="button"
                              onClick={() => toggleMute(video.id)}
                              title={isMuted ? 'Unmute video' : 'Mute video'}
                              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-xs shadow-md transition-all cursor-pointer"
                            >
                              {isMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleStopPlay}
                            title="Stop & Close Player"
                            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-xs shadow-md transition-all cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Poster / Thumbnail with Play Button */
                      <>
                        <img
                          src={thumbnailSrc}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/30 group-hover:via-slate-950/10 transition-colors" />

                        {/* Play Button */}
                        <button
                          type="button"
                          onClick={() => handleStartPlay(video.id)}
                          aria-label={`Play video: ${video.title}`}
                          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                        >
                          <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                        </button>
                      </>
                    )}

                    {/* Platform Badge */}
                    <div className="absolute top-3 left-3 z-20 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/95 text-white text-[10px] font-bold shadow-md backdrop-blur-xs">
                        <Youtube className="w-3.5 h-3.5 fill-white" />
                        <span>{isShorts ? 'YouTube Shorts' : 'YouTube Video'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleStartPlay(video.id)}
                        className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Stop Video</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch Video</span>
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-stone-400 font-medium">
                        Plays inline on site
                      </span>
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
            <p className="text-xs text-stone-500 mt-1">
              Add your YouTube construction walkthrough videos in the Admin Console.
            </p>
          </div>
        )}

        {/* YouTube Channel Banner (No Instagram redirects) */}
        {settings.socials.youtube && (
          <div className="mt-12 flex items-center justify-center">
            <a
              href={settings.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Youtube className="w-4 h-4 fill-white" />
              <span>Subscribe to VSHN Builders on YouTube</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
