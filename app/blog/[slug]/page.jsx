import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppHeader from '@/app/components/AppHeader';
import Footer from '@/app/components/Footer';
import { getAllBlogPosts, getBlogPostBySlug } from '../posts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasfilmed.com';

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return {
      title: 'Film Locations Blog | Where Was It Filmed',
      description: 'Articles about movie filming locations, set‑jetting and film‑inspired travel.',
      alternates: { canonical: `${siteUrl}/blog` },
    };
  }

  const url = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = `${siteUrl}/assets/film.png`;

  return {
    title: post.title,
    description: post.description.substring(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} | Where Was It Filmed`,
      description: post.description.substring(0, 200),
      url,
      siteName: 'Where Was It Filmed',
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | Where Was It Filmed`,
      description: post.description.substring(0, 200),
    },
  };
}

function sanitizeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const isoDate = post.date;
  const readableDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = `${siteUrl}/assets/film.png`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: isoDate,
    dateModified: isoDate,
    image: imageUrl,
    author: { '@type': 'Organization', name: 'Where Was It Filmed', url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'Where Was It Filmed',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/assets/film.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    url: postUrl,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <div className="home-page bg-background-dark text-white min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(breadcrumbLd) }} />
      <AppHeader />
      <main className="pt-24 flex-1">
        <div className="blog-post-hero border-b border-white/5">
          <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-x-2 text-sm text-white/50">
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li aria-hidden>/</li>
                <li className="text-white/80 truncate max-w-[200px] sm:max-w-none" aria-current="page">{post.title}</li>
              </ol>
            </nav>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80 mb-3">
              {readableDate} · {post.readingTime}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              {post.description}
            </p>
            {post.tags?.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5">
                {post.tags.map((tag) => (
                  <li key={tag} className="text-xs uppercase tracking-wider text-white/45 px-3 py-1 rounded-full border border-white/10">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-6 py-10 md:py-14">
          <div className="blog-post-prose text-white/85 text-base sm:text-lg leading-relaxed space-y-6">
            {post.body.map((paragraph, idx) => (
              <p key={idx} className="mb-0">
                {paragraph}
              </p>
            ))}
          </div>

          <footer className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="text-sm text-white/50">
              {post.tags?.length ? post.tags.join(' · ') : null}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/blog" className="text-white/70 hover:text-primary transition-colors inline-flex items-center gap-1">
                ← Back to blog
              </Link>
              <Link href="/" className="text-white/70 hover:text-primary transition-colors">
                Explore filming locations
              </Link>
            </div>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}

