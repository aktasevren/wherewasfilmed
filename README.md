# Where Was Filmed - Next.js

Film çekim lokasyonlarını bulmak için Next.js ile geliştirilmiş bir web uygulaması.

## Özellikler

- 🔍 Film ve dizi arama
- 🗺️ Film/dizi çekim lokasyonlarını haritada görüntüleme
- 🎨 Modern ve responsive tasarım

## Teknolojiler

- **Next.js 16** (App Router)
- **React 19**
- **Redux Toolkit** - State management
- **Leaflet** - Harita görselleştirme
- **Bootstrap** - UI framework
- **Search Suggestions API** - Film ve dizi arama
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
GEOAPIFY_API_KEY=your_geoapify_api_key_here
SUGGESTION_SERVICE_BASE_URL=your_suggestion_service_base_url
LOCATIONS_SERVICE_BASE_URL=your_locations_service_base_url
```

**API Key'lerini Nasıl Alırsınız:**
- **Geoapify API Key**: https://www.geoapify.com/get-started-with-maps-api adresinden ücretsiz API key alabilirsiniz
- **SUGGESTION_SERVICE_BASE_URL**: Arama öneri servisi base URL
- **LOCATIONS_SERVICE_BASE_URL**: Çekim lokasyonları servisi base URL

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
│   │   ├── search-suggestions/
│   │   └── locations/[movieId]/
│   ├── components/       # React component'leri
│   ├── movie/[id]/       # Film detay sayfası
│   ├── search/[text]/    # Arama sonuçları sayfası
│   └── page.jsx          # Ana sayfa
├── lib/
│   └── redux/            # Redux store ve actions
└── public/               # Static dosyalar
```

## API Routes

- `GET /api/search-suggestions?q=...` - Film/dizi arama önerileri
- `GET /api/locations/[movieId]` - Film/dizi çekim lokasyonlarını getir (title ref)

## Deployment

### Vercel

Proje Vercel'e deploy edilmeye hazırdır. Detaylı rehber için `VERCEL_DEPLOY.md` dosyasına bakın.

**Hızlı Başlangıç:**

1. Vercel hesabınıza giriş yapın
2. Yeni proje oluşturun
3. GitHub repo'nuzu bağlayın
4. **Environment Variables** ekleyin:
   - `SUGGESTION_SERVICE_BASE_URL` (zorunlu)
   - `LOCATIONS_SERVICE_BASE_URL` (zorunlu)
   - `GEOAPIFY_API_KEY` (opsiyonel)
5. Deploy edin

Vercel otomatik olarak Next.js projelerini algılar ve deploy eder.

**Not:** Environment variables'ları Vercel dashboard'da **Settings > Environment Variables** bölümünden ekleyin.

## Notlar

- Lokasyon servisi base URL (LOCATIONS_SERVICE_BASE_URL) gereklidir
- Geoapify API key gereklidir (ücretsiz tier mevcut)
- Leaflet haritaları için SSR devre dışı bırakılmıştır (dynamic import kullanılmıştır)

## Lisans

MIT
