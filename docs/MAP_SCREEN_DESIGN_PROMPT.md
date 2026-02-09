# Harita ekranı yeniden tasarım prompt’u (Google Stitch / AI tasarım)

Aşağıdaki metni kopyalayıp Google Stitch veya benzeri bir tasarım aracında kullanabilirsin.

---

## Prompt (Türkçe)

**Görev:** Bir “film çekim lokasyonları” uygulamasının harita ekranını yeniden tasarla. Aynı yapı ve işlevler korunacak; sadece görsel dil ve UI/UX güncellenecek.

**Sayfa amacı:** Kullanıcı bir film seçtiğinde, o filmin çekildiği lokasyonlar bir haritada işaretlenir. Solda film bilgisi ve lokasyon listesi, sağda interaktif harita vardır.

**Layout (masaüstü):**
- **Sol panel (sidebar):** Sabit genişlik (~360–400px), koyu arka plan, hafif cam/blur efekti. İki bölüm:
  1. **Üst bölüm – “Featured Production”:** Film adı (büyük başlık), yıl ve süre (pill/badge), kısa açıklama (sol border vurgulu blok). Minimal, sinematik his.
  2. **Alt bölüm – “Filming Locations”:** Başlık + lokasyon sayısı (“X locations · tap to focus on map”). Altında **liste:** Her satır tıklanabilir bir kart; solda sıra numarası (1, 2, 3…), ortada lokasyon adı ve varsa kısa açıklama (italik), sağda “haritada göster” ok ikonu. Seçili kart vurgulu (mavi/primary). Liste gerekirse kendi içinde scroll olur.
- **Sağ alan – Harita:** Tam kalan genişlik ve yükseklik, koyu harita arka planı. Üst ortada **floating bar:** “Exploring: [Film Adı]” + “Reset Map” butonu. Harita sol üstte küçük legend (Filmed Here / Region), sağ üstte isteğe bağlı küçük “Source: DB/Web” badge’i. Haritada noktalar (marker) ve geniş alanlar için yuvarlak (circle) gösterilir; primary renk vurgusu.

**Layout (mobil):**
- **Üstte panel:** Aynı sidebar içeriği ama yükseklik sınırlı (~38vh max); içerik kaydırılabilir (film bilgisi + lokasyon listesi scroll).
- **Altta harita:** Kalan yükseklik (en az ~55vh), tam genişlik. Mobilde üstteki “Exploring” bar ve legend/badge gizlenebilir; sadece harita ve marker’lar görünsün.

**Renk ve stil:**
- Arka plan: çok koyu (#0a0a0a, #050505 tonları).
- Primary vurgu: mavi (#1111d4 veya benzeri).
- Lokasyon metinleri: amber/sarımsı (#f59e0b tonları) veya beyaz; açıklamalar beyaz %60–80 opacity.
- Kenarlıklar: beyaz/primary çok düşük opacity (0.05–0.2).
- Kartlar: yuvarlatılmış (rounded-xl), ince border, hover/active’te primary hafif vurgu.
- Genel his: koyu, sinematik, modern; film/dizi odaklı bir ürün.

**Korunması gerekenler:**
- Sol panel + sağ harita ayrımı (masaüstü).
- Mobilde üst panel (scroll) + altta sabit yükseklikte harita.
- Film başlığı, yıl, süre, açıklama alanı.
- Lokasyon listesi: numara + lokasyon adı + opsiyonel açıklama + tıklanınca haritada odaklanma (bu davranış kodda kalacak, tasarım sadece görsel).
- Harita üstünde “Exploring” + “Reset Map” ve köşe öğeleri (legend, source).

**İstenen çıktı:** Bu yapıyı bozmadan, daha çarpıcı ve güncel bir görsel tasarım. Tipografi, boşluklar, renk geçişleri, kart gölgeleri ve mobil deneyimi özellikle iyileştir. Figma/Sketch benzeri ekran taslağı veya bileşen bazlı UI önerisi uygundur.

---

## Prompt (English, alternative)

**Task:** Redesign the map screen of a “filming locations” app. Keep the same structure and functionality; only update the visual language and UI/UX.

**Page purpose:** When the user selects a movie, the locations where it was filmed are shown on a map. Left: film info + scrollable list of locations. Right: full-height interactive map.

**Desktop layout:**
- **Left sidebar (~360–400px):** Dark background, subtle glass/blur. Two sections: (1) Featured Production — movie title, year & duration pills, short description with left border accent. (2) Filming Locations — section title + count, then a list of tappable cards: index number, location name, optional italic description, “focus on map” arrow; selected card highlighted (primary blue). List scrolls if needed.
- **Right: Map** — fills remaining width/height, dark base. Top center: floating bar “Exploring: [Movie Title]” + “Reset Map”. Corners: small legend (Filmed Here / Region), optional “Source: DB/Web” badge. Map shows markers and circle markers for areas; primary blue accent.

**Mobile layout:**
- **Top panel:** Same sidebar content, max height ~38vh, scrollable (film info + location list).
- **Bottom:** Map taking rest of screen (min ~55vh). Optional: hide top bar and legend on mobile.

**Style:** Dark theme (#0a0a0a), primary blue (#1111d4), location text in amber/white, subtle borders, rounded cards with hover/active states. Cinematic, modern film-app feel.

**Preserve:** Left panel + map split on desktop; on mobile, top scrollable panel + fixed-height map below; movie title, year, duration, description block; location list with index, name, description, tap-to-focus behavior; “Exploring” + “Reset Map” and corner elements.

**Deliverable:** A more striking, up-to-date visual design that keeps this structure. Improve typography, spacing, gradients, card shadows, and mobile experience. Screen mockups or component-level UI suggestions are fine.
