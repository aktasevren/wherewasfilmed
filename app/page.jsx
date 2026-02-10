'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Searchbar from './components/Searchbar';
import AppHeader from './components/AppHeader';
import Footer from './components/Footer';
import { IconTrendingUp, IconLocationOn, IconVideocam } from './components/Icons';
import { encodeMovieId } from '@/lib/movieId';

const MAX_RECENT = 10;

export default function Home() {
  const [popular, setPopular] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    fetch('/api/searches?type=popular&limit=8')
      .then((res) => res.ok ? res.json() : { popular: [] })
      .then((data) => {
        if (Array.isArray(data?.popular)) setPopular(data.popular);
      })
      .catch(() => setPopular([]));
  }, []);

  useEffect(() => {
    fetch(`/api/searches?type=recent&limit=${MAX_RECENT}`)
      .then((res) => res.ok ? res.json() : { recent: [] })
      .then((data) => {
        if (Array.isArray(data?.recent)) setRecent(data.recent.slice(0, MAX_RECENT));
      })
      .catch(() => setRecent([]));
  }, []);

  const trendingItems = (popular || []).map((item) => {
    const rawTitle = item.title?.trim();
    const displayTitle =
      rawTitle && rawTitle !== 'Unknown title' ? rawTitle : (item.movieId || '');
    return {
      title: displayTitle,
      href: `/movie/${encodeMovieId(item.movieId)}`,
    };
  });

  const recentItems = (recent || []).slice(0, MAX_RECENT).map((item) => {
    const rawTitle = item.title?.trim();
    const displayTitle =
      rawTitle && rawTitle !== 'Unknown title' ? rawTitle : (item.movieId || '');
    return {
      title: displayTitle,
      href: `/movie/${encodeMovieId(item.movieId)}`,
    };
  });

  return (
    <div className="home-page bg-background-dark text-white selection:bg-primary/30 min-h-screen flex flex-col">
      <AppHeader />

      <main className="pt-24 flex-1">
        <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 overflow-visible">
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          </div>
          <div className="text-center mb-12 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-tight">
              Discover where the magic happened.
            </h1>
            <p className="text-white/40 text-lg md:text-xl font-light">
              Explore real-life filming locations from thousands of movies and TV shows across the globe.
            </p>
          </div>

          <Searchbar variant="hero" />

          {trendingItems.length > 0 && (
            <div className="w-full max-w-6xl px-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-accent-gold">
                  <IconTrendingUp size={22} className="text-xl" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Trending Searches</h3>
              </div>
              <div className="marquee-row py-3">
                <div className="marquee-inner">
                  {[...trendingItems, ...trendingItems].map((item, i) => (
                    <span key={`${item.href}-${item.title}-${i}`} className="marquee-item">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full pl-3 pr-6 py-2 cursor-pointer transition-all chip-glow no-underline text-white text-sm font-medium whitespace-nowrap"
                      >
                        <IconLocationOn size={20} className="text-primary flex-shrink-0" />
                        {item.title}
                      </Link>
                      {i < trendingItems.length * 2 - 1 && (
                        <span className="marquee-sep text-white/40">◆</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {recentItems.length > 0 && (
            <div className="w-full max-w-6xl px-4 mt-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-white/60">
                  <IconLocationOn size={18} className="text-lg" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">Recent Searches</h3>
              </div>
              <div className="marquee-row py-2">
                <div className="marquee-inner" style={{ animationDuration: '50s' }}>
                  {[...recentItems, ...recentItems].map((item, i) => (
                    <span key={`${item.href}-${item.title}-${i}`} className="marquee-item">
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-2.5 pr-5 py-1.5 cursor-pointer transition-all no-underline text-white/90 text-sm font-medium whitespace-nowrap"
                      >
                        {item.title}
                      </Link>
                      {i < recentItems.length * 2 - 1 && (
                        <span className="marquee-sep text-white/30">•</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/20">
                <span className="text-xs font-bold uppercase tracking-widest">Global Community</span>
              </div>
              <h2 className="text-sm md:text-base font-bold leading-tight">
                Join 50k+ users who have discovered 12,000+ filming locations.
              </h2>
              <p className="text-white/50 text-xl leading-relaxed">
                Our community is the heart of the discovery experience. From the neon streets of Tokyo to the rolling
                hills of New Zealand, thousands of film enthusiasts are mapping cinematic history together.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-accent-gold">12k+</p>
                  <p className="text-sm text-white/40 uppercase tracking-widest">Verified Locations</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-accent-gold">50k+</p>
                  <p className="text-sm text-white/40 uppercase tracking-widest">Active Members</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-6 relative group">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale contrast-[1.2] brightness-50"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-60" />
                <div className="absolute inset-0 map-vignette pointer-events-none" />
                <div className="absolute top-1/4 left-1/3">
                  <div className="relative flex flex-col items-center group/pin cursor-pointer">
                    <div className="bg-accent-gold p-1.5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)] text-black">
                      <IconVideocam size={18} />
                    </div>
                    <div className="absolute top-10 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold whitespace-nowrap">Skyfall - London</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-2/3">
                  <div className="relative flex flex-col items-center group/pin cursor-pointer">
                    <div className="bg-accent-gold p-1.5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)] text-black">
                      <IconVideocam size={18} />
                    </div>
                    <div className="absolute top-10 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold whitespace-nowrap">The King&apos;s Speech</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-1/3 left-1/4">
                  <div className="relative flex flex-col items-center group/pin cursor-pointer">
                    <div className="bg-accent-gold p-1.5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)] text-black">
                      <IconVideocam size={18} />
                    </div>
                    <div className="absolute top-10 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold whitespace-nowrap">Harry Potter</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <h2 className="text-center text-sm font-bold uppercase tracking-[0.3em] text-white/50 mb-14">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Search a movie or show</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                Type the name of any film or series and pick from the suggestions.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Explore filming locations</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                See where each scene was shot on the map with pins and region highlights.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Plan your visit</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                Use the list and map to plan trips to real-world filming locations.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
