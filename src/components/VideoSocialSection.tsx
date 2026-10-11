import React, { useState } from 'react';
import { Play, Instagram, Youtube, ExternalLink, Sparkles, Volume2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

/**
 * Helper to extract YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  
  // Standard watch?v=
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=0&rel=0`;
  }

  // youtu.be short url
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=0&rel=0`;
  }

  // shorts
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=0&rel=0`;
  }

  // already embed
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }

  return null;
}

/**
 * Helper to extract Instagram post / reel ID or convert to embed format
 */
function getInstagramEmbedUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // match instagram.com/p/CODE or /reel/CODE or /tv/CODE
  const match = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.instagram.com/p/${match[1]}/embed/captioned/`;
  }

  return null;
}

export const VideoSocialSection: React.FC = () => {
  const { content } = useContent();
  const { settings } = content;
  const featured = settings.featuredMedia || {
    youtubeVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    instagramPostUrl: 'https://www.instagram.com/p/DF2N8c5z0fL/',
    title: 'Site Walkthrough & Construction Highlights',
    subtitle: 'Watch our real Chennai site tour videos and follow our construction stories on YouTube and Instagram.',
  };

  const youtubeEmbed = getYouTubeEmbedUrl(featured.youtubeVideoUrl);
  const instagramEmbed = getInstagramEmbedUrl(featured.instagramPostUrl);

  const [activeMediaTab, setActiveMediaTab] = useState<'both' | 'youtube' | 'instagram'>('both');

  return (
    <section id="media-showcase" className="py-20 bg-stone-100/70 dark:bg-stone-900/40 border-b border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Watch Us In Action</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            {featured.title || 'YouTube & Instagram Site Showcase'}
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            {featured.subtitle || 'See our engineering precision, on-site concrete pours, and turnkey handover ceremonies.'}
          </p>

          {/* Social Links Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <a
              href={settings.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Youtube className="w-4 h-4" />
              <span>Subscribe on YouTube</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <a
              href={settings.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Instagram className="w-4 h-4" />
              <span>Follow on Instagram</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>

        {/* Video & Social Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* YouTube Video Column */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Featured YouTube Video
                  </h3>
                  <span className="text-[11px] text-stone-500 block">
                    Play directly on site or open on YouTube
                  </span>
                </div>
              </div>

              {featured.youtubeVideoUrl && (
                <a
                  href={featured.youtubeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  <span>Open Video</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-stone-950 flex items-center justify-center">
              {youtubeEmbed ? (
                <iframe
                  src={youtubeEmbed}
                  title="VSHN Builders YouTube Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="text-center p-8 text-stone-400 space-y-2">
                  <Youtube className="w-12 h-12 mx-auto text-red-500 opacity-80" />
                  <p className="text-sm font-medium">Add a YouTube video link in the Admin Console to play here.</p>
                  <p className="text-xs text-stone-500">Supports standard watch links, youtu.be, or shorts</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 text-xs text-stone-600 dark:text-stone-400 bg-stone-50/30 dark:bg-stone-900/30 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span>Construction progress documentation &amp; architectural walkthroughs</span>
              <span className="text-[11px] font-semibold text-amber-600">Updated by VSHN Admin</span>
            </div>
          </div>

          {/* Instagram Embed / Feed Column */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/60 dark:bg-stone-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Instagram Reels &amp; Highlights
                  </h3>
                  <span className="text-[11px] text-stone-500 block">
                    @vshn_builders on Instagram
                  </span>
                </div>
              </div>

              <a
                href={featured.instagramPostUrl || settings.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
              >
                <span>View Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Instagram Embed Frame */}
            <div className="relative min-h-[420px] max-h-[520px] w-full bg-stone-100 dark:bg-stone-950 flex items-center justify-center overflow-hidden">
              {instagramEmbed ? (
                <iframe
                  src={instagramEmbed}
                  title="VSHN Builders Instagram Post"
                  className="w-full h-[480px] border-0"
                  scrolling="no"
                  allowTransparency
                />
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-1 mx-auto shadow-lg">
                    <div className="w-full h-full bg-white dark:bg-stone-900 rounded-full flex items-center justify-center text-pink-500">
                      <Instagram className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Follow @vshn_builders
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                      Daily site stories, floor layouts, elevation reveals, and client reviews on our official Instagram feed.
                    </p>
                  </div>
                  <a
                    href={settings.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <span>Open Instagram Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 text-xs text-stone-600 dark:text-stone-400 bg-stone-50/30 dark:bg-stone-900/30 border-t border-stone-100 dark:border-stone-800 text-center">
              <span>Follow for ongoing site updates in Anna Nagar, Tondiarpet &amp; across Chennai</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
