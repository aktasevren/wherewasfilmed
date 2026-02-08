'use client';

import Link from 'next/link';
import React from 'react';
import { encodeMovieId } from '@/lib/movieId';

const currentYear = new Date().getFullYear();

const TOP_10_FILMING_LOCATIONS = [
  { title: 'The Godfather', id: 'tt0068646' },
  { title: 'The Shawshank Redemption', id: 'tt0111161' },
  { title: 'The Dark Knight', id: 'tt0468569' },
  { title: 'Inception', id: 'tt1375666' },
  { title: 'Interstellar', id: 'tt0816692' },
  { title: 'Star Wars', id: 'tt0076759' },
  { title: 'Harry Potter and the Philosopher\'s Stone', id: 'tt0241527' },
  { title: 'The Lord of the Rings: The Fellowship of the Ring', id: 'tt0120737' },
  { title: 'Titanic', id: 'tt0120338' },
  { title: 'Forrest Gump', id: 'tt0109830' },
];

const POPULAR_MOVIES = [
  { title: 'The Matrix', id: 'tt0133093' },
  { title: 'Gladiator', id: 'tt0172495' },
  { title: 'Skyfall', id: 'tt1074638' },
  { title: 'The King\'s Speech', id: 'tt1504320' },
  { title: 'La La Land', id: 'tt3783958' },
];

export default function Footer() {
  return (
    <footer className="footer-wrapper border-t border-white/5 bg-background-dark" role="contentinfo">
      <div className="footer-divider" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
              Top 10 Filming Locations
            </h3>
            <nav aria-label="Top 10 filming locations">
              <ul className="space-y-2">
                {TOP_10_FILMING_LOCATIONS.map(({ title, id }) => (
                  <li key={id}>
                    <Link
                      href={`/movie/${encodeMovieId(id)}`}
                      className="text-white/70 hover:text-primary text-sm transition-colors"
                    >
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
              Popular Movies
            </h3>
            <nav aria-label="Popular movies">
              <ul className="space-y-2">
                {POPULAR_MOVIES.map(({ title, id }) => (
                  <li key={id}>
                    <Link
                      href={`/movie/${encodeMovieId(id)}`}
                      className="text-white/70 hover:text-primary text-sm transition-colors"
                    >
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-white/60 text-sm max-w-xs">
              Discover where movies and TV shows were filmed. Explore real filming locations around the world.
            </p>
          </div>
        </div>
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">
            © {currentYear} Where Was It Filmed. All rights reserved.
          </p>
          <nav className="flex gap-8 text-[10px] uppercase tracking-[0.2em]" aria-label="Legal">
            <Link href="/privacy" className="text-white/50 hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-white/50 hover:text-primary transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
