import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasfilmed.com';

export const metadata: Metadata = {
  title: 'Blog — Film Locations & Movie Travel Guides',
  description:
    'Articles about movie filming locations, set-jetting, film tourism, and how to find where your favorite movies were shot. Guides and tips for film location hunters.',
  openGraph: {
    title: 'Blog | Where Was It Filmed',
    description: 'Film locations guides, set-jetting tips, and behind-the-scenes stories from the world of movie geography.',
    url: `${siteUrl}/blog`,
    siteName: 'Where Was It Filmed',
    type: 'website',
    locale: 'en_US',
    images: [{ url: `${siteUrl}/assets/film.png`, width: 1200, height: 630, alt: 'Where Was It Filmed Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Where Was It Filmed',
    description: 'Film locations guides and movie travel tips.',
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  robots: { index: true, follow: true },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
