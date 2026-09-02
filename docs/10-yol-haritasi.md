# Fazlı Yol Haritası

Durum: Kod tarafı uygulandı (Faz 0-5 main'de: PR #2-#6, #31; v0.3.1), 28 Ağustos denetim kapanışı `feature/audit-closure` dalında, 31 Ağustos incelemesi ve 2 Eylül 3. tur (`feature/audit-followups`, PR #44, T-56 typecheck regresyonu dahil kapandı) `dev`'de; 2026-09-02 `feature/brand-assets` (68 commit) marka paketi, header/footer, paylaş bloğu, sertifika v2, Köklü Hukuk vaka çalışması ve yerelleştirilmiş yolları ekledi; kalan: Faz 5 panel adımları, launch kapısının manuel maddeleri, sahibinin teslimatları ve görsel onayları (bkz. `audit/acik-kalanlar.md` bölüm 12) · Karar: 2026-08-27 · Güncelleme: 2026-09-02 · Kapsam: dogancanyildiz.com

## Özet

Modernizasyon 6 fazda yürütülür: Faz 0'dan Faz 5'e kadar sıralı, her faz kendi dalında ve tek PR'da biter, main'e merge edilmeden bir sonraki faz başlamaz. Sıralamanın mantığı basit: önce hemen kapatılması gereken güvenlik açıkları ve boilerplate temizliği (Faz 0), sonra her sonraki fazın canlıda doğrulanabilmesi için deploy hattı (Faz 1), ardından tek seferde bitirilmesi gereken büyük mimari kırılma olan i18n restructure (Faz 2), üstüne tasarım sistemi (Faz 3), en son da asıl amaç olan gerçek içerik ve yayın (Faz 4). Faz 4'ün sonu launch noktasıdır. Faz 5 (Gatus, Umami, Dependabot) yayın sonrasına bırakılır çünkü hiçbiri launch için zorunlu değildir. Repo şu an `tsc --noEmit` ve eslint'ten temiz geçiyor; bu güvenlik ağı her fazın sonunda korunmak zorunda, aksi halde fazlı ilerlemenin tüm amacı (her adımda çalışan bir site) boşa düşer.

## Karar(lar)

Faz sırası ve kapsamı aşağıdaki tabloda özetleniyor, ayrıntılı madde listeleri ve bitiş kriterleri alt başlıklarda.

| Faz | Hedef | Çıktı | Bağımlılık | Büyüklük | Durum | PR |
|---|---|---|---|---|---|---|
| Faz 0 | Bilinen güvenlik açıklarını kapatmak, üretime hazır Next yapılandırması bırakmak, ölü boilerplate'i temizlemek | next 16.3.3, güvenlik başlıkları + CSP, sertleşmiş contact route, `/api/health` | Yok, hemen başlanabilir | M | Uygulandı, main'de | #2 |
| Faz 1 | Her push'ta otomatik yayın, PR'larda preview URL, doğru domain yönlendirmesi | Çok aşamalı Dockerfile + Coolify GitHub App entegrasyonu + Traefik 301 | Faz 0 | L | Kısmen uygulandı (kod main'de, panel adımları sahibinde) | #3 |
| Faz 2 | İki dil ayrı URL'lerde, tüm içerik route'ları build'de prerender, doğru hreflang/canonical | `app/[lang]` + next-intl 4.13.7 kurulumu | Faz 1 | L | Uygulandı, main'de | #4 |
| Faz 3 | Tipografi gerçekten yüklensin, palet nötrlensin, mobilde site gezilebilir olsun | Vendor'lanmış fontlar, nötr token seti, mobil menü, hareket/erişilebilirlik toparlaması | Faz 2 | M | Uygulandı, main'de | #5 |
| Faz 4 | Şablon persona tamamen gitsin, gerçek case study'ler ve ilk blog yazıları yayına çıksın | Velite içerik pipeline'ı, gerçek proje/blog sayfaları, iki dilli çeviri | Faz 3 | L | Uygulandı, main'de (2026-08-27) | #6 |
| Faz 5 | Self-host kimliğini iddia değil gösterim haline getirmek, bakımı otomatikleştirmek | Gatus widget, Umami, Dependabot/CodeQL | Faz 4 (yayın sonrası) | S | Kod repoda; 2026-08-30 kararıyla Gatus/repo-Umami kaldırıldı, izleme Uptime Kuma + merkezi Umami (PR #37), panel adımları açık | - |

Ayrıntı: `00-ozet-ve-karar.md` genel kararın gerekçesini, `02-stack-karari.md` neden Next.js'te kalındığını anlatıyor; burada yalnızca fazlara bölünmüş uygulama sırası var.

### Faz 0: Güvenlik ve hijyen (hemen, yayından bağımsız)

- [x] next 16.1.6 -> 16.3.3, eslint-config-next 16.3.3, package-lock.json normalize edilip commit
- [x] framer-motion ^12 -> motion 13.1.1, import'lar `motion/react`'e taşınır
- [x] `src/app/opengraph-image.tsx:3`'teki `export const runtime = "edge"` silinir (dosya Faz 2'de `src/app/[lang]/opengraph-image.tsx`'e taşındı, edge runtime hiç yok)
- [x] `next.config.ts`: `output: 'standalone'`, `poweredByHeader: false`, `headers()` ile güvenlik başlıkları ve CSP
- [x] `.nvmrc` (24) + `package.json` `engines.node >=20.9`, typecheck ve format script'leri eklenir
- [x] `src/app/api/health/route.ts` eklenir
- [x] Contact sertleştirmesi: sunucu taraflı honeypot, IP rate limit, uzunluk sınırları, email regex, jenerik hata mesajı, prod'da zorunlu env kontrolü
- [x] `NEXT_PUBLIC_SITE_URL` `.env.example`'a eklenir, `robots.ts` ve `sitemap.ts`'teki `example.com` fallback'i kaldırılır
- [x] `public/` altındaki kullanılmayan create-next-app SVG'leri silinir, README Coolify/Docker adımlarıyla yeniden yazılır

Bitti sayılma kriteri: `tsc --noEmit` ve eslint hatasız geçiyor; `next build` sonrası `next start` ile `/api/health` 200 dönüyor; contact endpoint'ine curl ile doğrudan atılan honeypot dolu istek 4xx ile reddediliyor; `robots.ts` ve `sitemap.ts`'teki `example.com` fallback'i kalkmış, `src/app`, `public`, `README.md` ve `.env.example` içinde `example.com` geçmiyor. Not: `src/components`, `src/data` ve `src/lib` içindeki şablon persona kalıntıları (`alex@example.com`, `you@example.com`, proje `liveUrl`'leri) bu fazın madde listesinde yok; onlar Faz 4'ün launch kapısına ait (aşağıdaki Faz 4 kriteri) ve Faz 0'ı bloklamaz.

Gerçek sonuç (PR #2, main'de merge): dört kapı (`tsc --noEmit`, eslint, `npm test`, `npm run build`) exit 0, 6 dosya / 60 test yeşil; `npm run build` sonrası `/api/health` 200; honeypot dolu istek 400 ile reddedildi; `src/app`, `public`, `README.md`, `.env.example` içinde `example.com` sıfır. Açık kalan (bu fazı bloklamıyor): `TRUST_CF_CONNECTING_IP=false`, `npm audit` 17 transitif bulgu (ayrı PR), lucide-react/shadcn/typescript major güncellemeleri ayrı PR.

Büyüklük: M. Çok sayıda küçük ve mekanik değişiklik, ama hiçbiri mimari değil.

### Faz 1: Deploy hattı

- [x] Çok aşamalı Dockerfile (node:24-alpine, deps/builder/runner, non-root, `.next/standalone` + `.next/static` + `public`, `CMD ["node","server.js"]`) ve `.dockerignore` (`.local/` dahil)
- [ ] Coolify'da GitHub App ile git tabanlı Dockerfile build pack, auto-deploy ve PR Preview Deployments açık (sahibi: manuel checklist, `docs/deploy/coolify-kurulum.md`)
- [ ] Health check Coolify'da `/api/health`'e bağlanır ve staging'de doğrulanır (coollabsio/coolify#7500 bilinen bug'ı yüzünden) (sahibi: manuel checklist)
- [x] GitHub Actions: PR'da lint + `tsc --noEmit` + build çalıştıran zorunlu kapı, image push yok (`ci.yml`'de `checks` ve `docker` job'ları; PR #6'da her ikisi de `pass`)
- [ ] **Karar değişikliği (2026-08-27):** dogancanyildiz.com apex + www ana domain (Cloudflare Redirect Rules'ta apex -> www dahil (kanonik host www, karar 2026-09-02), Coolify dahili www ayarı kullanılmaz), dogancanyildiz.sh apex + www yalnızca Cloudflare'da proxied bir kayıt olarak origin'e ulaşmadan .sh -> .com 301'i **Cloudflare Redirect Rules**'ta tek atlamada (Traefik redirectregex yalnızca yedek yol olarak Coolify'da tanımlı kalır, bkz. [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 7-8) (sahibi: manuel checklist; tarihsel madde metni ".sh ana, .com 301" idi, `11-acik-sorular.md` soru 5 artık cevaplandı ve açık soru kalmadı; kod tarafı `feature/com-primary-and-release-flow` dalında tamamlandı ve dev'e PR ile girecek, kalan yalnızca bu Cloudflare panel adımının canlıya alınması)
- [ ] Cloudflare DNS proxied mod (turuncu bulut) açılır, SSL modu Full (strict) set edilir (sahibi: manuel checklist, `docs/deploy/cloudflare-kurulum.md`)
- [ ] Traefik entrypoint'inde `forwardedHeaders.trustedIPs` Cloudflare IP listesiyle set edilir, contact rate limit anahtarı `CF-Connecting-IP` olur (sahibi: manuel checklist; kod tarafı hazır (`TRUST_CF_CONNECTING_IP` bayrağı), env hâlâ `false`)
- [ ] Origin'i yalnızca Cloudflare IP'lerinden erişilebilir kılmak (DOCKER-USER iptables kuralları; ufw tek başına Docker'ın yayınladığı portları filtrelemiyor), önerilir (sahibi: manuel checklist, `docs/deploy/traefik-ve-origin.md`)
- [ ] Cloudflare cache kuralı `_next/static/*` ve `public/` görselleri için, `/api/contact` için Cloudflare Rate Limiting kuralı (free planda 3 istek/10sn), Bot Fight Mode açık (sahibi: manuel checklist)
- [ ] Traefik'te HSTS ve compress middleware'i, streaming için buffering kapatma (sahibi: manuel checklist)
- [ ] Coolify env değişkenleri Build/Runtime olarak ayrılır (`NEXT_PUBLIC_SITE_URL` Build; `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`, `CONTACT_EMAIL`, `FROM_EMAIL` Runtime; madde metni 2026-08-31 öncesi `RESEND_API_KEY` idi) (sahibi: manuel checklist)
- [ ] **Karar değişikliği (2026-08-31):** posta Resend yerine sahibinin Mailcow sunucusundan çıkar; Mailcow'da dogancanyildiz.com için SPF/DKIM/DMARC yayında ve `contact@` posta kutusu uygulama parolasıyla hazır (sahibi: manuel checklist, `docs/deploy/mailcow-smtp.md`; FROM_EMAIL contact@dogancanyildiz.com, alıcı me@dogancanyildiz.com; tarihsel madde metni Resend domain doğrulamasıydı)

Bitti sayılma kriteri: main'e merge edilen bir commit Coolify'da otomatik deploy tetikliyor ve site canlıda ayakta; test PR'ı açıldığında preview URL üretiliyor; `curl -I https://dogancanyildiz.sh/herhangi-bir-yol` tek atlamada `https://www.dogancanyildiz.com/herhangi-bir-yol`'a 301 dönüyor; Coolify sağlık kontrolü yeşil.

Gerçek sonuç (PR #3, main'de merge): kod tarafı (Dockerfile, `.dockerignore`, CI workflow) yerelde ve CI'da doğrulandı, 10 dosya / 101 test (düzeltme turuyla 13 dosya / 125 test), `NEXT_PUBLIC_SITE_URL=... npm run build` 12 route / 18 statik sayfa; Docker imajı yerelde build edilip `healthy` görüldü. Panel adımlarının hiçbiri (Coolify, Cloudflare, Traefik, Resend) bu oturumda uygulanmadı; canlı otomatik deploy, preview URL ve `.sh -> .com` 301 bu yüzden doğrulanmadı, tamamı `docs/plans/handoffs/faz-1-manual-checklist.md`'de sahibini bekliyor.

Büyüklük: L. Repo şu an Docker'a hiç hazır değil (Dockerfile, .dockerignore, workflow, hiçbiri yok), sıfırdan kurulum.

### Faz 2: i18n yeniden mimarisi

- [x] `app/[lang]/` yapısına taşıma, `generateStaticParams` ile `en` ve `tr` prerender
- [x] next-intl 4.13.7 kurulumu: `routing.ts`, `i18n/request.ts`, `proxy.ts` (localeDetection kapalı), her page/layout'ta `setRequestLocale`
- [x] `src/lib/i18n/translations.ts`, `locale-provider.tsx`, `use-translation.ts` silinir; mesajlar `messages/en.json` ve `messages/tr.json`'a taşınır
- [x] Dört layout'taki `cookies()` çağrıları kaldırılır, `generateMetadata` locale param'ından üretilir
- [x] `alternates.canonical` + `alternates.languages` + `x-default`, `metadataBase`, `openGraph.images`
- [x] `sitemap.ts` ve `robots.ts` iki locale için güncellenir
- [x] Person JSON-LD eklenir; language-switcher URL tabanlı çalışacak şekilde yeniden yazılır
- [x] Contact route (bir Route Handler olduğu için `next/root-params` desteklemiyor) locale'i elle alır

Bitti sayılma kriteri: `next build` çıktısında yalnızca `/api/*` route'ları dynamic işaretli, geri kalan tüm içerik route'ları statik (SSG); `/` (tr) ve `/en` farklı içerik ve farklı `<html lang>` döndürüyor (2026-08-30 TR-varsayılan şeması; `/tr/*` kalıcı 308 ile köke düşer); bir hreflang test aracıyla (ör. technicalseo.com hreflang tag generator/tester) self-referencing ve karşılıklı hreflang hatasız çıkıyor.

Gerçek sonuç (PR #4, main'de merge): beş kapı (`typecheck`, `lint`, `test`, `build`, `verify:routes`) exit 0; 19 dosya / 207 test (düzeltme turuyla 20 dosya / 271 test); `verify:routes` "20 content routes prerendered (6 project pages per locale)"; `next build` çıktısında yalnızca `/api/contact` ve `/api/health` dynamic, prerender-manifest'te 26 route (20 içerik + 6 sistem). hreflang test aracı herkese açık bir URL istediği için bu oturumda koşulmadı, `docs/plans/handoffs/faz-2-manual-checklist.md`'de sahibini bekliyor.

Büyüklük: L. Plandaki tek büyük mimari hamle; bilinçli olarak tek PR'da bitiriliyor.

### Faz 3: Tasarım sistemi

- [x] Geist Sans/Mono Variable + Instrument Serif woff2 (latin + latin-ext) `src/fonts/` altına vendor'lanır, `next/font/local` ile yüklenir, `globals.css`'teki ölü `--font-fraunces` referansı düzeltilir
- [x] `globals.css` token blokları nötr palete geçirilir, emerald yalnızca link/focus/status rengine indirilir, `--primary` ile `--muted-foreground` ayrışması düzeltilir
- [x] Body gradyanı, `surface-panel` gölgesindeki hard-coded rgba ve bileşenlerdeki doğrudan renk referansları (`bg-accent/40`, `border-primary/30` vb.) temizlenir
- [x] md altı için Radix Dialog tabanlı mobil menü; footer'a sayfa linkleri
- [x] LazyMotion + `m`'ye geçiş, stagger 40ms ve en fazla 4 eleman, `useReducedMotion` + global `prefers-reduced-motion` CSS fallback'i
- [x] Erişilebilirlik: contact form mesajlarına `role=alert`/`role=status`, 24x24 minimum hedef boyutu denetimi, solid focus ring
- [x] opengraph-image ve icon route'ları gerçek isim, unvan ve yeni paletle yeniden yazılır
- [x] `project-card`'da tüm kartı Link'e sarma kalıbı bırakılır, başlık link + `::after` tıklama alanı

Bitti sayılma kriteri: Chrome DevTools Network sekmesinde hiçbir Google Fonts isteği yok (tüm fontlar `next/font/local`'dan geliyor); md altı ekranda header olmadan Dialog menüsüyle About/Projects/Contact'a ulaşılabiliyor; `prefers-reduced-motion: reduce` açıkken sayfada hiçbir kayma/fade animasyonu çalışmıyor; repoda `oklch(0.516 0.114 157.2)` değeri iki farklı token'da tekrar etmiyor.

Gerçek sonuç (PR #5, main'de merge): kalite kapıları yeşil, 27 dosya / 367 test; Google Fonts isteği ve tekrar eden `oklch(0.516 0.114 157.2)` yerelde 0 olarak doğrulandı. Açık kalan: reduced-motion açıkken SSR HTML'de gizli hareket varyantı (`opacity:0`) hidrasyona kadar yazılı kalıyor, tarayıcıda gerçek bir ekran görüntüsü turu yapılmadı (`docs/plans/handoffs/faz-3-manual-checklist.md`).

Büyüklük: M. Token ve font katmanı cerrahi, ama dokunulan bileşen sayısı fazla.

### Faz 4: İçerik ve yayın (launch)

- [x] Velite 0.4.0 kurulumu (exact pin), Zod şemaları, `content/projects/{en,tr}` ve `content/blog/{en,tr}` klasörleri, Dockerfile build adımına velite eklenir (`build` = `velite --clean --strict && next build`, ayrı Docker adımı yok, `npm run build` zaten koşuyor)
- [ ] `src/data/projects.ts` kaldırılır, projeler gerçek case study olarak yazılır (Cargo Pilot ve Bilet Satın Alma öncelikli, tüm Divizyon projeleri public), her biri mono künye + `liveUrl`/`repoUrl` + en az 1 ekran görüntüsü ile (görsel gelene kadar kapaksız): veri katmanı ve 6 case study (EN+TR, 12 dosya) tamam; ekran görüntüsü kısmen teslim edildi (Köklü Hukuk 2026-09-02'de kapak aldı, `content/images/koklu-hukuk-cover.jpg`), kalan beş proje hâlâ kapaksız (sahibi: manuel checklist, kapaksız yayın kuralıyla devam ediyor)
- [ ] Hero, About, Contact metinleri `portfolio-content.md`'den yazılır; sertifikalar `verifyUrl` alanıyla listelenir; Speaking, ayrı sayfa değil About içinde medyasız kompakt bir "Konuşmalar" bloğu (etkinlik · konu · tarih) olarak eklenir: metinler ve şema (`src/content/profile.ts`) yazıldı, sertifika `verifyUrl` değerleri, rozet görselleri ve anahtar kelime satırları 2026-09-02'de teslim alındı ve uygulandı (on üç kayıttan on ikisi linkli, kalan yok); Konuşmalar verisi hâlâ teslim edilmedi (sahibi: manuel checklist, alan opsiyonel, şu an boş)
- [x] CV PDF dosyası `public/cv/dogancanyildiz-cv.pdf` yoluna konur (teslim edilene kadar `.local/` altında tutulur), hero/about'taki `/cv.pdf` linki bu yola güncellenir; Download CV butonu kalır (PR #6 dalında commit'li; içerik onayı sahibinde)
- [x] Tüm Alex Chen, alex@example.com, placeholder sosyal link ve example.com kalıntıları silinir, logo DCY olur
- [x] TR çeviriler yazılır; blog TR-first (yazılar önce Türkçe, uluslararası ilgi görecek olanlar EN'e çevrilir), çevirisi olmayan içerik o dilin sitemap ve hreflang alternates'ine eklenmez
- [x] İlk 3-4 blog yazısı; blog listesi, detay sayfası, BlogPosting JSON-LD, sitemap entegrasyonu (3 TR + 1 EN çeviri)
- [x] Görseller `next/image` ile (sizes tanımlı, remotePatterns yok): kod hazır (`project-card.tsx`, `[slug]/page.tsx`), henüz gösterilecek gerçek kapak yok
- [ ] Yayın öncesi kontrol: Lighthouse, hreflang testi, Search Console doğrulaması, contact formu uçtan uca test (sahibi: manuel checklist, `docs/plans/handoffs/faz-4-manual-checklist.md` bölüm 4-6, hiçbiri koşulmadı)

Bitti sayılma kriteri (launch gate): `grep -ri "alex chen\|techcorp\|startupxyz\|example.com" src content messages public .env.example` sıfır sonuç veriyor (kapsam bilerek bu beş yol; docs/ ve testin kendisi deseni içerir, `tests/no-template-residue.test.ts` aynı kapsamı kilitler); en az 4 gerçek proje ve 3 blog yazısı yayında ve her projede en az 1 gerçek ekran görüntüsü var (placeholder gradyan yok); Search Console'a gönderilen sitemap hatasız işleniyor; contact formu prod ortamda uçtan uca test edilmiş (gerçek e-posta ulaşıyor).

Gerçek sonuç (PR #6, main'e merge 2026-08-27; Faz 5 ile iki EN çeviri daha geldi, bugün 6 proje x 2 locale ve 3 EN + 3 TR yazı): şablon persona grep'i sıfır sonuç; 5 proje x 2 locale ve 4 blog yazısı (1 EN, 3 TR) yayında ama hiçbir projede ekran görüntüsü yok (`covers=0`, kapaksız yayın kuralı bilinçli olarak kullanılıyor); Search Console'a hiçbir şey gönderilmedi, contact formu prod ortamda test edilmedi (ikisi de manuel checklist'te). 32 dosya / 458 test, `verify:routes` "26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts)", build'de yalnızca `/api/contact` ve `/api/health` dynamic.

Büyüklük: L. En çok elle yazılan içerik burada, iki dilde.

**Bu fazın sonu launch noktasıdır.** Faz 5 yayın sonrası, launch'u bloklamaz.

### Faz 5: Altyapı vitrini ve ölçüm (yayın sonrası)

- [x] Gatus compose + config repoda (2026-08-28). **Karar değişikliği (2026-08-30):** Gatus tamamen kaldırıldı; gerçek izleme Coolify servis kataloğundan kurulan Uptime Kuma'da, `infra/` silindi.
- [x] Ana sayfaya systems bölümü (2026-08-28). **2026-08-30:** panel inceldi: üçüncü taraf verisi çekmez, build bilgisi + `NEXT_PUBLIC_STATUS_URL` linki gösterir; `status.ts` ve 60 sn revalidate kaldırıldı, ana sayfa tamamen statik.
- [x] Build-time commit SHA ve deploy zamanı widget'ta (`NEXT_PUBLIC_BUILD_SHA/DATE` + `build-info.ts`, 2026-08-28).
- [x] Umami: CSP + consent + layout entegrasyonu (2026-08-28). **2026-08-30:** merkezi kuruluma geçildi (`umami.dravcore.com`), repodaki compose silindi; site oraya website olarak eklenir.
- [x] Dependabot + CodeQL repoda; Renovate kaldırıldı (`security-automation.test.ts`, 2026-08-28).
- [ ] Coolify'da Uptime Kuma kurulumu, merkezi Umami'ye site kaydı ve portfolio env redeploy (manuel: `docs/plans/handoffs/faz-5-manual-checklist.md`).
- [x] Release akışı çalıştı: v0.2.0 (PR #8), v0.3.0 (PR #12), v0.3.1 (Faz 5 PR #31 + PR #32, 2026-08-28).
- [ ] Blog için aylık 1 yazı ritmi; ilk 3 ayın sonunda Astro'ya geçiş sorusunun yeniden değerlendirilmesi
- [x] Sitemap `x-default` üretimi (`src/app/sitemap.ts` `languagesFor`, 2026-08-28 UI/UX kapanış).
- [x] 404 global dokümanı pathname'den locale çıkarır (`x-pathname` proxy header + `global-not-found.tsx`, 2026-08-28).
- [x] 429/413 contact API metinleri `messages/*/api` kataloğundan gelir (2026-08-28).
- [x] Footer yılı build-time sabit (`buildInfo.year`, 2026-08-28).
- [x] BlogPosting JSON-LD `image` ve `publisher` alanları (2026-08-28).
- [x] `tests/no-template-residue.test.ts` dosya sistemi taraması (git bağımlılığı kaldırıldı, 2026-08-28).
- [x] `tests/messages.test.ts` namespace eşleşmesi yalnızca gerçek `useTranslations` namespace'leri için (2026-08-28).

(`/favicon.ico` sorunu Faz 4'te 308 -> `/icon` yönlendirmesiyle çözülmüştü; 2026-09-02'de yönlendirme kalktı, `src/app/favicon.ico` marka ICO'su olarak servis ediliyor. Burada ayrıca madde değil.)

Bitti sayılma kriteri (2026-08-30 kararıyla güncellendi): Uptime Kuma `/api/health` monitörüyle yayında ve bir bildirim kanalı test edildi; Systems paneli build bilgisini ve `NEXT_PUBLIC_STATUS_URL` linkini gösteriyor, sayfada hostname/port/IP yok; Dependabot en az bir dependency PR açmış veya merged (2026-08-28: dokuz PR merge edildi, kriter sağlandı); site merkezi Umami'ye (`umami.dravcore.com`) ekli ve sayfa yüklemesi CSP ihlali vermiyor. Runbook: `docs/runbooks/infrastructure.md`. Gerçek durum: Kuma kurulmadı, site kaydı yapılmadı, site 526.

### Denetim kapanışı (2026-08-28, dal `feature/audit-closure`)

Faz değil, 28 Ağustos denetiminin (162 bulgu) kod tarafında kapatılabilen her şeyini toplayan çapraz kesen bir tur; ayrıntı `docs/plans/handoffs/denetim-kapanisi-2026-08-28.md`.

- [x] Contact API: `Content-Type`/`Origin` zorunluluğu, CRLF reddi, `subject` kaldırıldı, `Reply-To`, 10 sn zaman aşımı, alan bazlı 400, `X-Request-Id` ve `X-RateLimit-*`, JSON log, `instrumentation.ts` env kontrolü; health gövdesi `{ status, checks: { content, mail }, timestamp }`.
- [x] İletişim formu: `noValidate` + çevrili alan bazlı doğrulama, `aria-invalid`/`aria-describedby`, kalıcı `aria-live`, `readOnly` kilidi, Retry-After geri sayımı, honeypot `extra_field` (sunucu karar verir), `autoComplete`.
- [x] Erişilebilirlik: dil değiştirici ve marka bağlantısında görünen metin korunur, `lang` attribute'u, tema düğmesi hidrasyon sabit + `aria-pressed`, about alt-nav `aria-current`, skip link odak işareti, mobil menü aktif sayfa, landmark temizliği, form kenarlıkları 3:1, 24px hedefler, 0.75rem etiket tabanı.
- [x] Performans: hero/yetkinlik/liste bölümleri ve contact sayfası sunucu bileşeni (SSR'da `opacity:0` yok), `motion` bağımlılığı ve provider kaldırıldı, simple-icons istemciden çıktı, `prefetch={false}`, Instrument Serif preload kapalı, latin-ext preload, metrik fallback fontları.
- [x] Güvenlik: HSTS (geçici olarak uygulamada), XFO/COOP/CORP, geniş Permissions-Policy, CSP `report-uri` + `/api/csp-report` + `CSP_REPORT_ONLY` ölçüm penceresi, `/cv` noindex ve cache, velite devDependencies (prod audit 0), Umami origin/CSP tutarlılık kontrolü, `data-domains`, proxy her yolda `x-pathname`, `https://` şema kısıtı.
- [x] SEO: OG görseli statik Geist TTF instance'ları ile (500 kapandı), `defaultTitle` + `siteName`, og:title şablonu, WebSite ve BreadcrumbList JSON-LD, `#person`/`#website` kimlikleri, BlogPosting image/publisher/dateModified, sitemap lastmod politikası, meta açıklama uzunlukları, hata sınırları (`error.tsx`, `global-error.tsx`), featured projeler ve boş durumlar, `resolveLocale`.
- [x] CI/DevOps: SHA pinli action'lar, dependency review, `npm audit --omit=dev`, format ve `verify:docs` adımları, coverage, docker smoke testi, cache'li Buildx build, digest pinli base image, npm cache mount, `timeout-minutes`, `verify:links` haftalık `links.yml`'e taşındı, `release.yml` `workflow_run`'a bağlı, Dependabot `infra/` dizinlerini tarıyor, `release:check` tag seçimi düzeltildi.
- [x] Status/infra: Gatus fetch zaman aşımı ve `allSettled`, JSON uyarı logu, zaman damgası doğrulama, Systems paneli tek PageSection, kontrast, locale'e göre tarih ve saat dilimi, build yılı `NEXT_PUBLIC_BUILD_DATE`'ten, Gatus alerting bloğu (`GATUS_ALERT_WEBHOOK_URL`), Umami ve Postgres imaj pinleri, `infra/README.md` kuralları.
- [x] Test altyapısı: tsconfig `noUncheckedIndexedAccess` ve kullanılmayan sembol kontrolleri, ESLint tipli kurallar ve `--max-warnings=0`, jsdom + Testing Library render testleri, çalışma zamanı testleri (OG PNG, RSS XML, sitemap x-default, draft filtresi, tek dilli fixture), plan testleri silindi ve doküman kontrolleri `verify:docs` script'ine taşındı.
- [ ] Sahibine kalanlar: panel/DNS adımları (bkz. Faz 1 ve Faz 5 checklist'leri), canlı sitenin 526'dan çıkarılması, `.sh` kararı, görsel onaylar, `CSP_REPORT_ONLY` ölçüm penceresi.

Büyüklük: S. Her madde bağımsız ve küçük, launch'u bekletmeden sırayla eklenebilir.

## Gerekçe

Fazlı ilerlemenin kendisi `00-ozet-ve-karar.md`'de "incremental-modernize" olarak karara bağlandı: aynı repo, aynı stack, fazlı dallar; silinen şey mimari değil içerik ve i18n plumbing'i, gerçek emek barındıran katman (shadcn bileşenleri, cva varyant matrisi, Resend entegrasyonu) yerinde kalıyor. Sıfırdan rewrite hem bunları çöpe atardı hem karşılığında hiçbir şey kazandırmazdı.

Faz sırasının mantığı bağımlılık zinciri: Faz 0 hiçbir şeye bağlı değil çünkü güvenlik yaması ve boilerplate temizliği i18n'den, tasarımdan, içerikten bağımsız; hemen başlanabilir. Faz 1 (deploy hattı) Faz 0'dan sonra geliyor çünkü Faz 2'den itibaren her fazın çıktısını canlıda veya preview'da doğrulamak gerekiyor, deploy hattı yoksa sonraki fazlar körlemesine ilerler. Faz 2 (i18n) kasıtlı olarak Faz 3'ten (tasarım) önce: route yapısı (`app/[lang]`) değişmeden tasarım bileşenlerini taşımak çifte iş demek. Faz 4 (içerik) en sona bırakıldı çünkü hem en çok elle emek isteyen faz hem de açık sorulara bağımlı (`11-acik-sorular.md`); şablon içerikle bile deploy hattı ve i18n test edilebiliyor, gerçek içeriğin gecikmesi launch'u değil yalnızca kendi fazını geciktirir. Faz 5 launch sonrası çünkü hiçbir maddesi ziyaretçinin siteyi kullanmasını etkilemiyor, yalnızca kimliği güçlendiriyor.

## Reddedilen alternatifler

- **Tek büyük PR / sıfırdan rewrite**: `00-ozet-ve-karar.md`'deki migrate-or-modernize kararının doğrudan reddettiği seçenek. Reddedilme gerekçesi: repo şu an temiz derleniyor, bu güvenlik ağını tek bir dev haftası boyunca kırmanın karşılığı yok.
- **Fazları paralel dallarda eş zamanlı yürütmek** (ör. Faz 2 ve Faz 4 aynı anda): i18n restructure route yapısını değiştiriyor, içerik katmanı o yapının üstüne yazılıyor; paralel yürütmek merge çatışmasını ve çifte işi garantiler.
- **İçeriği en başta yapmak**: Cazip görünüyor çünkü asıl amaç şablon içeriği kaldırmak, ama açık sorulara (CV PDF, sertifika linkleri, ekran görüntüsü izinleri) bağlı olduğu için önce yapılırsa diğer fazları bloklar. Şablon içerikle deploy hattı ve i18n'i test etmek daha güvenli.
- **Faz 5'i launch'tan önce yapmak**: Gatus/Umami/Dependabot hiçbiri ziyaretçi deneyimini değiştirmiyor, launch'u geciktirmenin YAGNI'ye aykırı bir bedeli olurdu.

## Uygulama durumu (2026-08-27)

- **Faz 0** (main, PR #2): next 16.3.3, eslint-config-next 16.3.3, motion 13.1.1 (framer-motion kaldırıldı), edge runtime kaldırıldı, `next.config.ts` `output: "standalone"` + `poweredByHeader: false` + güvenlik başlıkları/CSP, `.nvmrc` 24 + `engines >=20.9`, `/api/health`, contact sertleştirmesi (`rate-limit.ts`, `contact-validation.ts`, `request-body.ts`, `client-ip.ts`), `NEXT_PUBLIC_SITE_URL` `.env.example`'da, `example.com` kalıntısı sıfır. Doğrulama: 6 dosya / 60 test. Sapma: CSP `script-src 'self' 'unsafe-inline'` ile nonce'suz kuruldu (nonce tüm route'ları dynamic yapardı), Faz 5'te Umami ile yeniden ele alınacak. Açık: `TRUST_CF_CONNECTING_IP=false`, `npm audit` 17 transitif bulgu, lucide-react/shadcn/typescript major'ları ayrı PR.
- **Faz 1** (main, PR #3): Dockerfile + `.dockerignore` + CI (`checks`: lint/typecheck/test/build; `docker`: hadolint + image build) kod tarafı tamam ve yerelde doğrulandı (10 dosya / 101 test, düzeltme turuyla 13 dosya / 125 test); panel adımlarının (Coolify, Cloudflare, Traefik, Resend) hiçbiri uygulanmadı, sahibinin manuel listesi `docs/plans/handoffs/faz-1-manual-checklist.md`. Karar: `.sh -> .com` 301 Cloudflare Redirect Rule (Traefik redirectregex yedek; yön 2026-08-27 karar değişikliğiyle ters çevrildi, PR #3 sırasında ana domain `.sh` idi), origin kilidi DOCKER-USER iptables, Cloudflare free rate limiting 3 istek/10sn, PR preview'lar DNS-only + admin IP.
- **Faz 2** (main, PR #4): `app/[lang]`, next-intl 4.13.7 (`routing.ts`, `i18n/request.ts`, `proxy.ts`), `messages/en.json` + `tr.json`, eski `translations.ts`/`locale-provider` silindi, canonical + hreflang + x-default, Person JSON-LD, dil değiştirici URL tabanlı. Doğrulama: 19 dosya / 207 test (düzeltme turuyla 20 dosya / 271 test), `verify:routes` "20 content routes prerendered (6 project pages per locale)". Sapma: her sayfa kendi `openGraph` nesnesini kuruyor (Next çocuk `openGraph`'ı birleştirmiyor, değiştiriyor).
- **Faz 3** (main, PR #5): Geist/Geist Mono/Instrument Serif vendor woff2, nötr oklch token seti, mobil menü (Radix Dialog), LazyMotion + `m` (stagger 40ms), erişilebilirlik (skip link, solid focus ring, role=alert/status, 24px hedef), OG image + icon gerçek kimlik (DCY monogram), `project-card` Link + `::after` kalıbı. Doğrulama: 27 dosya / 367 test. Açık: SSR HTML'de gizli hareket varyantı (`opacity:0`) hidrasyona kadar, tarayıcıda ekran görüntüsü turu yapılmadı.
- **Faz 4** (dal `feature/faz-4-icerik-ve-yayin`, PR #6, main'e merge 2026-08-27; aşağıdaki sayılar PR açıkken alınmış tarihsel değerlerdir): velite 0.4.0, 5 proje x 2 locale + 1 EN yazı + 3 TR yazı, `src/data/projects.ts` ve `skills.ts` silindi, `src/content/profile.ts` (speaking boş, certificates `verifyUrl` tanımsız), CV PDF `public/cv/dogancanyildiz-cv.pdf` commit'li. Doğrulama: 32 dosya / 458 test, `verify:routes` "26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts)", build yalnızca `/api/contact` ve `/api/health` dynamic, şablon persona kalıntısı sıfır. Sapmalar: hero/header yeniden tasarlandı (metrik kartları ve "available for work" rozeti yok), form konu alanı kaldırıldı, blog TR-first, task sırası değişti (ayrıntı `docs/plans/handoffs/faz-4.md` "Plandan sapmalar", 26 madde). Merge kararı sahibinde; sahibinin teslimatı bekleniyor: Konuşmalar verisi, sertifika `verifyUrl`'leri, proje kapakları, birinci şahıs metin onayı, CV içeriği onayı, Wikonya canlı site adı, ticket repo linki (bkz. `11-acik-sorular.md` "Teslimat durumu").
- **Faz 5** (PR #31, main'e merge 2026-08-28, v0.3.1): Gatus ve Umami compose dosyaları, `status.ts` + Systems bölümü, build SHA/tarih, CSP'de Umami origin'i, x-default, 404 locale, footer yılı, iki EN blog çevirisi; Coolify/Cloudflare panel adımları `docs/plans/handoffs/faz-5-manual-checklist.md` ile açık.
- **Denetim kapanışı** (dal `feature/audit-closure`, 2026-08-28): yukarıdaki alt bölüm; kapılar birleşik ağaçta yeşil (typecheck, lint `--max-warnings=0`, vitest, prettier, build 35 statik sayfa + 3 dinamik API rotası, `verify:routes` 32 içerik rotası, `verify:docs`). PR #34 ile dev'e merge edildi (2026-08-29).
- **Kapanış sonrası** (dev, 2026-08-29..09-02): PR #35 (topic alanı, consent, /privacy, WhatsApp) ve PR #36 (TR varsayılan locale, yerelleştirilmiş URL'ler, 308 tablosu) başka oturumlarda; PR #37 gözlemlenebilirlik panele (Uptime Kuma + merkezi Umami) + Mailcow SMTP + dil değiştirici blocker düzeltmesi; PR #39 ultrareview kapanışı (Dockerfile `NEXT_PUBLIC_STATUS_URL` ARG'ı + bayat referans süpürmesi + `SMTP_*` sızıntı bekçileri); PR #40 bağımlılık grubu (next-intl 4.14.1 dahil dört minor/patch). Ayrıntı `docs/plans/handoffs/denetim-kapanisi-2026-08-28.md` ek notlarında.
- **3. tur** (dal `feature/audit-followups`, 2026-09-02, PR #44 `dev`'e merge): 5 dosya-ayrık küme (frontend-perf, ui-a11y, backend, seo-i18n-content, test-quality-deps) + kontrol oturumu; 31 Ağustos incelemesinin V-2..V-18 maddelerinin neredeyse tamamı kapandı (ayrıntı `audit/acik-kalanlar.md` bölüm 11). Turun kendi kapıları geçici olarak typecheck kırığı gösterdi (`src/i18n/navigation.ts:21`, T-18'in next-intl `AppConfig` augmentation'ından); aynı gün bir düzeltme turuyla kapandı, PR #44 tsc/lint/test/format/build/verify:routes/verify:docs hepsi yeşilken merge edildi (merge commit `c0156c0`).
- **Marka ve içerik turu** (dal `feature/brand-assets`, taban PR #44'ün merge commit'i `c0156c0`, 2026-09-02, 62 commit, HEAD `a03fa4b`): sahibinin logo export'u siteye bağlandı (marka işareti + lockup, statik ikonlar, yeni OG düzeni), header/footer lockup'a geçti ve dil/tema kontrolleri düzleşti, yazı ve proje sayfalarına paylaş bloğu eklendi, sertifika bölümü on üç kayıt + rozet görselleri + tıklanabilir önizleme + anahtar kelime satırlarına genişledi, altıncı proje (Köklü Hukuk) ilk kapaklı yayın olarak eklendi, TR tarafı tamamen Türkçe yollara taşındı (`translationKey` bazlı çeviri, üç 308 tablosu, V-5'in kapanışı) ve kanonik host `www.dogancanyildiz.com` oldu. Kapılar: tsc 0, lint 0, 81 dosya/1258 test, build 44 sayfa, `verify:routes` 41 rota, `verify:docs` 21 dosya, sitemap 30 URL. Devir notu: `docs/plans/handoffs/marka-ve-icerik-2026-09-02.md`.

## Riskler ve tripwire'lar

- **Faz 2 tek büyük PR**: i18n restructure'ın kapsamı geniş (route yapısı + middleware + metadata + sitemap). Tripwire: dal 5 iş gününü aşarsa route taşıma ile next-intl kurulumu iki ayrı, ardışık PR'a bölünür; asıl kural (tek dal disiplini) bozulmaz, yalnızca faz ikiye ayrılır.
- **next-intl bağımlılık riski**: `setRequestLocale` disiplini yüzünden route'lar sessizce dynamic'e düşerse veya next-intl bir Next major'ında takılırsa, bağımlılıksız elle `[lang]` yoluna dönülür (bkz. `04-i18n.md`). Bu geri dönüş Faz 2'nin kapsamını değiştirmez, yalnızca uygulama detayını.
- **Coolify health check bug'ı (coollabsio/coolify#7500)**: Node.js container'larda connection-refused sorunu bilinen bir açık; Faz 1'de staging'de ayrıca doğrulanmadan production'a health check bağlanmamalı.
- **Velite 0.x sürüm riski**: exact pin (0.4.0) ve lockfile commit ile sınırlandı, Faz 4'te (PR #6) bu haliyle kuruldu; ileride bir sürüm atlaması gerekirse aynı kilit disiplini korunmalı.
- **Sunucu RAM/CPU: geçerli değil.** Sahibi 2026-08-27'de sunucunun yeterli olduğunu doğruladı; `next build` OOM riski ve ayrı build sunucusu/erken GHCR geçişi ihtiyacı ortadan kalktı, bkz. `11-acik-sorular.md` soru 7.
- **Faz 4'ün açık sorulara bağımlılığı büyük ölçüde çözüldü**: CV PDF, sertifika doğrulama linkleri, Speaking bölümü ve proje görselleri kararları 2026-08-27'de netleşti (buton kalıyor, `verifyUrl` alanı var, Speaking About içinde, projeler public); kalan bağımlılık yalnızca somut dosyaların (CV PDF, sertifika linkleri, ekran görüntüleri) teslim edilmesi, bkz. `11-acik-sorular.md`.

## Uygulama notları

- Her faz kendi dalında açılır, tek PR olarak main'e merge edilir; bir sonraki faz merge'den önce başlamaz.
- GitHub Actions kapısı (lint + `tsc --noEmit` + build) Faz 1'den itibaren her PR'da zorunlu; Faz 0 bu kapı henüz kurulmadan elle çalıştırılır.
- Faz içi commit sayısı serbest, ama PR açıklaması fazın hedefini ve bitti sayılma kriterini referans vermeli.
- Büyüklük tahminleri (S/M/L) saat değil göreli iş hacmi; sıralama veya kapsam kararı için kullanılır, planlama taahhüdü değildir.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [01-mevcut-durum-denetimi.md](./01-mevcut-durum-denetimi.md)
- [02-stack-karari.md](./02-stack-karari.md)
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md)
- [04-i18n.md](./04-i18n.md)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md)
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md)
- [09-guvenlik.md](./09-guvenlik.md)
- [11-acik-sorular.md](./11-acik-sorular.md)

## Kaynaklar

- https://github.com/coollabsio/coolify/issues/7500
- https://github.com/vercel/next.js/issues/91653
- https://github.com/vercel/next.js/issues/88844
