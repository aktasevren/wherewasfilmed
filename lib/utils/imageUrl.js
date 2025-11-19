// Maskelenmiş görsel URL utility fonksiyonu
export const getImageUrl = (posterPath, size = 'original') => {
  if (!posterPath) return null;
  
  // Server-side'da proxy üzerinden, client-side'da direkt
  if (typeof window === 'undefined') {
    return `/api/image?path=${encodeURIComponent(posterPath)}&size=${size}`;
  }
  
  // Client-side'da da proxy kullan (daha güvenli)
  return `/api/image?path=${encodeURIComponent(posterPath)}&size=${size}`;
};
