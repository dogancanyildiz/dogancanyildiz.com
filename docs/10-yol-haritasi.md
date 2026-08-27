# Fazlı Yol Haritası

Durum: Öneri, site sahibinin onayını bekliyor · Tarih: 2026-08-27 · Kapsam: dogancanyildiz.sh

## Özet

Modernizasyon 6 fazda yürütülür: Faz 0'dan Faz 5'e kadar sıralı, her faz kendi dalında ve tek PR'da biter, main'e merge edilmeden bir sonraki faz başlamaz. Sıralamanın mantığı basit: önce hemen kapatılması gereken güvenlik açıkları ve boilerplate temizliği (Faz 0), sonra her sonraki fazın canlıda doğrulanabilmesi için deploy hattı (Faz 1), ardından tek seferde bitirilmesi gereken büyük mimari kırılma olan i18n restructure (Faz 2), üstüne tasarım sistemi (Faz 3), en son da asıl amaç olan gerçek içerik ve yayın (Faz 4). Faz 4'ün sonu launch noktasıdır. Faz 5 (Gatus, Umami, Renovate) yayın sonrasına bırakılır çünkü hiçbiri launch için zorunlu değildir. Repo şu an `tsc --noEmit` ve eslint'ten temiz geçiyor; bu güvenlik ağı her fazın sonunda korunmak zorunda, aksi halde fazlı ilerlemenin tüm amacı (her adımda çalışan bir site) boşa düşer.

## Karar(lar)

Faz sırası ve kapsamı aşağıdaki tabloda özetleniyor, ayrıntılı madde listeleri ve bitiş kriterleri alt başlıklarda.

| Faz | Hedef | Çıktı | Bağımlılık | Büyüklük |
|---|---|---|---|---|
| Faz 0 | Bilinen güvenlik açıklarını kapatmak, üretime hazır Next yapılandırması bırakmak, ölü boilerplate'i temizlemek | next 16.3.3, güvenlik başlıkları + CSP, sertleşmiş contact route, `/api/health` | Yok, hemen başlanabilir | M |
| Faz 1 | Her push'ta otomatik yayın, PR'larda preview URL, doğru domain yönlendirmesi | Çok aşamalı Dockerfile + Coolify GitHub App entegrasyonu + Traefik 301 | Faz 0 | L |
| Faz 2 | İki dil ayrı URL'lerde, tüm içerik route'ları build'de prerender, doğru hreflang/canonical | `app/[lang]` + next-intl 4.13.7 kurulumu | Faz 1 | L |
| Faz 3 | Tipografi gerçekten yüklensin, palet nötrlensin, mobilde site gezilebilir olsun | Vendor'lanmış fontlar, nötr token seti, mobil menü, hareket/erişilebilirlik toparlaması | Faz 2 | M |
| Faz 4 | Şablon persona tamamen gitsin, gerçek case study'ler ve ilk blog yazıları yayına çıksın | Velite içerik pipeline'ı, gerçek proje/blog sayfaları, iki dilli çeviri | Faz 3 | L |
| Faz 5 | Self-host kimliğini iddia değil gösterim haline getirmek, bakımı otomatikleştirmek | Gatus widget, Umami, Renovate/Dependabot | Faz 4 (yayın sonrası) | S |

Ayrıntı: `00-ozet-ve-karar.md` genel kararın gerekçesini, `02-stack-karari.md` neden Next.js'te kalındığını anlatıyor; burada yalnızca fazlara bölünmüş uygulama sırası var.

### Faz 0: Güvenlik ve hijyen (hemen, yayından bağımsız)

