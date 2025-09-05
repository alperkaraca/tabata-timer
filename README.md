# Tabata Timer by ALPER K.

Minimal, modern ve PWA özellikleriyle zenginleştirilmiş bir Tabata zamanlayıcısı. Modüler mimari, sıkı CSP, erişilebilirlik ve offline desteği ile tek tıkla kullanıma hazır.

## Özellikler
- Dairesel ilerleme çubuğu ve net durum etiketleri (Hazırlan/Çalış/Mola/Bitti)
- Ses uyarıları (kısa/uzun bip) + bitişte özel ses için opsiyon
- Titreşim (destekleyen cihazlarda)
- Set sayısını `localStorage` ile hatırlar
- Klavye kısayolu: Boşluk ile Başlat/Duraklat
- Erişilebilirlik: `role="timer"`, canlı bölge (aria-live)
- Güvenlik: Inline kod/stil yok, sıkı Content Security Policy
- PWA: Service Worker ile offline çalışma ve hızlı tekrar açılış

## Hızlı Başlangıç
- Geliştirme (modüler kaynaklarla):
  - `tabata-timer.html` dosyasını tarayıcıda aç.
- Üretim (minify edilmiş derleme):
  - `node scripts/build.js` çalıştır.
  - `dist/tabata-timer.html` dosyasını aç.

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

