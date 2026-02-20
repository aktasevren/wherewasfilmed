'use client';

import Link from 'next/link';
import AppHeader from '@/app/components/AppHeader';
import Footer from '@/app/components/Footer';
import { getAllBlogPosts } from './posts';

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="home-page bg-background-dark text-white min-h-screen flex flex-col">
      <AppHeader />
      <main className="pt-24 flex-1">
        <div className="blog-hero relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" aria-hidden />
          <section className="relative max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/90 mb-4">
              Blog
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
              Film Locations &amp; Movie Travel Guides
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Deep dives into iconic filming locations, set‑jetting tips and behind‑the‑scenes stories
              from the world of movie geography.
            </p>
          </section>
        </div>

        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16" aria-label="Blog articles">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="blog-card group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
              >
                <Link href={`/blog/${post.slug}`} className="block h-full flex flex-col">
                  <div className="blog-card-image h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-5xl opacity-40 group-hover:opacity-60 transition-opacity" aria-hidden>
                      🎬
                    </span>
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-white/50 mb-2">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {post.readingTime}
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-white/60 text-sm leading-relaxed line-clamp-3 flex-1">
                      {post.description}
                    </p>
                    {post.tags?.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <li key={tag} className="text-[10px] uppercase tracking-wider text-white/40">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

