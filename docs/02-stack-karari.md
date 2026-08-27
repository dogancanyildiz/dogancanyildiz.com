# Stack Kararı: Next.js mi, Astro mu, başka bir şey mi
Durum: Uygulandı (Next.js'te kalındı, Faz 0-4) · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Beş aday framework ölçüldü ve karar Next.js'te kalmak yönünde: Next.js 16.3.3, App Router, `app/[lang]/` segmenti, next-intl 4.13.7, Velite 0.4.0, `output: 'standalone'` ve kendi yazdığımız Dockerfile ile Coolify üzerinde self-host. Karar üç kritere dayanıyor: i18n mesaj katmanı, profil değeri ve mevcut kodun taşınabilirliği. Astro'nun bundle boyutu, content collections ve server islands konularında üstün olduğu açıkça kabul ediliyor; ilk araştırmanın "Astro self-host'ta daha ağır" gerekçesi adversarial doğrulamada çürütüldü ve karar metninden çıkarıldı. Bu yüzden Astro elenmiş bir aday değil, tripwire'a bağlanmış canlı bir alternatif. Karar güveni 0.88.

## Kararlar

| # | Karar | Sürüm / hedef |
|---|---|---|
| 1 | Framework Next.js'te kalır, App Router ile | next 16.3.3 (projede 16.1.6) |
| 2 | i18n URL tabanlı olur, `app/[lang]/` + next-intl | next-intl 4.13.7 |
| 3 | İçerik katmanı MDX'e taşınır, tek pipeline projeler + blog | velite 0.4.0 (exact pin) |
| 4 | Dağıtım `output: 'standalone'` + çok aşamalı Dockerfile + Coolify | node:24-alpine |
| 5 | Animasyon kütüphanesi motion'a geçer, `motion/react` import'u | motion 13.1.1 (projede framer-motion ^12.34.3) |
| 6 | Tailwind mevcut sürüm hattında kalır | tailwindcss 4.3.3 (projede `^4`) |
| 7 | shadcn/ui Radix primitifleriyle kalır, Base UI'a geçilmez | radix-ui ^1.4.3 |
| 8 | Migrasyon değil fazlı modernizasyon, aynı repo | bkz. [10-yol-haritasi.md](10-yol-haritasi.md) |

Reddedilenler: Astro 7.2.7, SvelteKit 2.70.3, Nuxt 4.5.2, TanStack Start 1.168.49 ve "Next'te kalıp cookie tabanlı i18n'i korumak".

## Gerekçe

### Aday tablosu

| Aday | Güncel sürüm | fitScore | Artı | Eksi |
|---|---|---|---|---|
| Next.js 16 (App Router) | 16.3.3, 2026-08-25 | 9 | next-intl ile tam i18n mesaj katmanı, 16.3 root params, `output: 'standalone'` için resmi self-host yolu, mevcut kodun tamamı yerinde kalıyor | En ağır client bundle, yılda bir major, content layer framework içinde değil |
| Astro 7 | 7.2.7, 2026-08-25 | 7 | Islands ile neredeyse sıfır JS, Zod şemalı content collections, `server:defer` server islands, çekirdekte i18n routing | i18n yalnızca routing (mesaj sözlüğü yok), React sayfa/layout katmanı `.astro`'ya elle yazılır, Astro 7'de markdown pipeline ve HTML kuralları yeni |
| SvelteKit 2 | 2.70.3, 2026-08-18 | 4 | En küçük runtime, adapter-node ile gerçek bundle çıktısı, form actions | Svelte ne CV'de ne işte geçiyor, i18n tamamen userland, shadcn-svelte gecikmeli takip ediyor |
| Nuxt 4 | 4.5.2, 2026-08-05 | 3 | @nuxtjs/i18n 10.6.0 listedeki en eksiksiz i18n modülü, @nuxt/content çok iyi, `.output/server` node_modules'süz çalışıyor | Vue, profil çelişkisi, tüm kod yeniden yazılır |
| TanStack Start v1 | 1.168.49, 2026-08-22 | 3 | React kalıyor, uçtan uca tipli routing, Vite tabanlı | v1 beş aylık, statik prerender + i18n + MDX için kanonik yol yok, Coolify tarifi yok |

### Kriter bazlı puan matrisi

Sekiz kriter tanımlandı, her biri Next ve Astro üzerinden puanlandı. Diğer üç aday (f) profil değeri kriterinde sıfıra yakın kaldığı için erken elendi.

| Kriter | Next.js | Astro | Kim önde | Neden |
|---|---|---|---|---|
| (a) Performans / client bundle | zayıf | güçlü | Astro | Next tabanı boş sayfada bile 127 KB gzip; Astro tabanı 0-15 KB |
| (b) i18n URL routing + mesaj katmanı | güçlü | orta | Next | next-intl ICU çoğul, tarih/sayı formatlama, tipli mesajlar verir; Astro i18n kendi dokümanında "bir routing API" |
| (c) MDX blog DX | orta | güçlü | Astro | Content collections çekirdekte, şemalı ve locale klasörleriyle doğal |
| (d) Self-host ayak izi (disk + RAM) | orta | orta-güçlü | Astro (düzeltildi) | Ölçüm: Astro 41 MB / RSS 92 MB, Next 61 MB / RSS 117-144 MB |
| (e) Canlı widget için server-side veri | orta | güçlü | Astro | `server:defer` server islands bu iş için birebir tasarlanmış |
| (f) Profil değeri | güçlü | zayıf | Next | Sahibi BerrSoft'ta Next.js yazıyor, CV'de Next.js var |
| (g) Bakım yükü | orta | orta-güçlü | Astro | Next yılda bir major + aylık güvenlik kadansı; Astro'nun major sıklığı düşük ama onun da CVE'leri var |
| (h) Taşınabilirlik | güçlü | zayıf | Next | 1803 satır TSX, shadcn bileşenleri, Button cva matrisi, OG route'u ve Resend contact route'u yerinde kalıyor |

Ham skor Astro lehine 5-3. Karar yine de Next yönünde, çünkü (b), (f) ve (h) bu proje için ağırlıklı kriterler ve üçü birlikte kararı taşıyor.

### Ölçümler

Tüm rakamlar bu repo üzerinde ve scratchpad'deki test projelerinde fiilen ölçüldü, üçüncü taraf blog yazılarından alınmadı.

| Ölçüm | Değer | Not |
|---|---|---|
| `.next/static` ham JS | 782.903 byte | Mevcut hal (16.1.6, cookie i18n) |
| Aynı build, gzip | 236-244 KB | Ölçüm 243.816 byte, gzip seviyesi farkı |
| En büyük tek chunk | 224.636 byte ham | 219 KB |
| CSS | 49.811 byte | |
| Home first-load JS, dinamik hal | 230.137 byte gzip (225 KB) | Cookie tabanlı, 11 route'un 8'i `ƒ` |
| Home first-load JS, `[lang]` + prerender sonrası | 134.411 byte gzip (131 KB) | %42 düşüş, motion'a hiç dokunulmadan |
| Boş sayfa tabanı (16.3.3) | 129.796 byte gzip (127 KB) | Hiçbir import yok, sadece `<div>` |
| `output: 'standalone'` boyutu (16.1.6) | 61 MB | 19 MB'ı `node_modules/typescript`, trace'e girmiş; ilk raporlanan 66 MB rakamı yanlıştı |
| 16.3.3'te standalone | 49 MB | Yükseltme çıktıyı küçültüyor (signal-performance doğrulayıcısının repo kopyasında ölçtüğü değer; sentez yalnızca 61 MB'ı doğruladı, launch öncesi yeniden ölçülecek) |
| node:24-alpine taban imajı | 58.7 MB | Yerel `docker image inspect` |
| Next standalone RSS | 117 MB (1 istek), 144 MB (~60 istek) | |
| Astro SSR gerçek runtime | 41 MB / 16 paket, dist 644 KB | sharp hariç 15 MB |
| Astro node RSS | 92 MB | |
| 16.3.3'e yükseltmenin bundle etkisi | +%2,4 (243.816 -> 251.123 byte gzip) | Yükseltme performans için değil, güvenlik ve root-params için |

