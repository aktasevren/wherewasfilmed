# Review & Optimizations Summary

## Backend Review

### API Routes
- **search-suggestions**: Tek sayfa dönüyor; ilk cevap hızlı. Wikidata wbsearchentities + wbgetentities kullanılıyor.
- **locations/[movieId]**: Wikidata ID veya token ile IMDb ID çözümlemesi; tek yer IMDb kullanımı (lokasyon servisi).
- **geocode**: Geoapify; API key ve parametre validasyonu mevcut.

### Yapılan Backend Optimizasyonlar

1. **Ortak Wikidata kütüphanesi (`lib/wikidata.js`)**
   - `pickFirstClaimValue`, `hasInstanceOf`, `parseWikidataYear`, `commonsImageUrl`, `formatDuration`, `isWikidataId`, `WIKIMEDIA_HEADERS` tek yerde toplandı.
   - `search-suggestions/route.js` ve `locations/[movieId]/route.js` bu lib’i kullanıyor; kod tekrarı kaldırıldı.

2. **Geocode route**
   - İsteklere **timeout (8s)** eklendi.
   - Hata durumunda **error.response** (401, 403, 429, 4xx/5xx) kullanılarak uygun status ve mesaj dönülüyor.

---

## Frontend Review

### Bileşenler
- **Searchbar**: Debounce, otomatik ilk 5 sayfa, "Daha fazla" ile devam.
- **SelectedMovie**: Harita, marker ikonları, Wikidata meta (logo, süre, açıklama).
- **MovieActions**: Lokasyon + geocode akışı; Redux dispatch’ler tutarlı.

### Yapılan Frontend Optimizasyonlar

1. **Geocode eşzamanlılık sınırı (MovieActions)**
   - Tüm lokasyonlar aynı anda değil, **5’er 5’er** (concurrency 5) geocode ediliyor.
   - Geoapify rate limit ve zaman aşımı riski azaltıldı; progress güncellemeleri chunk sonrası tek seferde yapılıyor.

2. **Ortak `getAlertify` (`lib/alertify.js`)**
   - `MovieActions.js` ve `Searchbar.jsx` içindeki tekrarlanan lazy-load kodu kaldırıldı; `lib/alertify.js` kullanılıyor.

3. **SelectedMovie harita ikonu**
   - Marker ikonu her render’da yeniden oluşturulmak yerine **`useMemo`** ile `markerIconUrl`’e bağlı tek instance kullanılıyor; gereksiz L.Icon oluşturması azaltıldı.

---

## Özet

| Alan        | Değişiklik |
|------------|------------|
| Backend    | Ortak `lib/wikidata.js`, geocode timeout + hata yanıtları |
| Frontend   | Geocode 5’li batch, ortak `lib/alertify.js`, marker icon useMemo |

Bu doküman yapılan review ve optimizasyonların özetidir.
