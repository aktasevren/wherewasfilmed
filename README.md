# Where is This? - Next.js

Film çekim lokasyonlarını bulmak için Next.js ile geliştirilmiş bir web uygulaması.

## Özellikler

- 🎬 Popüler filmleri görüntüleme
- 🔍 Film arama
- 🗺️ Film çekim lokasyonlarını haritada görüntüleme
- 💾 MongoDB ile lokasyon cache'leme
- 🎨 Modern ve responsive tasarım

## Teknolojiler

- **Next.js 16** (App Router)
- **React 19**
- **Redux Toolkit** - State management
- **MongoDB** - Veritabanı
- **Leaflet** - Harita görselleştirme
- **Bootstrap** - UI framework
- **TMDB API** - Film verileri
- **IMDB API** - Çekim lokasyonları
- **Geoapify API** - Geocoding

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repo-url>
cd where-is-this-nextjs
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env.local` dosyası oluşturun ve gerekli API anahtarlarını ekleyin:
```bash
# Proje root dizininde .env.local dosyası oluşturun
touch .env.local
```

`.env.local` dosyasına şu içeriği ekleyin:
```env
TMDB_API_KEY=your_tmdb_api_key_here
GEOAPIFY_API_KEY=your_geoapify_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

**API Key'lerini Nasıl Alırsınız:**
- **TMDB API Key**: https://www.themoviedb.org/settings/api adresinden ücretsiz API key alabilirsiniz
- **Geoapify API Key**: https://www.geoapify.com/get-started-with-maps-api adresinden ücretsiz API key alabilirsiniz
- **MongoDB URI**: MongoDB Atlas'tan veya lokal MongoDB bağlantı string'iniz

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Yapı

```
where-is-this-nextjs/
├── app/
│   ├── api/              # API routes (backend)
│   │   ├── popular-movies/
│   │   ├── movie/[id]/
│   │   ├── search-movie/
│   │   └── imdbid/[id]/
│   ├── components/       # React component'leri
│   ├── movie/[id]/       # Film detay sayfası
│   ├── search/[text]/    # Arama sonuçları sayfası
│   └── page.jsx          # Ana sayfa
├── lib/
│   ├── mongodb.js        # MongoDB bağlantısı
│   └── redux/            # Redux store ve actions
├── models/               # MongoDB modelleri
└── public/               # Static dosyalar
```

## API Routes

- `GET /api/popular-movies` - Popüler filmleri getir
- `GET /api/movie/[id]` - Film detaylarını getir
- `GET /api/search-movie?query=...` - Film ara
- `GET /api/imdbid/[id]` - IMDB ID'ye göre çekim lokasyonlarını getir

## Deployment

### Vercel

Proje Vercel'e deploy edilmeye hazırdır. Detaylı rehber için `VERCEL_DEPLOY.md` dosyasına bakın.

**Hızlı Başlangıç:**

1. Vercel hesabınıza giriş yapın
2. Yeni proje oluşturun
3. GitHub repo'nuzu bağlayın
4. **Environment Variables** ekleyin:
   - `MONGODB_URI` (zorunlu)
   - `TMDB_API_KEY` (zorunlu)
   - `GEOAPIFY_API_KEY` (opsiyonel)
5. Deploy edin

Vercel otomatik olarak Next.js projelerini algılar ve deploy eder.

**Not:** Environment variables'ları Vercel dashboard'da **Settings > Environment Variables** bölümünden ekleyin.

## Notlar

- MongoDB bağlantısı için connection string gerekli
- TMDB API key gereklidir (ücretsiz alınabilir)
- Geoapify API key gereklidir (ücretsiz tier mevcut)
- Leaflet haritaları için SSR devre dışı bırakılmıştır (dynamic import kullanılmıştır)

## Lisans

MIT
