import { MetadataRoute } from 'next';
import { connect } from '@/lib/db/mongo';
import SearchRecord from '@/lib/db/SearchRecord';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';
const MAX_MOVIE_ENTRIES = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  try {
    const conn = await connect();
    if (!conn) return base;

    const popular = await SearchRecord.aggregate([
      { $group: { _id: '$m', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: MAX_MOVIE_ENTRIES },
      { $project: { movieId: '$_id', _id: 0 } },
    ]);

    const movieEntries = (popular || []).map((item) => ({
      url: `${siteUrl}/movie/${encodeURIComponent(String(item.movieId))}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...base, ...movieEntries];
  } catch {
    return base;
  }
}
