// Helper function to generate metadata for movie pages
export async function generateMovieMetadata(movieId) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';
    const title = `Filming Locations`;
    const description =
      'Discover where your favorite movies and series were filmed. Find every filming location on an interactive map.';
    const imageUrl = `${siteUrl}/assets/film.png`;
    const keywords = [
      'movie filming locations',
      'series filming locations',
      'where was it filmed',
      'filming locations map',
      'film locations',
      'location finder'
    ];

    return {
      title,
      description: description,
      keywords: keywords,
      openGraph: {
        title: `Filming Locations | Where Was Filmed`,
        description: description,
        url: `${siteUrl}/movie/${movieId}`,
        siteName: "Where Was Filmed",
        images: [
          {
            url: imageUrl,
            width: 500,
            height: 750,
            alt: `Filming Locations poster`,
          },
        ],
        type: "website",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `Filming Locations`,
        description: description.substring(0, 200),
        images: [imageUrl],
      },
      alternates: {
        canonical: `${siteUrl}/movie/${movieId}`,
      },
      other: {
        'movie:release_date': '',
        'movie:genre': '',
      },
    };
  } catch (error) {
    console.error('Error generating movie metadata:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://where-was-filmed.vercel.app';
    return {
      title: "Filming Locations",
      description: "Discover where your favorite movies and series were filmed on an interactive map.",
      alternates: {
        canonical: movieId ? `${siteUrl}/movie/${movieId}` : siteUrl,
      },
    };
  }
}

