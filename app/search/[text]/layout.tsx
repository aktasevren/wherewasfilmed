import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasfilmed.com';

type Props = {
  params: Promise<{ text: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { text } = await params;
  const searchText = typeof text === 'string' ? text : '';
  const decoded = searchText ? decodeURIComponent(searchText) : '';
  const title = decoded
    ? `Search: "${decoded}" | Where Was It Filmed`
    : 'Search | Where Was It Filmed';
  const description = decoded
    ? `Search results for "${decoded}" — find filming locations for movies.`
    : 'Search for movie filming locations.';

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
      title: `${title} | Where Was It Filmed`,
      description,
      url: searchText ? `${siteUrl}/search/${encodeURIComponent(searchText)}` : `${siteUrl}/search`,
      siteName: 'Where Was It Filmed',
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