İki sonucun altını çizmek gerekiyor. Birincisi, `~70 KB gzip` hedefi ulaşılamaz: React 19 + App Router tabanı tek başına 127 KB gzip. Gerçekçi hedef 125-130 KB. LazyMotion + `m` yine yapılacak ama gerekçesi first-load değil, hydration TBT'si. İkincisi, asıl kazanç prerender'dan geliyor ve bu kazanç ilk araştırmanın anlattığından büyük.

### Adversarial doğrulama

Öneri iki bağımsız lens ile sınandı. Sonuç, kararın aynı kalması ama gerekçesinin yeniden kurulması oldu.

**maintenance-cost lensi (refuted: true, güven 0.72).** Beraberliği bozan iki kriterden biri olan (d) ayak izi argümanı ölçümle yanlış çıktı. İlk araştırmanın "Astro SSR'da `npm prune --omit=dev` sonrası 190 MB node_modules" rakamı geçersiz: test projesinin `package.json`'ında devDependencies hiç yoktu, her şey `dependencies` altındaydı, yani prune no-op çalıştı ve 190 MB tam kurulumdu. Astro node adapter'ı runtime'ı `dist/server` içine bundle ediyor; bundle'daki tüm bare import'lar çıkarıldığında 16 paket kalıyor (`@oslojs/encoding`, `clsx`, `cookie`, `devalue`, `html-escaper`, `mrmime`, `piccolore`, `picomatch`, `react`, `react-dom`, `send`, `server-destroy`, `sharp`, `ultrahtml`, `unstorage`, `zod`). vite, rolldown, esbuild, shiki, babel yok; hatta `astro` paketinin kendisi bile runtime'da import edilmiyor. Yalnızca bu 16 paketle kurulan sunucu ayağa kalktı ve HTTP 200 döndü: 41 MB. Next standalone da 66 MB değil 61 MB çıktı ve 19 MB'ı TypeScript. RAM ekseni ise hiç ölçülmemişti: Astro 92 MB RSS, Next 117-144 MB.

