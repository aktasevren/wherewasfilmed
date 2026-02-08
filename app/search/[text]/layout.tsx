import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';

type Props = {
  params: Promise<{ text: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { text } = await params;
  const searchText = typeof text === 'string' ? text : '';
  const decoded = searchText ? decodeURIComponent(searchText) : '';
  const title = decoded
    ? `Search: "${decoded}" | Where Was Filmed`
    : 'Search | Where Was Filmed';
  const description = decoded
    ? `Search results for "${decoded}" — find filming locations for movies and series.`
    : 'Search for movie and series filming locations.';

  return {
    title,
    description: description.substring(0, 160),
    alternates: {
      canonical: searchText ? `${siteUrl}/search/${encodeURIComponent(searchText)}` : `${siteUrl}/search`,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `${title} | Where Was Filmed`,
      description,
      url: searchText ? `${siteUrl}/search/${encodeURIComponent(searchText)}` : `${siteUrl}/search`,
      siteName: 'Where Was Filmed',
      type: 'website',
      locale: 'en_US',
    },
  };
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