- [ ] next 16.1.6 -> 16.3.3, eslint-config-next 16.3.3, package-lock.json normalize edilip commit
- [ ] framer-motion ^12 -> motion 13.1.1, import'lar `motion/react`'e taşınır
- [ ] `src/app/opengraph-image.tsx:3`'teki `export const runtime = "edge"` silinir
- [ ] `next.config.ts`: `output: 'standalone'`, `poweredByHeader: false`, `headers()` ile güvenlik başlıkları ve CSP
- [ ] `.nvmrc` (24) + `package.json` `engines.node >=20.9`, typecheck ve format script'leri eklenir
- [ ] `src/app/api/health/route.ts` eklenir
- [ ] Contact sertleştirmesi: sunucu taraflı honeypot, IP rate limit, uzunluk sınırları, email regex, jenerik hata mesajı, prod'da zorunlu env kontrolü
- [ ] `NEXT_PUBLIC_SITE_URL` `.env.example`'a eklenir, `robots.ts` ve `sitemap.ts`'teki `example.com` fallback'i kaldırılır
- [ ] `public/` altındaki kullanılmayan create-next-app SVG'leri silinir, README Coolify/Docker adımlarıyla yeniden yazılır

Bitti sayılma kriteri: `tsc --noEmit` ve eslint hatasız geçiyor; `next build` sonrası `next start` ile `/api/health` 200 dönüyor; contact endpoint'ine curl ile doğrudan atılan honeypot dolu istek 4xx ile reddediliyor; repoda `example.com` string'i hiç geçmiyor.

Büyüklük: M. Çok sayıda küçük ve mekanik değişiklik, ama hiçbiri mimari değil.

### Faz 1: Deploy hattı

