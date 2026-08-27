# Fazlı Yol Haritası

Durum: Kısmen uygulandı (Faz 0-3 main'de, Faz 4 PR #6 açık ve CI yeşil), kalan: Faz 4 merge kararı, Faz 5 (Gatus, Umami, Renovate) · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Modernizasyon 6 fazda yürütülür: Faz 0'dan Faz 5'e kadar sıralı, her faz kendi dalında ve tek PR'da biter, main'e merge edilmeden bir sonraki faz başlamaz. Sıralamanın mantığı basit: önce hemen kapatılması gereken güvenlik açıkları ve boilerplate temizliği (Faz 0), sonra her sonraki fazın canlıda doğrulanabilmesi için deploy hattı (Faz 1), ardından tek seferde bitirilmesi gereken büyük mimari kırılma olan i18n restructure (Faz 2), üstüne tasarım sistemi (Faz 3), en son da asıl amaç olan gerçek içerik ve yayın (Faz 4). Faz 4'ün sonu launch noktasıdır. Faz 5 (Gatus, Umami, Renovate) yayın sonrasına bırakılır çünkü hiçbiri launch için zorunlu değildir. Repo şu an `tsc --noEmit` ve eslint'ten temiz geçiyor; bu güvenlik ağı her fazın sonunda korunmak zorunda, aksi halde fazlı ilerlemenin tüm amacı (her adımda çalışan bir site) boşa düşer.

## Karar(lar)

Faz sırası ve kapsamı aşağıdaki tabloda özetleniyor, ayrıntılı madde listeleri ve bitiş kriterleri alt başlıklarda.

| Faz | Hedef | Çıktı | Bağımlılık | Büyüklük | Durum | PR |
|---|---|---|---|---|---|---|
| Faz 0 | Bilinen güvenlik açıklarını kapatmak, üretime hazır Next yapılandırması bırakmak, ölü boilerplate'i temizlemek | next 16.3.3, güvenlik başlıkları + CSP, sertleşmiş contact route, `/api/health` | Yok, hemen başlanabilir | M | Uygulandı, main'de | #2 |
| Faz 1 | Her push'ta otomatik yayın, PR'larda preview URL, doğru domain yönlendirmesi | Çok aşamalı Dockerfile + Coolify GitHub App entegrasyonu + Traefik 301 | Faz 0 | L | Kısmen uygulandı (kod main'de, panel adımları sahibinde) | #3 |
| Faz 2 | İki dil ayrı URL'lerde, tüm içerik route'ları build'de prerender, doğru hreflang/canonical | `app/[lang]` + next-intl 4.13.7 kurulumu | Faz 1 | L | Uygulandı, main'de | #4 |
| Faz 3 | Tipografi gerçekten yüklensin, palet nötrlensin, mobilde site gezilebilir olsun | Vendor'lanmış fontlar, nötr token seti, mobil menü, hareket/erişilebilirlik toparlaması | Faz 2 | M | Uygulandı, main'de | #5 |
| Faz 4 | Şablon persona tamamen gitsin, gerçek case study'ler ve ilk blog yazıları yayına çıksın | Velite içerik pipeline'ı, gerçek proje/blog sayfaları, iki dilli çeviri | Faz 3 | L | PR açık, CI yeşil, merge kararı sahibinde | #6 |
| Faz 5 | Self-host kimliğini iddia değil gösterim haline getirmek, bakımı otomatikleştirmek | Gatus widget, Umami, Renovate/Dependabot | Faz 4 (yayın sonrası) | S | Başlamadı | - |

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
- [ ] **Karar değişikliği (2026-08-27):** dogancanyildiz.com apex + www ana domain (Cloudflare Redirect Rules'ta www -> apex dahil, Coolify dahili www ayarı kullanılmaz), dogancanyildiz.sh apex + www yalnızca Cloudflare'da proxied bir kayıt olarak origin'e ulaşmadan .sh -> .com 301'i **Cloudflare Redirect Rules**'ta tek atlamada (Traefik redirectregex yalnızca yedek yol olarak Coolify'da tanımlı kalır, bkz. [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 7-8) (sahibi: manuel checklist; tarihsel madde metni ".sh ana, .com 301" idi, `11-acik-sorular.md` soru 5 artık cevaplandı, panele alınması bekliyor)
- [ ] Cloudflare DNS proxied mod (turuncu bulut) açılır, SSL modu Full (strict) set edilir (sahibi: manuel checklist, `docs/deploy/cloudflare-kurulum.md`)
- [ ] Traefik entrypoint'inde `forwardedHeaders.trustedIPs` Cloudflare IP listesiyle set edilir, contact rate limit anahtarı `CF-Connecting-IP` olur (sahibi: manuel checklist; kod tarafı hazır (`TRUST_CF_CONNECTING_IP` bayrağı), env hâlâ `false`)
- [ ] Origin'i yalnızca Cloudflare IP'lerinden erişilebilir kılmak (DOCKER-USER iptables kuralları; ufw tek başına Docker'ın yayınladığı portları filtrelemiyor), önerilir (sahibi: manuel checklist, `docs/deploy/traefik-ve-origin.md`)
- [ ] Cloudflare cache kuralı `_next/static/*` ve `public/` görselleri için, `/api/contact` için Cloudflare Rate Limiting kuralı (free planda 3 istek/10sn), Bot Fight Mode açık (sahibi: manuel checklist)
- [ ] Traefik'te HSTS ve compress middleware'i, streaming için buffering kapatma (sahibi: manuel checklist)
- [ ] Coolify env değişkenleri Build/Runtime olarak ayrılır (`NEXT_PUBLIC_SITE_URL` Build; `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL` Runtime) (sahibi: manuel checklist)
- [ ] Resend'de dogancanyildiz.com domain doğrulaması (SPF/DKIM/DMARC) (sahibi: manuel checklist, `docs/deploy/resend-domain.md`; FROM_EMAIL contact@dogancanyildiz.com, alıcı me@dogancanyildiz.com)

Bitti sayılma kriteri: main'e merge edilen bir commit Coolify'da otomatik deploy tetikliyor ve site canlıda ayakta; test PR'ı açıldığında preview URL üretiliyor; `curl -I https://dogancanyildiz.sh/herhangi-bir-yol` tek atlamada `https://dogancanyildiz.com/herhangi-bir-yol`'a 301 dönüyor; Coolify sağlık kontrolü yeşil.

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

Bitti sayılma kriteri: `next build` çıktısında yalnızca `/api/*` route'ları dynamic işaretli, geri kalan tüm içerik route'ları statik (SSG); `/` ve `/tr` farklı içerik ve farklı `<html lang>` döndürüyor; bir hreflang test aracıyla (ör. technicalseo.com hreflang tag generator/tester) self-referencing ve karşılıklı hreflang hatasız çıkıyor.

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
- [ ] `src/data/projects.ts` kaldırılır, projeler 4-5 gerçek case study olarak yazılır (Cargo Pilot ve Bilet Satın Alma öncelikli, tüm Divizyon projeleri public), her biri mono künye + `liveUrl`/`repoUrl` + en az 1 ekran görüntüsü ile (görsel gelene kadar kapaksız): veri katmanı ve 5 case study (EN+TR, 10 dosya) tamam, ekran görüntüsü kısmı henüz teslim edilmedi (sahibi: manuel checklist, `content/images/` boş, `covers=0`, kapaksız yayın kuralıyla devam ediyor)
- [ ] Hero, About, Contact metinleri `portfolio-content.md`'den yazılır; sertifikalar `verifyUrl` alanıyla (link gelene kadar boş) listelenir; Speaking, ayrı sayfa değil About içinde medyasız kompakt bir "Konuşmalar" bloğu (etkinlik · konu · tarih) olarak eklenir: metinler ve şema (`src/content/profile.ts`) yazıldı, sertifika `verifyUrl` değerleri ve Konuşmalar verisi henüz teslim edilmedi (sahibi: manuel checklist, ikisi de şu an boş/tanımsız, alan opsiyonel)
- [x] CV PDF dosyası `public/cv/dogancanyildiz-cv.pdf` yoluna konur (teslim edilene kadar `.local/` altında tutulur), hero/about'taki `/cv.pdf` linki bu yola güncellenir; Download CV butonu kalır (PR #6 dalında commit'li; içerik onayı sahibinde)
- [x] Tüm Alex Chen, alex@example.com, placeholder sosyal link ve example.com kalıntıları silinir, logo DCY olur
- [x] TR çeviriler yazılır; blog TR-first (yazılar önce Türkçe, uluslararası ilgi görecek olanlar EN'e çevrilir), çevirisi olmayan içerik o dilin sitemap ve hreflang alternates'ine eklenmez
- [x] İlk 3-4 blog yazısı; blog listesi, detay sayfası, BlogPosting JSON-LD, sitemap entegrasyonu (3 TR + 1 EN çeviri)
- [x] Görseller `next/image` ile (sizes tanımlı, remotePatterns yok): kod hazır (`project-card.tsx`, `[slug]/page.tsx`), henüz gösterilecek gerçek kapak yok
- [ ] Yayın öncesi kontrol: Lighthouse, hreflang testi, Search Console doğrulaması, contact formu uçtan uca test (sahibi: manuel checklist, `docs/plans/handoffs/faz-4-manual-checklist.md` bölüm 4-6, hiçbiri koşulmadı)

Bitti sayılma kriteri (launch gate): repoda `grep -ri "alex chen\|techcorp\|startupxyz\|example.com"` sıfır sonuç veriyor; en az 4 gerçek proje ve 3 blog yazısı yayında ve her projede en az 1 gerçek ekran görüntüsü var (placeholder gradyan yok); Search Console'a gönderilen sitemap hatasız işleniyor; contact formu prod ortamda uçtan uca test edilmiş (gerçek e-posta ulaşıyor).

Gerçek sonuç (PR #6, açık, CI yeşil, henüz merge edilmedi): şablon persona grep'i sıfır sonuç; 5 proje x 2 locale ve 4 blog yazısı (1 EN, 3 TR) yayında ama hiçbir projede ekran görüntüsü yok (`covers=0`, kapaksız yayın kuralı bilinçli olarak kullanılıyor); Search Console'a hiçbir şey gönderilmedi, contact formu prod ortamda test edilmedi (ikisi de manuel checklist'te). 32 dosya / 458 test, `verify:routes` "26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts)", build'de yalnızca `/api/contact` ve `/api/health` dynamic.

Büyüklük: L. En çok elle yazılan içerik burada, iki dilde.

**Bu fazın sonu launch noktasıdır.** Faz 5 yayın sonrası, launch'u bloklamaz.

### Faz 5: Altyapı vitrini ve ölçüm (yayın sonrası)

- [ ] Gatus container'ı Coolify'da kurulur, izlenecek endpoint'ler ve public görünürlük bilinçli seçilir
- [ ] Ana sayfaya systems bölümü: sunucu tarafında 60 saniye revalidate ile Gatus JSON'undan beslenen, yalnızca agregat veri gösteren widget
- [ ] Build-time commit SHA ve deploy zamanı env olarak image'a gömülür ve widget'ta gösterilir
- [ ] Umami container'ı (self-hosted, çerezsiz analytics; Node + Postgres) ve CSP uyumlu script entegrasyonu kurulur; kurulum kesinleşti, koşullu değil (bkz. `11-acik-sorular.md` soru 11)
- [ ] Renovate/Dependabot: patch ve minor otomatik merge, Coolify otomatik redeploy; Next aylık güvenlik yayınları takibi
- [ ] Blog için aylık 1 yazı ritmi; ilk 3 ayın sonunda Astro'ya geçiş sorusunun yeniden değerlendirilmesi
- [ ] Faz 4 devri: sitemap `x-default` üretimi (sayfa `<head>`'i üretiyor, `sitemap.ts` üretmiyor, ikisi uyuşmuyor)
- [ ] Faz 4 devri: `tests/no-template-residue.test.ts`'in `git ls-files` bağımlılığını gider (tarball'da çalışmıyor, yalnızca izlenen dosyaları görüyor)
- [ ] Faz 4 devri: `tests/messages.test.ts` sezgisini sıkılaştır (namespace+kalan sezgisi 211 kombinasyonda yanlış pozitif verebiliyor)
- [ ] Faz 4 devri: 404 dokümanını locale'e duyarlı hale getir (`global-not-found.tsx` her zaman `<html lang="en">`, `/tr/blog/nope` da İngilizce doküman alıyor)
- [ ] Faz 4 devri: 429/413 hata metinlerini TR/EN'e çevir (hâlâ İngilizce sabit)
- [ ] Faz 4 devri: header'da "Contact" tekrarını gider (nav listesi + CTA aynı anda gösteriyor)
- [ ] Faz 4 devri: footer yılını build-time'a sabitle (istemci `new Date().getFullYear()` ile hesaplıyor, yılbaşında hidrasyon uyuşmazlığı riski)

(`/favicon.ico` sorunu Faz 4'te çözüldü: `next.config.ts` `redirects()` ile 308 -> `/icon`; burada ayrıca madde değil.)

Bitti sayılma kriteri: status widget canlı Gatus verisiyle çalışıyor ve Network sekmesinde hostname/port/IP hiç görünmüyor (yalnızca takma ad + yüzde + zaman damgası); Renovate en az bir otomatik PR açmış; Umami kuruluysa sayfa yüklemesi CSP ihlali vermiyor.

Büyüklük: S. Her madde bağımsız ve küçük, launch'u bekletmeden sırayla eklenebilir.

## Gerekçe

Fazlı ilerlemenin kendisi `00-ozet-ve-karar.md`'de "incremental-modernize" olarak karara bağlandı: aynı repo, aynı stack, fazlı dallar; silinen şey mimari değil içerik ve i18n plumbing'i, gerçek emek barındıran katman (shadcn bileşenleri, cva varyant matrisi, Resend entegrasyonu) yerinde kalıyor. Sıfırdan rewrite hem bunları çöpe atardı hem karşılığında hiçbir şey kazandırmazdı.

Faz sırasının mantığı bağımlılık zinciri: Faz 0 hiçbir şeye bağlı değil çünkü güvenlik yaması ve boilerplate temizliği i18n'den, tasarımdan, içerikten bağımsız; hemen başlanabilir. Faz 1 (deploy hattı) Faz 0'dan sonra geliyor çünkü Faz 2'den itibaren her fazın çıktısını canlıda veya preview'da doğrulamak gerekiyor, deploy hattı yoksa sonraki fazlar körlemesine ilerler. Faz 2 (i18n) kasıtlı olarak Faz 3'ten (tasarım) önce: route yapısı (`app/[lang]`) değişmeden tasarım bileşenlerini taşımak çifte iş demek. Faz 4 (içerik) en sona bırakıldı çünkü hem en çok elle emek isteyen faz hem de açık sorulara bağımlı (`11-acik-sorular.md`); şablon içerikle bile deploy hattı ve i18n test edilebiliyor, gerçek içeriğin gecikmesi launch'u değil yalnızca kendi fazını geciktirir. Faz 5 launch sonrası çünkü hiçbir maddesi ziyaretçinin siteyi kullanmasını etkilemiyor, yalnızca kimliği güçlendiriyor.

## Reddedilen alternatifler

- **Tek büyük PR / sıfırdan rewrite**: `00-ozet-ve-karar.md`'deki migrate-or-modernize kararının doğrudan reddettiği seçenek. Reddedilme gerekçesi: repo şu an temiz derleniyor, bu güvenlik ağını tek bir dev haftası boyunca kırmanın karşılığı yok.
- **Fazları paralel dallarda eş zamanlı yürütmek** (ör. Faz 2 ve Faz 4 aynı anda): i18n restructure route yapısını değiştiriyor, içerik katmanı o yapının üstüne yazılıyor; paralel yürütmek merge çatışmasını ve çifte işi garantiler.
- **İçeriği en başta yapmak**: Cazip görünüyor çünkü asıl amaç şablon içeriği kaldırmak, ama açık sorulara (CV PDF, sertifika linkleri, ekran görüntüsü izinleri) bağlı olduğu için önce yapılırsa diğer fazları bloklar. Şablon içerikle deploy hattı ve i18n'i test etmek daha güvenli.
- **Faz 5'i launch'tan önce yapmak**: Gatus/Umami/Renovate hiçbiri ziyaretçi deneyimini değiştirmiyor, launch'u geciktirmenin YAGNI'ye aykırı bir bedeli olurdu.

## Uygulama durumu (2026-08-27)

- **Faz 0** (main, PR #2): next 16.3.3, eslint-config-next 16.3.3, motion 13.1.1 (framer-motion kaldırıldı), edge runtime kaldırıldı, `next.config.ts` `output: "standalone"` + `poweredByHeader: false` + güvenlik başlıkları/CSP, `.nvmrc` 24 + `engines >=20.9`, `/api/health`, contact sertleştirmesi (`rate-limit.ts`, `contact-validation.ts`, `request-body.ts`, `client-ip.ts`), `NEXT_PUBLIC_SITE_URL` `.env.example`'da, `example.com` kalıntısı sıfır. Doğrulama: 6 dosya / 60 test. Sapma: CSP `script-src 'self' 'unsafe-inline'` ile nonce'suz kuruldu (nonce tüm route'ları dynamic yapardı), Faz 5'te Umami ile yeniden ele alınacak. Açık: `TRUST_CF_CONNECTING_IP=false`, `npm audit` 17 transitif bulgu, lucide-react/shadcn/typescript major'ları ayrı PR.
- **Faz 1** (main, PR #3): Dockerfile + `.dockerignore` + CI (`checks`: lint/typecheck/test/build; `docker`: hadolint + image build) kod tarafı tamam ve yerelde doğrulandı (10 dosya / 101 test, düzeltme turuyla 13 dosya / 125 test); panel adımlarının (Coolify, Cloudflare, Traefik, Resend) hiçbiri uygulanmadı, sahibinin manuel listesi `docs/plans/handoffs/faz-1-manual-checklist.md`. Karar: `.com -> .sh` 301 Cloudflare Redirect Rule (Traefik redirectregex yedek), origin kilidi DOCKER-USER iptables, Cloudflare free rate limiting 3 istek/10sn, PR preview'lar DNS-only + admin IP.
- **Faz 2** (main, PR #4): `app/[lang]`, next-intl 4.13.7 (`routing.ts`, `i18n/request.ts`, `proxy.ts`), `messages/en.json` + `tr.json`, eski `translations.ts`/`locale-provider` silindi, canonical + hreflang + x-default, Person JSON-LD, dil değiştirici URL tabanlı. Doğrulama: 19 dosya / 207 test (düzeltme turuyla 20 dosya / 271 test), `verify:routes` "20 content routes prerendered (6 project pages per locale)". Sapma: her sayfa kendi `openGraph` nesnesini kuruyor (Next çocuk `openGraph`'ı birleştirmiyor, değiştiriyor).
- **Faz 3** (main, PR #5): Geist/Geist Mono/Instrument Serif vendor woff2, nötr oklch token seti, mobil menü (Radix Dialog), LazyMotion + `m` (stagger 40ms), erişilebilirlik (skip link, solid focus ring, role=alert/status, 24px hedef), OG image + icon gerçek kimlik (DCY monogram), `project-card` Link + `::after` kalıbı. Doğrulama: 27 dosya / 367 test. Açık: SSR HTML'de gizli hareket varyantı (`opacity:0`) hidrasyona kadar, tarayıcıda ekran görüntüsü turu yapılmadı.
- **Faz 4** (dal `feature/faz-4-icerik-ve-yayin`, PR #6, açık, CI yeşil, HEAD `8b4fe40`, 21 commit): velite 0.4.0, 5 proje x 2 locale + 1 EN yazı + 3 TR yazı, `src/data/projects.ts` ve `skills.ts` silindi, `src/content/profile.ts` (speaking boş, certificates `verifyUrl` tanımsız), CV PDF `public/cv/dogancanyildiz-cv.pdf` commit'li. Doğrulama: 32 dosya / 458 test, `verify:routes` "26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts)", build yalnızca `/api/contact` ve `/api/health` dynamic, şablon persona kalıntısı sıfır. Sapmalar: hero/header yeniden tasarlandı (metrik kartları ve "available for work" rozeti yok), form konu alanı kaldırıldı, blog TR-first, task sırası değişti (ayrıntı `docs/plans/handoffs/faz-4.md` "Plandan sapmalar", 26 madde). Merge kararı sahibinde; sahibinin teslimatı bekleniyor: Konuşmalar verisi, sertifika `verifyUrl`'leri, proje kapakları, birinci şahıs metin onayı, CV içeriği onayı, Wikonya canlı site adı, ticket repo linki (bkz. `11-acik-sorular.md` "Teslimat durumu").
- **Faz 5**: başlamadı.

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