Bunun sonucu: **(d) kriteri karar gerekçesinden tamamen çıkarıldı.** "Üstelik Next daha hafif" cümlesi yanlış. Doğru duruş, Astro'nun (a), (c), (d), (e) ve (g)'de önde olduğunu kabul edip kararı yine de (b), (f), (h) üzerine kurmak.

Aynı lens ikinci bir boşluk buldu: (g) bakım yükü yalnızca major sıklığı üzerinden puanlanmıştı, asıl yük güvenlik kadansında. Next.js Temmuz 2026'da aylık güvenlik yayın programına geçti; 20-21 Temmuz'da 9 CVE, 25 Ağustos'ta 2 kritik açık yayınlandı (biri Image Optimization ve AVIF/libheif üzerinden kimlik doğrulamasız RCE). CVE-2026-44578 (CVSS 8.6, WebSocket upgrade SSRF) açıkça self-hosted Node sunucusunu etkiliyor, Vercel'i etkilemiyor. Repo 16.1.6 olduğu için bunların tamamının altında. Detay: [09-guvenlik.md](09-guvenlik.md).

**signal-performance lensi (refuted: false, güven 0.88).** Bu lens öneriyi çürütemedi, tersine merkezi iddiayı deneysel olarak kanıtladı. Projenin bir kopyası 16.3.3'e yükseltildi, `app/[lang]/` yapısına taşındı, `cookies()` çağrıları `params`'a çevrildi, `generateStaticParams` eklendi ve edge runtime kaldırıldı. Sonuç build tablosunda tüm içerik route'ları `●` (SSG, prerendered) oldu; dinamik kalan tek şey `/api/contact`, ki doğrusu bu. Edge runtime kaldırılınca `/opengraph-image` de `○` statiğe döndü. Aynı lens cookie tabanlı i18n'in SEO kusurunu da canlı gösterdi: çalışan standalone sunucuda aynı `/` URL'i, yalnızca cookie'ye göre `<html lang="en">` veya `<html lang="tr">` döndürüyor.

Bu lensin getirdiği üç düzeltme yukarıdaki ölçüm tablosuna ve aşağıdaki tripwire'lara işlendi.

### Nihai karar ve dayandığı üç kriter

