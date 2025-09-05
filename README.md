# Tabata Timer by ALPER K.

[English](#english) | [Türkçe](#turkce)

<a id="english"></a>

Modern, modular, PWA-ready Tabata timer with circular progress, audio cues, vibration, a11y, strict CSP, and offline support. GitHub Pages–ready out of the box.

## Features (EN)
- Circular progress ring and clear phase labels (Prep/Work/Rest/Done)
- Drift-corrected timing (time-based heartbeat; resilient to tab throttling)
- Bilingual UI (English/Türkçe) with instant switching; preference is saved
- Audio cues (short/long beeps) + optional finish sound
- Vibration feedback (on supported devices)
- Remembers set count via `localStorage`
- Keyboard shortcut: Space to Start/Pause
- Accessibility: `role="timer"`, aria-live regions
- Security: no inline code/styles, strict CSP
- PWA: Service Worker for offline and fast reloads
 - SEO-friendly: meta description, canonical URL, Open Graph/Twitter cards, JSON‑LD structured data, robots.txt, sitemap.xml, hreflang links

## Quick Start (EN)
- Development (modular sources): open `tabata-timer.html` directly.
- Production (minified build):
  - Run `node scripts/build.js`
  - Open `dist/tabata-timer.html`
 - Language via URL: `?lang=en` or `?lang=tr`

Note: PWA (Service Worker) works only over http(s). For local testing:

```bash
python3 -m http.server 8000
open http://localhost:8000/dist/tabata-timer.html
```

## GitHub Pages (EN)
Build creates `docs/` automatically for Pages.
- Settings → Pages → Deploy from a branch → Branch: `main`, Folder: `/docs`
- Then open `https://<user>.github.io/<repo>/`

Manifest `start_url` is `./`, so Pages uses `docs/index.html` as the app entry.
Icons are included (SVG, any/maskable) for installable PWA experience.

### SEO & Social (EN)
- Canonical URL, robots.txt and sitemap.xml are generated during build (dist/ and docs/)
- Open Graph/Twitter card use `social/og-image.svg` (you can replace with PNG/JPG later); width=1200, height=630 are declared
- JSON‑LD (SoftwareApplication) is now inlined inside HTML for maximum compatibility
- Hreflang links include `en`, `tr` and `x-default`
 - Favicon and Apple touch icon are linked

## Project Structure (EN)
```
.
├─ tabata-timer.html        # App shell using modular sources
├─ styles/
│  └─ app.css               # Base styles + phase classes
├─ src/
│  ├─ main.js               # Entry/wiring
│  ├─ timer.js              # State machine
│  ├─ ui.js                 # DOM updates & phases
│  └─ audio.js              # Web Audio + beeps/finish
├─ scripts/
│  └─ build.js              # Bundle+minify to dist/, mirror to docs/
├─ dist/                    # Production build (auto)
├─ docs/                    # GitHub Pages build (auto)
├─ sw.js                    # Service Worker (source)
└─ manifest.webmanifest     # PWA manifest
```

## Build & Run (EN)
Requires Node.js for building only. App has no runtime deps.
- `node scripts/build.js` → updates `dist/` and `docs/`

## Audio (EN)
- Default: Web Audio short/long beeps
- Optional finish sound: add `assets/audio/finish.mp3`
  - Dev: `assets/audio/finish.mp3`
  - Pages/Prod: `docs/assets/audio/finish.mp3`
- Browsers require user interaction to start audio; first Start click enables it.

## PWA (EN)
- `sw.js`: cache-first for same-origin; serves last cached offline
- `manifest.webmanifest`: name, theme color, standalone
- Works only over http(s), not `file://`

## A11y & UX (EN)
- `role="timer"`, aria-live updates
- Space toggles start/pause
- Vibration via `navigator.vibrate`
 - `html[lang]` updates when switching language

## Security (EN)
- Strict CSP: `script-src 'self'`, `style-src 'self'`
- No external fonts/audio by default (can be added with CSP updates)

## Customize (EN)
- Colors: edit CSS vars in `styles/app.css`
- Phase durations: change `PREP_TIME`, `WORK_TIME`, `REST_TIME` in `src/main.js`
- Branding: tweak `.brand` in `tabata-timer.html`; shimmer in `styles/app.css`

---

<a id="turkce"></a>

Minimal, modern ve PWA özellikleriyle zenginleştirilmiş bir Tabata zamanlayıcısı. Modüler mimari, sıkı CSP, erişilebilirlik ve offline desteği ile tek tıkla kullanıma hazır.

## Özellikler
- Dairesel ilerleme çubuğu ve net durum etiketleri (Hazırlan/Çalış/Mola/Bitti)
- Sapma düzeltmeli zamanlama (gerçek-zaman kalp atımı; sekme kısıtlamalarına dayanıklı)
- Çift dilli arayüz (Türkçe/İngilizce); anında geçiş ve tercih kaydı
- Ses uyarıları (kısa/uzun bip) + bitişte özel ses için opsiyon
- Titreşim (destekleyen cihazlarda)
- Set sayısını `localStorage` ile hatırlar
- Klavye kısayolu: Boşluk ile Başlat/Duraklat
- Erişilebilirlik: `role="timer"`, canlı bölge (aria-live)
- Güvenlik: Inline kod/stil yok, sıkı Content Security Policy
- PWA: Service Worker ile offline çalışma ve hızlı tekrar açılış
 - SEO uyumlu: meta description, canonical URL, Open Graph/Twitter kartları, JSON‑LD, robots.txt, sitemap.xml, hreflang linkleri

## Hızlı Başlangıç
- Geliştirme (modüler kaynaklarla):
  - `tabata-timer.html` dosyasını tarayıcıda aç.
- Üretim (minify edilmiş derleme):
  - `node scripts/build.js` çalıştır.
  - `dist/tabata-timer.html` dosyasını aç.
 - URL ile dil seçimi: `?lang=en` veya `?lang=tr`

Not: PWA (Service Worker) yalnızca `http(s)` üzerinden aktif olur. Test için basit bir yerel sunucu kullan:

```bash
# Python 3 ile, kök dizinden
python3 -m http.server 8000
open http://localhost:8000/dist/tabata-timer.html
```

## GitHub Pages Dağıtımı
Build sonrası `docs/` klasörü otomatik üretilir ve yayın için hazırdır.
- GitHub Pages: Settings → Pages → Deploy from a branch → Branch: `main`, Folder: `/docs`
- Yayınlandıktan sonra uygulama `https://<kullanıcı-adı>.github.io/<repo-adı>/` adresinden açılır.

Manifest `start_url` değeri `./` olduğundan Pages altında kök dizindeki `index.html` (docs/index.html) baz alınır.
PWA ikonları (SVG; any/maskable) eklidir, kurulabilir uygulama deneyimi sunar.

### SEO ve Sosyal (TR)
- Build sırasında canonical URL, robots.txt ve sitemap.xml oluşturulur (dist/ ve docs/)
- Open Graph/Twitter kartı için `social/og-image.svg` kullanılır (ileride PNG/JPG ile değiştirilebilir); width=1200, height=630 belirtilir
- JSON‑LD (SoftwareApplication) en yüksek uyumluluk için HTML içine inline eklendi
- Hreflang linkleri `en`, `tr` ve `x-default` içerir
 - Favicon ve Apple touch icon bağlandı

## Proje Yapısı
```
.
├─ tabata-timer.html        # Modüler kaynakları kullanan ana sayfa
├─ styles/
│  └─ app.css               # Temel stiller + faz sınıfları
├─ src/
│  ├─ main.js               # Uygulama giriş noktası (event wiring)
│  ├─ timer.js              # Zamanlayıcı durum makinesi
│  ├─ ui.js                 # DOM güncellemeleri ve faz sınıfları
│  └─ audio.js              # Web Audio + bip/bitiş sesi
├─ scripts/
│  └─ build.js              # Basit bundle + minify + dist/docs oluşturma
├─ dist/                    # Üretim çıktıları (auto)
├─ docs/                    # GitHub Pages çıktısı (auto)
├─ sw.js                    # Service Worker (kaynak)
└─ manifest.webmanifest     # PWA manifest
```

## Build ve Çalıştırma
- Gereksinimler: Node.js (yalnızca build için). Uygulama kendisi bağımlılık gerektirmez.
- Komut:
  - `node scripts/build.js` → `dist/` ve `docs/` güncellenir.

## Sesler
- Varsayılan: Web Audio ile kısa/uzun tonlar (bip) üretilir.
- Opsiyonel bitiş sesi: `assets/audio/finish.mp3` dosyasını ekleyerek zengin ses kullan.
  - Dosyayı şu yollarla erişilir kılabilirsiniz:
    - Geliştirme: `assets/audio/finish.mp3` (kökten)
    - Üretim/Pages: `docs/assets/audio/finish.mp3` (SW runtime’da cache’ler)
- Ses çalma için tarayıcıların “kullanıcı etkileşimi” kısıtı olduğundan, ilk Başlat tıklaması ses motorunu etkinleştirir.

## PWA ve Offline
- `sw.js`: Aynı origin isteklerinde cache-first stratejisi uygular; offline’da son cachelenen sürümü sunar.
- `manifest.webmanifest`: Uygulama adı, tema rengi ve standalone görünüm ayarları.
- Not: Service Worker, `file://` altında çalışmaz. `http(s)` altında servis edilir.

## Erişilebilirlik ve Kullanılabilirlik
- `role="timer"`, `aria-live` bölgeleri
- Boşluk tuşu ile başlat/duraklat
- Titreşim desteği (mobil cihazlarda `navigator.vibrate`)
 - Dil değiştirdiğinde `html[lang]` güncellenir

## Güvenlik
- Sıkı CSP: `script-src 'self'`, `style-src 'self'` (inline script/stil yok)
- Harici font/ses kullanılmıyor (isteğe bağlı eklenebilir; CSP güncellemesi gerekir)

## Özelleştirme
- Renkler: `styles/app.css` içindeki CSS değişkenlerini (`:root`) güncelle.
- Faz süreleri: `src/main.js` başındaki sabitleri (`PREP_TIME`, `WORK_TIME`, `REST_TIME`) değiştir.
- Brand başlığı: `tabata-timer.html` içindeki `.brand` bloğunu düzenle; shimmer animasyonu `styles/app.css` → `@keyframes brand-sweep`.

## Geliştirme İpuçları
- Kaynaklarla çalış: `tabata-timer.html` (modüler), hızlı denemeler için ideal.
- Prod test: `node scripts/build.js` → `dist/` veya `docs/` üzerinden test et.
- “Drift” telafisi istersen zamanlayıcıyı gerçek zaman damgalı planlayıcıya geçirmek kolayca eklenebilir.

---
Her türlü geliştirme talebin (tema/dark mode, süre ayar paneli, drift düzeltme, ikonlar) için PR/issue açabilirsin.
