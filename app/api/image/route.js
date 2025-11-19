import { NextResponse } from 'next/server';

// TMDB görsel servisi endpoint'i (maskelenmiş)
const getImageServiceUrl = (path, size = 'original') => {
  const baseUrl = 'https://image.tmdb.org';
  const imagePath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/t/p/${size}${imagePath}`;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const size = searchParams.get('size') || 'original';

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Geçerli size değerlerini kontrol et
    const validSizes = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
    const imageSize = validSizes.includes(size) ? size : 'original';

    const imageUrl = getImageServiceUrl(path, imageSize);

    // Görseli proxy üzerinden getir
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