**(b) i18n mesaj katmanı.** Astro'nun i18n'i kendi dokümanının deyimiyle yalnızca bir routing API'si: `defaultLocale`, `locales`, `prefixDefaultLocale`, `getRelativeLocaleUrl` var; mesaj sözlüğü, ICU çoğul kuralları, locale-aware tarih ve sayı formatlaması yok. Bunlar için elle bir `ui.ts` sözlüğü veya Paraglide gerekiyor. Next tarafında next-intl 4.13.7 bunları kutudan veriyor ve 16.3 ile gelen `next/root-params` locale'i Server Component'lere prop geçmeden taşıyor, `use cache` scope'ları içinde de çalışıyor.

**(f) Profil değeri.** Sahibi BerrSoft'ta Next.js yazıyor ve CV'sinde Next.js var. Asıl fark yaratan iddia zaten framework seçimi değil, Vercel olmadan Next.js'i kendi Linux sunucusunda Coolify, Docker ve Traefik ile çalıştırmak. Site bunun kanıtı olmalı; Astro'ya geçmek "doğru aracı seçmiş" sinyali verirken Next.js iddiasının kanıtını siteden kaldırır.

**(h) Taşınabilirlik.** Yerinde kalan katman gerçek emek barındırıyor: `src/components/ui/*`, Button cva varyant matrisi, SectionHeading, ThemeToggle'ın `useSyncExternalStore` ile hydration-safe kurulumu, `globals.css`'teki `@theme inline` token mimarisi, opengraph-image ve icon route'ları, `src/app/api/contact/route.ts` ile `src/lib/resend.ts`'in null-guard pattern'i. Astro'ya geçiş sayfa ve layout katmanının tamamının `.astro`'ya elle yazılmasını gerektirirdi.

Dördüncü kriter olarak sayılabilecek (d) ayak izi **kullanılmıyor**. Astro'nun bundle, content collections ve server islands üstünlükleri kabul ediliyor. Karar, bu üstünlüklere rağmen yukarıdaki üç kriterin ağır basması.

## Reddedilen alternatifler

| Alternatif | Sürüm | Ret gerekçesi |
|---|---|---|
| Astro + @astrojs/node | 7.2.7 | i18n mesaj katmanı yok; React/shadcn/motion katmanının tamamı yeniden yazılır; Next.js iddiasının kanıtı siteden kalkar. Ayak izi cezası yok, bu yüzden **canlı alternatif olarak kalıyor** |
| SvelteKit | 2.70.3 | Muhtemelen en hafif çıktıyı verir, ama Svelte ne işte ne CV'de geçiyor; portfolyonun profille çelişmesi kabul edilemez |
| Nuxt + @nuxtjs/i18n | 4.5.2 / 10.6.0 | Listedeki en eksiksiz i18n modülü ve @nuxt/content mükemmel, ama Vue aynı profil çelişkisini yaratıyor ve tüm kod yeniden yazılır |
| TanStack Start | 1.168.49 | React kalır ama statik prerender, i18n routing ve MDX content layer için kanonik yol yok; küçük bir içerik sitesinde üstlenilecek risk değil |
| Next'te kalıp cookie i18n'i korumak | - | Aynı URL iki dil sunduğu için hreflang teknik olarak kurulamıyor; `layout.tsx:11` ve `:30`'daki `cookies()` 11 route'un 8'ini dinamikleştiriyor. Savunulabilir değil |
| Sıfırdan rewrite | - | Değişmesi gereken şeyler (klasör yapısı, token değerleri, font yükleme, içerik kaynağı) dosya bazında cerrahi düzenlemeler; rewrite çalışan katmanı da çöpe atardı |

## Riskler ve tripwire'lar

**Tripwire 1: Astro yeniden değerlendirilir.** Şu koşullardan biri gerçekleşirse karar yeniden açılır. Ayak izi cezası olmadığı ölçüldüğü için bu uzak bir ihtimal değil.
- Blog ciddi şekilde büyürse (kabaca 40+ yazı veya aylık bir yazının üstünde bir tempo) ve içerik pipeline'ının bakımı yük olmaya başlarsa.
- Contact form ve status widget'ı ayrı küçük bir servise taşınırsa: o zaman `output: 'static'` + nginx senaryosu açılır ve Astro'nun avantajı tam kullanılır.
- Yayından üç ay sonra, [10-yol-haritasi.md](10-yol-haritasi.md) Faz 5'te bu soru planlı olarak yeniden sorulacak.