- [ ] Çok aşamalı Dockerfile (node:24-alpine, deps/builder/runner, non-root, `.next/standalone` + `.next/static` + `public`, `CMD ["node","server.js"]`) ve `.dockerignore` (`.local/` dahil)
- [ ] Coolify'da GitHub App ile git tabanlı Dockerfile build pack, auto-deploy ve PR Preview Deployments açık
- [ ] Health check Coolify'da `/api/health`'e bağlanır ve staging'de doğrulanır (coollabsio/coolify#7500 bilinen bug'ı yüzünden)
- [ ] GitHub Actions: PR'da lint + `tsc --noEmit` + build çalıştıran zorunlu kapı, image push yok
- [ ] dogancanyildiz.sh apex + www Coolify dahili ayarıyla; dogancanyildiz.com -> .sh 301'i **Cloudflare Redirect Rules**'ta tek atlamada (Traefik redirectregex yalnızca yedek yol olarak Coolify'da tanımlı kalır, bkz. [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 7-8)
- [ ] Cloudflare DNS proxied mod (turuncu bulut) açılır, SSL modu Full (strict) set edilir
- [ ] Traefik entrypoint'inde `forwardedHeaders.trustedIPs` Cloudflare IP listesiyle set edilir, contact rate limit anahtarı `CF-Connecting-IP` olur
- [ ] Origin'i yalnızca Cloudflare IP'lerinden erişilebilir kılmak (ufw veya Traefik `ipAllowList`), önerilir
- [ ] Cloudflare cache kuralı `_next/static/*` ve `public/` görselleri için, `/api/contact` için Cloudflare Rate Limiting kuralı, Bot Fight Mode açık
- [ ] Traefik'te HSTS ve compress middleware'i, streaming için buffering kapatma
- [ ] Coolify env değişkenleri Build/Runtime olarak ayrılır (`NEXT_PUBLIC_SITE_URL` Build; `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL` Runtime)
- [ ] Resend'de dogancanyildiz.sh domain doğrulaması (SPF/DKIM/DMARC)

Bitti sayılma kriteri: main'e merge edilen bir commit Coolify'da otomatik deploy tetikliyor ve site canlıda ayakta; test PR'ı açıldığında preview URL üretiliyor; `curl -I https://dogancanyildiz.com/herhangi-bir-yol` tek atlamada `https://dogancanyildiz.sh/herhangi-bir-yol`'a 301 dönüyor; Coolify sağlık kontrolü yeşil.

Büyüklük: L. Repo şu an Docker'a hiç hazır değil (Dockerfile, .dockerignore, workflow, hiçbiri yok), sıfırdan kurulum.

### Faz 2: i18n yeniden mimarisi

- [ ] `app/[lang]/` yapısına taşıma, `generateStaticParams` ile `en` ve `tr` prerender
- [ ] next-intl 4.13.7 kurulumu: `routing.ts`, `i18n/request.ts`, `proxy.ts` (localeDetection kapalı), her page/layout'ta `setRequestLocale`
- [ ] `src/lib/i18n/translations.ts`, `locale-provider.tsx`, `use-translation.ts` silinir; mesajlar `messages/en.json` ve `messages/tr.json`'a taşınır
- [ ] Dört layout'taki `cookies()` çağrıları kaldırılır, `generateMetadata` locale param'ından üretilir
- [ ] `alternates.canonical` + `alternates.languages` + `x-default`, `metadataBase`, `openGraph.images`
- [ ] `sitemap.ts` ve `robots.ts` iki locale için güncellenir
- [ ] Person JSON-LD eklenir; language-switcher URL tabanlı çalışacak şekilde yeniden yazılır
- [ ] Contact route (bir Route Handler olduğu için `next/root-params` desteklemiyor) locale'i elle alır

Bitti sayılma kriteri: `next build` çıktısında yalnızca `/api/*` route'ları dynamic işaretli, geri kalan tüm içerik route'ları statik (SSG); `/` ve `/tr` farklı içerik ve farklı `<html lang>` döndürüyor; bir hreflang test aracıyla (ör. technicalseo.com hreflang tag generator/tester) self-referencing ve karşılıklı hreflang hatasız çıkıyor.

Büyüklük: L. Plandaki tek büyük mimari hamle; bilinçli olarak tek PR'da bitiriliyor.

### Faz 3: Tasarım sistemi

- [ ] Geist Sans/Mono Variable + Instrument Serif woff2 (latin + latin-ext) `src/fonts/` altına vendor'lanır, `next/font/local` ile yüklenir, `globals.css`'teki ölü `--font-fraunces` referansı düzeltilir
- [ ] `globals.css` token blokları nötr palete geçirilir, emerald yalnızca link/focus/status rengine indirilir, `--primary` ile `--muted-foreground` ayrışması düzeltilir
- [ ] Body gradyanı, `surface-panel` gölgesindeki hard-coded rgba ve bileşenlerdeki doğrudan renk referansları (`bg-accent/40`, `border-primary/30` vb.) temizlenir
- [ ] md altı için Radix Dialog tabanlı mobil menü; footer'a sayfa linkleri
- [ ] LazyMotion + `m`'ye geçiş, stagger 40ms ve en fazla 4 eleman, `useReducedMotion` + global `prefers-reduced-motion` CSS fallback'i
- [ ] Erişilebilirlik: contact form mesajlarına `role=alert`/`role=status`, 24x24 minimum hedef boyutu denetimi, solid focus ring
- [ ] opengraph-image ve icon route'ları gerçek isim, unvan ve yeni paletle yeniden yazılır
- [ ] `project-card`'da tüm kartı Link'e sarma kalıbı bırakılır, başlık link + `::after` tıklama alanı

Bitti sayılma kriteri: Chrome DevTools Network sekmesinde hiçbir Google Fonts isteği yok (tüm fontlar `next/font/local`'dan geliyor); md altı ekranda header olmadan Dialog menüsüyle About/Projects/Contact'a ulaşılabiliyor; `prefers-reduced-motion: reduce` açıkken sayfada hiçbir kayma/fade animasyonu çalışmıyor; repoda `oklch(0.516 0.114 157.2)` değeri iki farklı token'da tekrar etmiyor.

Büyüklük: M. Token ve font katmanı cerrahi, ama dokunulan bileşen sayısı fazla.

### Faz 4: İçerik ve yayın (launch)

- [ ] Velite 0.4.0 kurulumu (exact pin), Zod şemaları, `content/projects/{en,tr}` ve `content/blog/{en,tr}` klasörleri, Dockerfile build adımına velite eklenir
- [ ] `src/data/projects.ts` kaldırılır, projeler 4-5 gerçek case study olarak yazılır (Cargo Pilot ve Bilet Satın Alma öncelikli, tüm Divizyon projeleri public), her biri mono künye + `liveUrl`/`repoUrl` + en az 1 ekran görüntüsü ile (görsel gelene kadar kapaksız)
- [ ] Hero, About, Contact metinleri `portfolio-content.md`'den yazılır; sertifikalar `verifyUrl` alanıyla (link gelene kadar boş) listelenir; Speaking, ayrı sayfa değil About içinde medyasız kompakt bir "Konuşmalar" bloğu (etkinlik · konu · tarih) olarak eklenir
- [ ] CV PDF dosyası `public/cv/dogancanyildiz-cv.pdf` yoluna konur (teslim edilene kadar `.local/` altında tutulur), hero/about'taki `/cv.pdf` linki bu yola güncellenir; Download CV butonu kalır
- [ ] Tüm Alex Chen, alex@example.com, placeholder sosyal link ve example.com kalıntıları silinir, logo DCY olur
- [ ] TR çeviriler yazılır; blog TR-first (yazılar önce Türkçe, uluslararası ilgi görecek olanlar EN'e çevrilir), çevirisi olmayan içerik o dilin sitemap ve hreflang alternates'ine eklenmez
- [ ] İlk 3-4 blog yazısı; blog listesi, detay sayfası, BlogPosting JSON-LD, sitemap entegrasyonu
- [ ] Görseller `next/image` ile (sizes tanımlı, remotePatterns yok)
- [ ] Yayın öncesi kontrol: Lighthouse, hreflang testi, Search Console doğrulaması, contact formu uçtan uca test

Bitti sayılma kriteri (launch gate): repoda `grep -ri "alex chen\|techcorp\|startupxyz\|example.com"` sıfır sonuç veriyor; en az 4 gerçek proje ve 3 blog yazısı yayında ve her projede en az 1 gerçek ekran görüntüsü var (placeholder gradyan yok); Search Console'a gönderilen sitemap hatasız işleniyor; contact formu prod ortamda uçtan uca test edilmiş (gerçek e-posta ulaşıyor).

Büyüklük: L. En çok elle yazılan içerik burada, iki dilde.

**Bu fazın sonu launch noktasıdır.** Faz 5 yayın sonrası, launch'u bloklamaz.

### Faz 5: Altyapı vitrini ve ölçüm (yayın sonrası)

- [ ] Gatus container'ı Coolify'da kurulur, izlenecek endpoint'ler ve public görünürlük bilinçli seçilir
- [ ] Ana sayfaya systems bölümü: sunucu tarafında 60 saniye revalidate ile Gatus JSON'undan beslenen, yalnızca agregat veri gösteren widget
- [ ] Build-time commit SHA ve deploy zamanı env olarak image'a gömülür ve widget'ta gösterilir
- [ ] Umami container'ı (self-hosted, çerezsiz analytics; Node + Postgres) ve CSP uyumlu script entegrasyonu kurulur; kurulum kesinleşti, koşullu değil (bkz. `11-acik-sorular.md` soru 11)
- [ ] Renovate/Dependabot: patch ve minor otomatik merge, Coolify otomatik redeploy; Next aylık güvenlik yayınları takibi
- [ ] Blog için aylık 1 yazı ritmi; ilk 3 ayın sonunda Astro'ya geçiş sorusunun yeniden değerlendirilmesi

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

## Riskler ve tripwire'lar

- **Faz 2 tek büyük PR**: i18n restructure'ın kapsamı geniş (route yapısı + middleware + metadata + sitemap). Tripwire: dal 5 iş gününü aşarsa route taşıma ile next-intl kurulumu iki ayrı, ardışık PR'a bölünür; asıl kural (tek dal disiplini) bozulmaz, yalnızca faz ikiye ayrılır.
- **next-intl bağımlılık riski**: `setRequestLocale` disiplini yüzünden route'lar sessizce dynamic'e düşerse veya next-intl bir Next major'ında takılırsa, bağımlılıksız elle `[lang]` yoluna dönülür (bkz. `04-i18n.md`). Bu geri dönüş Faz 2'nin kapsamını değiştirmez, yalnızca uygulama detayını.
- **Coolify health check bug'ı (coollabsio/coolify#7500)**: Node.js container'larda connection-refused sorunu bilinen bir açık; Faz 1'de staging'de ayrıca doğrulanmadan production'a health check bağlanmamalı.
- **Velite 0.x sürüm riski**: exact pin ve lockfile commit ile sınırlanıyor, ama Faz 4 başlamadan önce sürüm güncel mi diye tekrar kontrol edilmeli.
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