**Tripwire 2: next-intl bağımlılıksız yola dönülür.** next-intl bir tercih olarak seçildi, zorunluluk olarak değil. Doğrulayıcı, URL tabanlı i18n + tam statik üretimin sıfır yeni bağımlılıkla, mevcut sözlükle ve yaklaşık 40 satır değişiklikle çalıştığını fiilen build ederek gösterdi. `setRequestLocale` disiplini yüzünden route'lar sessizce dynamic'e düşerse veya next-intl bir Next major'ında takılırsa bu yola dönülür. Detay: [04-i18n.md](04-i18n.md).

**Tripwire 3: Turbopack yerine webpack.** vercel/next.js#88844 açık: Turbopack ile build edildiğinde `serverExternalPackages`'taki paketler `.next/standalone/node_modules`'e trace edilmiyor. Bu projede şu an `serverExternalPackages` yok, o yüzden ısırmıyor (standalone sunucu çalıştırılarak doğrulandı). Dockerfile'a "external paket eklenirse `next build --webpack`'e geç" yorumu düşülecek. Detay: [06-devops-ve-deploy.md](06-devops-ve-deploy.md).

Diğer riskler:

- **Güvenlik, hemen aksiyon.** Repo 16.1.6'da; 16.3.3 iki kritik açığı kapatıyor ve CVE-2026-44578 doğrudan self-hosted Node sunucusunu vuruyor. Yükseltme yayından önce değil, ilk fazda yapılacak.
- **`next/root-params` Route Handler ve Server Action'da desteklenmiyor** (resmi doküman: "planned for a future release"). Contact formu bir Route Handler olduğu için locale oraya elle taşınacak.
- **@next/mdx + Turbopack kısıtı.** remark/rehype eklentileri yalnızca string adı ve serializable option ile geçilebiliyor, fonksiyon plugin Rust tarafına geçemiyor. Velite seçiminin teknik gerekçesi budur; bkz. [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md).
- **Velite 0.x sürüm riski.** Caret değil exact pin ve lockfile commit ile sınırlanıyor.
- **Cache Components planlı migrasyonu.** 16.3'te opt-in, Vercel "will become the default in a future major version" diyor. İki yıllık pencerede planlı bir migrasyon daha var.
- **Astro güvenlik açısından temiz değil.** CVE-2025-61925, CVE-2025-64525 (middleware bypass), CVE-2026-41067 (XSS), GHSA-mr6q-rp88-fx84 (x-astro-path ile kimlik doğrulamasız path override). Güvenlik tek başına framework kararını çevirmiyor, sadece operasyon maddesini zorunlu kılıyor.

## Uygulama notları

Bu karardan doğan somut değişiklikler ve sahipleri:

| İş | Faz | Doküman |
|---|---|---|
| next 16.1.6 -> 16.3.3, eslint-config-next 16.3.3 | Faz 0 | [09-guvenlik.md](09-guvenlik.md) |
| framer-motion ^12 -> motion 13.1.1, import'lar `motion/react`'e | Faz 0 | [03-tasarim-ui-ux.md](03-tasarim-ui-ux.md) |
| `src/app/opengraph-image.tsx:3`'teki `export const runtime = "edge"` silinir | Faz 0 | [07-seo-ve-metadata.md](07-seo-ve-metadata.md) |
| `next.config.ts`: `output: 'standalone'`, `poweredByHeader: false`, güvenlik başlıkları | Faz 0 | [06-devops-ve-deploy.md](06-devops-ve-deploy.md) |
| `app/[lang]/` restructure + next-intl + `proxy.ts` (middleware değil) | Faz 2 | [04-i18n.md](04-i18n.md) |
| Velite kurulumu, `src/data/projects.ts` kaldırılır | Faz 4 | [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) |
| LazyMotion + `m` geçişi (gerekçe: hydration TBT'si) | Faz 3 | [03-tasarim-ui-ux.md](03-tasarim-ui-ux.md) |

Yan kararların detayı:

- **motion 13.1.1.** JS kullanıcıları için kırıcı değişiklik yok. Tek etki CSS-in-JS kullananlarda (`@emotion/is-prop-valid` artık opsiyonel dependency değil, `MotionConfig` ile explicit veriliyor) ve AnimatePresence'in React 19 strict mode uyumunun düzelmesi. Bu projede ikisi de sorun çıkarmıyor.
- **Tailwind 4.3.3.** Projede `^4` ile zaten güncel hatta, ek iş yok. Token mimarisi (`oklch` + `@theme inline`) korunuyor, yalnızca değerler değişiyor.
- **shadcn/ui Radix'te kalır.** Yeni shadcn projeleri artık varsayılan olarak Base UI kuruyor, ancak Radix desteklenmeye devam ediyor. Projede `radix-ui ^1.4.3` var, migrasyona gerek yok ve bu karardan kazanılacak bir şey yok.
- **`outputFileTracingExcludes` opsiyonu.** Standalone çıktısındaki 19 MB TypeScript bilinçli olarak ya dışlanacak ya da kabul edilecek. Karar Dockerfile yazılırken verilecek.

Not: `next.config.ts` şu an 133 byte, yani pratikte boş. Repoda Dockerfile, `.dockerignore` ve `.github/workflows` yok; üçü de sıfırdan yazılacak.

Olgusal düzeltme: ilk araştırmadaki "2469 satır TSX" rakamı `.ts` ve `.tsx` toplamıdır, yalnızca `.tsx` 1803 satır. Taşınabilirlik argümanının yönü değişmiyor.

## Uygulama durumu (2026-08-27)

Karar dört fazlık uygulamayla doğrulandı, yeniden açılmadı. Faz 0-3 `main`'e merge edildi (PR #2-#5); Faz 4 (PR #6, dal `feature/faz-4-icerik-ve-yayin`, HEAD `8b4fe40`) açık ve CI yeşil, merge kararı site sahibinde.

- **Karar doğrulandı mı: evet.**
  - Tüm içerik route'ları statik. `npm run verify:routes` (`scripts/assert-static-routes.mjs`) 5 sayfa x 2 locale + proje/blog detay route'larının tamamının prerendered olduğunu build çıktısından okuyarak doğruluyor; yalnızca `/api/contact` ve `/api/health` dynamic kalıyor. Script CI'da zorunlu adım (`.github/workflows/ci.yml`).
  - i18n mesaj katmanı next-intl ile çalışıyor. `src/i18n/routing.ts`, `app/[lang]/`, `src/proxy.ts`; `messages/en.json` ve `messages/tr.json` 97 anahtar/13 namespace ile pariteli (`tests/messages.test.ts`).
  - İçerik Velite ile geliyor. `velite.config.ts` (projects + posts koleksiyonu, `--clean --strict`), `content/projects/{en,tr}/` (5 case study), `content/blog/` (4 yazı); `src/data/projects.ts` ve `skills.ts` silindi, erişim `src/lib/content.ts` üzerinden.
  - `next.config.ts`'de karar metninde geçen `output: 'standalone'` uygulandı; Dockerfile bu çıktıya göre yazıldı (Faz 1, PR #3).
- **Tripwire'ların durumu.**
  - Tripwire 2 (next-intl bağımlılıksız yola dönülür): tetiklenmedi. next-intl sorunsuz çalışıyor; `setRequestLocale` disiplini korunuyor, route'lar sessizce dynamic'e düşmedi (yukarıdaki `verify:routes` sonucu bunun kanıtı).
  - Tripwire 1 (Astro yeniden değerlendirilir): henüz tetiklenmedi, gündemde değil. Karar metnindeki üç koşuldan hiçbiri (blog 40+ yazı, contact/status'un ayrı servise taşınması, yayından üç ay sonraki planlı gözden geçirme) şu ana kadar oluşmadı; planlı gözden geçirme Faz 5 sonrasına, launch'tan üç ay sonrasına kalıyor.
  - Tripwire 3 (Turbopack yerine webpack): `serverExternalPackages` hâlâ tanımlı değil (`next.config.ts`, `grep` sonucu boş), bu yüzden ısırmadı; Velite içerik eklenmesi bu paketi devreye sokmadı.
- **Bundle ölçümünün yeniden alınması: Faz 5 işi.** Karar metnindeki ölçüm tablosunda "16.3.3'te standalone 49 MB" rakamının yanında "launch öncesi yeniden ölçülecek" notu vardı; Faz 0-4 boyunca bu ölçüm tekrarlanmadı (Velite, i18n mesaj dosyaları ve gerçek içerik eklenmesi rakamı değiştirmiş olabilir). Faz 5'e devrediliyor.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](00-ozet-ve-karar.md) - tüm kararların üst özeti
- [01-mevcut-durum-denetimi.md](01-mevcut-durum-denetimi.md) - bu dokümandaki repo ölçümlerinin kaynağı
- [04-i18n.md](04-i18n.md) - next-intl kurulumu, `as-needed` prefix şeması, tripwire detayı
- [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) - Velite, Resend, Gatus
- [06-devops-ve-deploy.md](06-devops-ve-deploy.md) - Dockerfile, Coolify, Traefik
- [09-guvenlik.md](09-guvenlik.md) - CVE listesi ve güvenlik kadansı
- [10-yol-haritasi.md](10-yol-haritasi.md) - fazlar ve Astro yeniden değerlendirme takvimi
- [11-acik-sorular.md](11-acik-sorular.md) - sunucu RAM/CPU sorusu build stratejisini etkiliyor
- [12-kaynaklar.md](12-kaynaklar.md) - tüm dokümanların kaynak listesi

## Kaynaklar

- Next.js 16.3 duyurusu (dev RAM düşüşü, Node stream SSR, root params, `import.meta.glob`, Turbopack FS cache): https://nextjs.org/blog/next-16-3
- Update: August Next.js Security Release (16.3.3 ve 15.5.24, iki kritik açık): https://nextjs.org/blog/nextjs-security-release-august-2026-update
- Next.js security release program (Temmuz 2026, aylık kadans): https://nextjs.org/blog/next-security-release-program
- Next.js: How to self-host your Next.js application: https://nextjs.org/docs/app/guides/self-hosting
- Next.js: `output` config (standalone / export): https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Next.js: with-docker örneği (multi-stage, non-root node kullanıcısı): https://github.com/vercel/next.js/tree/canary/examples/with-docker
- Next.js: Internationalization guide (`[lang]` segmenti, `generateStaticParams`): https://nextjs.org/docs/app/guides/internationalization
- Next.js: root params API reference (`next/root-params`): https://nextjs.org/docs/app/api-reference/functions/next-root-params
- Next.js: Renaming Middleware to Proxy (Next 16 kırıcı değişikliği ve codemod): https://nextjs.org/docs/messages/middleware-to-proxy
- vercel/next.js#88844 (Turbopack + standalone, `serverExternalPackages` trace edilmiyor): https://github.com/vercel/next.js/issues/88844
- Astro 7.0 duyurusu (Rust derleyici, Sätteri markdown pipeline, Vite 8 + Rolldown, HTML düzeltmenin kaldırılması): https://astro.build/blog/astro-7/
- Astro Docs: Internationalization (routing API, mesaj katmanı içermiyor): https://docs.astro.build/en/guides/internationalization/
- Astro Docs: Server islands (`server:defer`): https://docs.astro.build/en/guides/server-islands/
- Astro Docs: Docker recipe: https://docs.astro.build/en/recipes/docker/
- shadcn/ui: Tailwind v4 dokümanı: https://ui.shadcn.com/docs/tailwind-v4
- Motion for React: upgrade guide (v13'te JS için kırıcı değişiklik yok): https://motion.dev/docs/react-upgrade-guide
- Motion for React: Reduce bundle size (LazyMotion + `m`): https://motion.dev/docs/react-reduce-bundle-size
- TanStack Start v1 duyurusu (Mart 2026): https://tanstack.com/blog/announcing-tanstack-start-v1
- Coolify Docs: Next.js uygulaması deploy etme: https://coolify.io/docs/applications/nextjs
- npm registry sürüm teyitleri (2026-08-26): https://www.npmjs.com/package/next · https://www.npmjs.com/package/astro · https://www.npmjs.com/package/tailwindcss · https://www.npmjs.com/package/next-intl · https://www.npmjs.com/package/framer-motion
