# Mevcut Durum Denetimi

Durum: Uygulandı (Faz 0-4, PR #2-#6) · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Üç ayrı denetim (frontend, backend/API, devops-repo hijyeni) toplam 36 bulgu çıkardı: 4 critical, 7 high, 10 medium, 10 low, 5 info. Kod tabanı tip ve lint açısından temiz: bu denetim sırasında çalıştırılan `npx tsc --noEmit` ve `npm run lint` sıfır hata ile tamamlandı (build denemesi kapsam dışı bırakıldı). `package-lock.json`'daki tek fark gerçek bir bağımlılık değişikliği değil: bazı devDependency girdilerinde (`@babel/*`, `@typescript-eslint/*`, `@types/*`, `eslint-*`) `"peer": true` bayrağının kaybolması, lockfile'ın yerel npm 11.16.0 ile yeniden hesaplanmasından kaynaklanan metadata gürültüsü; bağımlılık sürümleri ve integrity hash'leri değişmedi. En ciddi dört bulgu (`--font-fraunces` hiçbir yerde tanımlı değil, cookie tabanlı i18n SEO'yu kırıyor, içerik %100 create-next-app/shadcn şablonu, Dockerfile hiç yok) birbirinden bağımsız kaynaklardan geliyor ama hepsi launch'ı tek başına engelliyor. Bu bulguların çözümü için alınan mimari kararlar 02-stack-karari.md, 03-tasarim-ui-ux.md, 04-i18n.md, 06-devops-ve-deploy.md ve 09-guvenlik.md dokümanlarında ayrıntılandırılıyor; bu doküman yalnızca mevcut durumu kanıtıyla kayıt altına alıyor, karar üretmiyor.

## Denetim Ortamı

- Commit: `42796ad` (main, "Merge pull request #1 from dogancanyildiz/claude/xenodochial-booth")
- Yerel araç sürümleri: Node v24.18.0, npm 11.16.0
- Çalışma dizini: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio`

Kaynak denetim dosyaları ve her birinin ürettiği bulgu sayısı:

| Alan | Kaynak denetim dosyası | Bulgu sayısı |
|---|---|---|
| Frontend | audit-frontend.json | 10 |
| Backend/API | audit-backend.json | 13 |
| DevOps | audit-devops.json | 13 |

Aşağıdaki tablolardaki F/B/D numaraları bu dokümana özel; diğer dokümanlarda aynı bulguya referans verirken bu numaralar kullanılıyor.

## Ciddiyet Özeti

| Ciddiyet | Frontend | Backend/API | DevOps | Toplam |
|---|---|---|---|---|
| Critical | 3 | 0 | 1 | 4 |
| High | 1 | 2 | 4 | 7 |
| Medium | 3 | 4 | 3 | 10 |
| Low | 3 | 4 | 3 | 10 |
| Info | 0 | 3 | 2 | 5 |
| **Toplam** | **10** | **13** | **13** | **36** |

## Doğrulama Yöntemi

Bulgular kod okuması ile birlikte üç ayrı komut setiyle doğrulandı, tahmine dayanmıyor:

- **Frontend:** `grep -rn "use client" src --include=*.tsx` (16/31 dosya), `grep -rn prefers-reduced-motion src/` (0 sonuç), `grep -rn hreflang src/` (0 sonuç), `grep -rn "next/image\|<img" src/` (0 sonuç), `grep -rn "aria-live\|role=\"status\"\|role=\"alert\"" src/` (0 sonuç); globals.css, layout.tsx, translations.ts, data/projects.ts dosyalarının satır satır okunması.
- **Backend/API:** route.ts ve resend.ts'in manuel okunması, `.env.example` ile process.env kullanım noktalarının karşılaştırılması, Next.js'in Ağustos 2026 güvenlik yayınına dair web araştırması (bkz. Kaynaklar).
- **DevOps:** `find . -iname '*docker*'` (sonuç yok), `.github/workflows/` dizin kontrolü (yok), `npx tsc --noEmit`, `npm run lint`, `npm outdated`, `git diff package-lock.json`.

Kapsam dışı bırakılanlar, ilgili faz uygulama adımında doğrulanacak:

- `npm run build` denemesi (görev talimatı gereği bu denetimde atlandı, yalnızca `tsc`/`lint` çalıştırıldı).
- Lighthouse/performans ölçümü (Faz 3 sonunda, tasarım sistemi tamamlanınca yapılacak).
- Gerçek Docker build/deploy denemesi (Faz 1'de Dockerfile yazıldıktan sonra staging'de doğrulanacak).

## Frontend Bulguları

Kod tabanı teknik olarak temiz ve tutarlı bir shadcn/Tailwind 4 kurulumu üzerine oturuyor: oklch renk sistemi, cva tabanlı Button varyantları, tekrar kullanılabilir `surface-panel`/`eyebrow`/`section-title` utility sınıfları hazır. Buna karşılık üç yapısal sorun (font, i18n mimarisi, içerik) her şeyi geçersiz kılıyor; aşağıdaki tablo bunları ve ikincil bulguları listeliyor.

| # | Bulgu | Ciddiyet | Kanıt (dosya:satır) | Ne yapılacak |
|---|---|---|---|---|
| F1 | `--font-fraunces` hiçbir yerde tanımlı değil, `next/font` hiç yüklenmiyor | Critical | globals.css:161 (h1-h4 `font-family: var(--font-fraunces)`); layout.tsx:1-51 (font import yok); package.json (Fraunces bağımlılığı yok) | Gerçek bir display font yüklenecek ve token buna bağlanacak. Seçilen çözüm Fraunces değil; bkz. Not 1. |
| F2 | Cookie tabanlı i18n neredeyse tüm ağacı client component'e zorluyor, SEO'yu kırıyor | Critical | locale-provider.tsx:29,35-38; layout.tsx:10-13,30-34; about/contact/projects layout.tsx:5-9; `grep "use client" src` -> 16/31 dosya; `grep hreflang` -> 0 sonuç | URL tabanlı i18n'e (`app/[lang]` + next-intl) geçilecek, `cookies()` çağrıları kaldırılacak (Faz 2, bkz. 04-i18n.md). |
| F3 | İçerik %100 create-next-app/shadcn şablonu (Alex Chen, sahte projeler, example.com) | Critical | translations.ts:11,153,184; footer.tsx:9-11,38,42; data/projects.ts (tüm dosya); about/page.tsx:71-117; robots.ts:9; sitemap.ts:4; hero.tsx:73 | `.local/content/portfolio-content.md` kaynak alınarak gerçek içerik yazılacak (Faz 4, bkz. 08-icerik-stratejisi.md). |
| F4 | Mobilde ana navigasyon erişilemiyor (hamburger/mobil menü yok) | High | header.tsx:44 (`hidden md:flex`), header.tsx:76 (`hidden sm:inline-flex`); footer.tsx:14-73 (sayfa linki yok) | Radix Dialog tabanlı mobil menü eklenecek, footer'a sayfa linkleri konacak (Faz 3). |
| F5 | `prefers-reduced-motion` desteği yok, framer-motion her yerde zorunlu | Medium | `grep prefers-reduced-motion src/` -> 0 sonuç; hero.tsx:9-20; header.tsx:59-66; skills-strip.tsx:26-53 | `useReducedMotion` + global CSS fallback eklenecek; motion LazyMotion+m'ye taşınacak (Faz 3). |
| F6 | Sitede gerçek görsel yok, tüm görsel alanlar CSS gradient placeholder | Medium | project-card.tsx:35; project-detail.tsx:42; opengraph-image.tsx:66-68 (hâlâ şablon metni) | Gerçek proje ekran görüntüleri `next/image` ile eklenecek; görsel yoksa proje kapaksız yayınlanır, placeholder kullanılmaz (Faz 4). |
| F7 | Metadata cookie'ye bağımlı, statik `<head>` üretilemiyor, canonical/alternates yok | Medium | layout.tsx:10-23; about/contact/projects layout.tsx:5-9 (hepsi `await cookies()` çağırıyor) | `generateMetadata` locale param'ından üretilecek, `alternates.canonical` + `alternates.languages` eklenecek (Faz 2). |
| F8 | create-next-app varsayılan SVG'leri ve README hâlâ boilerplate | Low | public/ (5 SVG dosyası, hiçbiri referans edilmiyor); README.md:1-3,15,29-33 (Vercel deploy talimatı) | Kullanılmayan SVG'ler silinecek, README Coolify/Docker deploy adımlarıyla yeniden yazılacak (Faz 0). |
| F9 | Contact form durum mesajlarında `aria-live` yok | Low | contact-form.tsx:120-129 (hata/başarı `<p>` etiketlerinde `role`/`aria-live` yok) | `role="alert"` (hata) ve `role="status"` (başarı) eklenecek (Faz 3). |
| F10 | footer.tsx sosyal linkler ve email, i18n dışında hardcoded | Low | footer.tsx:8-12,37-43 (sabit `github.com`/`linkedin.com`/`twitter.com`, `alex@example.com`); karşılaştır: contact-page-content.tsx:43-48 (`t("contact.email")` kullanıyor) | Email ve sosyal linkler tek bir veri kaynağına taşınacak, gerçek linklerle değiştirilecek (Faz 4). |

## Backend / API Bulguları

Contact API girdi şeklini kontrol ediyor ama hiçbir abuse-önleme mekanizması içermiyor ve Resend'in ham hata mesajını client'a sızdırıyor. `next.config.ts` tamamen boş; security header, `output:'standalone'` ve `poweredByHeader` kapatma eksik. `robots.ts`/`sitemap.ts` tanımsız bir env değişkenine bağımlı ve varsayılan olarak `example.com`'a düşüyor. Blog içerik pipeline'ı, status/homelab widget veri kaynağı ve analytics entegrasyonu kod tabanında hiç mevcut değil.

| # | Bulgu | Ciddiyet | Kanıt (dosya:satır) | Ne yapılacak |
|---|---|---|---|---|
| B1 | Contact API'de rate limiting, sunucu taraflı honeypot ve CAPTCHA yok | High | route.ts:33-71 (rate limit/captcha yok); contact-form.tsx:23-26 (honeypot yalnızca client'ta) | Sunucu taraflı honeypot + IP bazlı rate limit + uzunluk sınırı eklenecek. Turnstile şimdilik eklenmeyecek; bkz. Not 2. |
| B2 | `next` paketi güvenlik yamalarının gerisinde (16.1.6) | High | package.json:16 (`"next": "16.1.6"`) | `next@16.3.3`'e yükseltilecek (Faz 0). Devops denetiminin `npm outdated` bulgusuyla çelişiyor; bkz. Not 3. |
| B3 | Resend hata mesajı (`error.message`) doğrudan client'a döndürülüyor | Medium | route.ts:63-67 | Client'a jenerik mesaj dönülecek, detay yalnızca sunucu loguna (`console.error`) yazılacak (Faz 0). |
| B4 | `CONTACT_EMAIL`/`FROM_EMAIL` prod'da `onboarding@resend.dev`'e sessizce fallback ediyor | Medium | route.ts:4-5; .env.example:6-9 | Prod'da bu env değişkenleri zorunlu kılınacak, fallback yalnızca development'ta geçerli kalacak (Faz 0). |
| B5 | `next.config.ts` boş: security header, `output:'standalone'`, `poweredByHeader` eksik | Medium | next.config.ts:1-6 (tüm dosya) | `output:'standalone'`, `poweredByHeader:false` ve `headers()` ile güvenlik başlıkları eklenecek (Faz 0). |
| B6 | `NEXT_PUBLIC_SITE_URL` hiçbir yerde tanımlı değil, robots/sitemap `example.com`'a düşüyor | Medium | robots.ts:9; sitemap.ts:4; .env.example (bu değişken listede yok) | `.env.example`'a eklenecek, fallback kaldırılıp eksikse build hata verecek şekilde değiştirilecek (Faz 0). |
| B7 | E-posta alanı format olarak doğrulanmıyor | Low | route.ts:15-30 (yalnızca `typeof`/trim kontrolü); route.ts:50-54 (email doğrudan gövdeye ekleniyor) | Basit email regex + name/message için maksimum uzunluk sınırı eklenecek (Faz 0). |
| B8 | `sitemap.ts` hâlâ şablon proje slug'larını index ediyor | Low | sitemap.ts:2,14-19; data/projects.ts:16-30 | İçerik gerçek projelerle değiştirilince kod değişmeden otomatik düzelecek (Faz 4). |
| B9 | Contact endpoint'te request body boyutu sınırı yok | Low | route.ts:33-40 (`request.json()` için boyut kontrolü yok) | name/message için karakter sınırı, aşımda 400/413 eklenecek (Faz 0). |
| B10 | OG image ve favicon hâlâ jenerik şablon içeriği kullanıyor | Low | opengraph-image.tsx:54,66-69,79; icon.tsx:23 (`"P"` harfi) | Gerçek isim/unvan ve yeni paletle yeniden yazılacak (Faz 2/3). |
| B11 | Blog/yazılar için içerik pipeline'ı yok | Info | package.json (mdx bağımlılığı yok); src/app altında blog/ dizini yok | Velite 0.4.0 ile Zod şemalı MDX pipeline'ı kurulacak (Faz 4, bkz. 05-backend-icerik-ve-servisler.md). |
| B12 | Canlı status/homelab widget için veri kaynağı yok | Info | src/app/api altında yalnızca contact/route.ts var | Gatus'un JSON API'sinden sunucu tarafında 60 saniye cache ile beslenecek (Faz 5). |
| B13 | Analytics entegrasyonu yok | Info | layout.tsx (analytics script'i yok); package.json (analytics bağımlılığı yok) | Umami container'ı Faz 5'te eklenecek. |

## DevOps / Repo Hijyeni Bulguları

Repo, Coolify tabanlı self-host deployment için sıfır altyapı içeriyor: Dockerfile, `.dockerignore`, compose dosyası, GitHub Actions workflow ve health-check endpoint'i yok. Node sürüm pin'i (`.nvmrc`/`.node-version`/`engines`) de yok, yalnızca `next`/`react`/`react-dom` pin'li, geri kalan bağımlılıklar caret ile açık. README hâlâ create-next-app şablonu, "Deploy on Vercel" talimatı içeriyor; proje adı, açıklama, Coolify/self-host bilgisi yok.

| # | Bulgu | Ciddiyet | Kanıt (dosya:satır) | Ne yapılacak |
|---|---|---|---|---|
| D1 | Dockerfile yok | Critical | repo kökü (`find . -iname '*docker*'` boş sonuç); next.config.ts:1-5 | Çok aşamalı Dockerfile (deps/builder/runner, non-root kullanıcı) yazılacak (Faz 1, bkz. 06-devops-ve-deploy.md). |
| D2 | `.dockerignore` yok | High | repo kökü (dosya yok); .gitignore:56-59 (`.local/` yalnızca git'ten hariç, docker build context'inden değil) | `.dockerignore` eklenecek (`.local/` dahil, kişisel içeriğin image'a sızmasını önlemek için) (Faz 1). |
| D3 | `next.config.ts`'de `output: 'standalone'` yok | High | next.config.ts:1-5 (boş `NextConfig` objesi) | Eklenecek; Dockerfile `.next/standalone` çıktısına göre yazılacak (Faz 0/1). |
| D4 | docker-compose / Coolify compose tanımı yok | Medium | repo kökü (compose dosyası yok) | Ana uygulama git tabanlı Dockerfile build pack ile deploy edilecek, compose yalnızca yan servisler için düşünülüyor; bkz. Not 4. |
| D5 | GitHub Actions workflow yok | High | `.github/workflows/` dizini yok | PR'da lint + `tsc --noEmit` + build çalıştıran zorunlu kapı eklenecek, image push edilmeyecek (Faz 1). |
| D6 | Health-check endpoint yok | High | src/app/api altında yalnızca contact/route.ts var | `src/app/api/health/route.ts` eklenecek, Coolify sağlık kontrolü buna bağlanacak (Faz 0). |
| D7 | Node sürüm pin'i yok (`.nvmrc`/`.node-version`/`engines`) | Medium | package.json:1-30 (`engines` alanı yok); repo kökü (`.nvmrc` yok) | `.nvmrc` (24) ve `package.json` `engines.node >=20.9` eklenecek (Faz 0). |
| D8 | README hâlâ create-next-app şablonu | Medium | README.md:1-27 (proje adı/açıklama yok, "Deploy on Vercel" bölümü var) | Coolify/Docker deploy notları, `.env.example` bazlı kurulum adımlarıyla yeniden yazılacak (Faz 0). |
| D9 | `package-lock.json`'daki değişiklik kod değil, npm sürüm farkı | Low | `git diff package-lock.json` (yalnızca devDependency girdilerinde `"peer": true` satır silmeleri) | Ekip/CI npm sürümü sabitlenip lockfile tek seferde normalize edilip commit edilecek (Faz 0). |
| D10 | 3 paket major sürüm geride (`lucide-react`, `shadcn`, `typescript`) | Low | `npm outdated` çıktısı: lucide-react 0.575.0->1.34.0, shadcn 3.8.5->4.19.0, typescript 5.9.3->7.0.2 | Ayrı bir PR'da, changelog kontrolüyle yükseltilecek; güvenlik yamasını geciktirmeyecek (Faz 0 sonrası). |
| D11 | Test ve format script'i yok | Low | package.json:5-10 (yalnızca dev/build/start/lint) | `typecheck` script'i eklenecek; kapsam küçük olduğu için tam test suite zorunlu tutulmuyor (Faz 0). |
| D12 | `.env.example` eksiksiz, `.env` doğru ignore ediliyor | Info | .env.example:1-9; src/lib/resend.ts:1-5; route.ts:4-5; .gitignore:14-16 | Değişiklik gerekmiyor; Coolify'da bu üç değişkeni production'da tanımlamak yeterli. |
| D13 | `tsc --noEmit` ve `eslint` temiz geçiyor | Info | komut çıktıları: `npx tsc --noEmit` exit 0; `npm run lint` exit 0, uyarı yok | Bu temizlik GitHub Actions'a bağlanarak korunacak (Faz 1, bkz. D5). |

## Riskler ve Notlar

Denetim raporlarının önerileriyle 02-stack-karari.md ve ilgili kararlar arasında dört noktada fark var; sentez (synthesis.json) kazanıyor, buradaki tablo denetim bulgusunu, aşağıdaki not ise nihai kararı gösteriyor:

- **Not 1 (font seçimi, F1):** Frontend denetimi `next/font/google` ile Fraunces yüklenmesini önerdi. Karar bunu reddetti: `next/font/google` build sırasında Google'a ağ isteği atıyor, bu da Coolify/GitHub Actions üzerinde kendi sunucusunda alınan build'i kırabilecek gerçek bir bağımlılık (vercel/next.js#91653). Seçilen çözüm: Geist Sans/Mono Variable ve Instrument Serif woff2 dosyalarının (latin + latin-ext) repoya vendor'lanıp `next/font/local` ile yüklenmesi. Ayrıntı için 02-stack-karari.md ve 03-tasarim-ui-ux.md.
- **Not 2 (Turnstile, B1):** Backend denetimi CAPTCHA/Turnstile eklenmesini high severity önerdi. Karar YAGNI gerekçesiyle Turnstile'ı şimdilik erteledi: honeypot + rate limit + uzunluk sınırı kişisel bir portfolyo formunda spam'in büyük kısmını eliyor, kanıtlanmış bir spam problemi yokken üçüncü taraf bağımlılığı eklenmiyor. Route'da doğrulama seam'i açık bırakılacak, gerçek spam gelirse tek bir siteverify çağrısıyla eklenecek. Ayrıntı için 09-guvenlik.md.
- **Not 3 (next sürüm durumu, B2/D10):** Devops denetimi `npm outdated` çıktısına göre `next@16.1.6`'yı "zaten Latest" olarak işaretledi; backend denetimi ise web araştırmasıyla 25 Ağustos 2026'da yayınlanan 16.3.3'ün iki kritik CVE'yi (AVIF/libheif üzerinden kimlik doğrulamasız RCE ve CVE-2026-75604) kapattığını buldu. Bu fark muhtemelen devops denetiminin `npm outdated`'i registry'nin henüz güncellenmediği bir anda çalıştırmasından kaynaklanıyor. Sentez ikinci bulguyu esas alıyor: `next` 16.1.6 -> 16.3.3 yükseltmesi Faz 0'da zorunlu. Ayrıntı için 09-guvenlik.md.
- **Not 4 (docker-compose kapsamı, D4):** Devops denetimi genel bir `docker-compose.yml`'i medium severity önerdi ("en azından yerel test için"). Karar, ana portfolyo uygulamasının Coolify'da git tabanlı Dockerfile build pack ile deploy edilmesi yönünde: `docker-compose` build pack Coolify'da rolling update'i devre dışı bırakıyor, tek servisli bir sitede kazanç sağlamadan downtime riski ekliyor. Compose yalnızca Gatus/Umami gibi yan servisler için ayrı bir Coolify resource'u olarak düşünülüyor. Ayrıntı için 06-devops-ve-deploy.md.

## Korunmaya Değer Parçalar

Üç denetimin de ayrı ayrı işaretlediği, yeniden yapıda değiştirilmeden veya küçük düzenlemeyle taşınabilecek parçalar:

- `src/components/ui/section-heading.tsx`: eyebrow/title/description/action düzenini tek yerden yöneten başlık bileşeni, aynen taşınabilir.
- `src/components/layout/theme-toggle.tsx`: `useSyncExternalStore` ile hydration-safe next-themes entegrasyonu, iyi bir referans implementasyon.
- `globals.css` oklch tabanlı token mimarisi ve `@theme inline` eşlemesi (satır 7-49, 51-123): yapı korunacak, palet değerleri nötrlenecek (bkz. 03-tasarim-ui-ux.md).
- `globals.css` utility sınıfları: `.page-shell`/`.page-shell-narrow`/`.page-shell-reading`, `.section-space`, `.surface-panel`, `.eyebrow`, `.section-title`/`.section-copy` (satır 173-205), tüm sayfalarda tutarlı spacing/radius/glassmorphism sağlıyor.
- `src/app/opengraph-image.tsx` ve `icon.tsx`: `next/og` ile edge-render OG görseli/favicon altyapısı çalışıyor; içerik (isim, başlık) güncellenerek korunacak, edge runtime kaldırılacak (bkz. Faz 0).
- `src/components/sections/contact-form.tsx`: honeypot alanı (satır 116-119, `-left-9999px` ile gizlenmiş input) ve loading/error/success state yönetimi sağlam; sunucu taraflı kontrol eklenerek korunacak.
- `src/app/api/contact/route.ts` + `src/lib/resend.ts`: `validateBody` fonksiyonunun tip kontrolü + trim yapısı ve `apiKey` yoksa `resend=null` yapan null-guard pattern'i, sertleştirme (rate limit, jenerik hata) eklenerek korunacak.
- `src/components/ui/button.tsx`: cva ile variant/size matrisi (default/outline/ghost/secondary/destructive/link × xs/sm/default/lg/icon), kapsamlı ve tutarlı.
- `sitemap.ts`/`robots.ts`'in `projects.ts`'den slug türetme mantığı (sitemap.ts:14-19): kod değişmeden, yalnızca veri kaynağı gerçek içerikle değiştirilerek çalışır.
- `.gitignore`: Next.js/TypeScript/Claude Code/nodeterm için hariç tutma listesi kapsamlı ve doğru yapılandırılmış, aynen taşınabilir.
- `components.json` (shadcn: `new-york` style, neutral base, `cssVariables`): mevcut hali korunabilir.

## Sonraki Adım

4 critical ve 7 high bulgunun tamamı (F1-F4, B1-B2, D1-D3, D5-D6) 10-yol-haritasi.md'deki Faz 0 ve Faz 1 checklist'lerine giriyor; site sahibinin onayını beklemeden bugün başlanabilir. Medium ve low bulgular ilgili faz dokümanlarında (02, 03, 04, 06, 09) ayrıntılı olarak işleniyor, burada tekrar edilmiyor. Info seviyesindeki bulgular (blog pipeline, status widget, analytics) yeni özellik kapsamında olduğu için Faz 4 ve Faz 5'e planlandı, bugünkü hijyen çalışmasını bloklamıyor.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md) - genel karar özeti
- [02-stack-karari.md](./02-stack-karari.md) - stack ve font kararı
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md) - palet, mobil menü, hareket, erişilebilirlik
- [04-i18n.md](./04-i18n.md) - URL tabanlı i18n mimarisi
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) - Velite içerik pipeline'ı
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) - Dockerfile, Coolify, domain yönlendirme
- [09-guvenlik.md](./09-guvenlik.md) - contact sertleştirmesi, next güvenlik yamaları
- [10-yol-haritasi.md](./10-yol-haritasi.md) - Faz 0-5 checklist'leri, bu bulguların hangi fazda kapatıldığı

## Kaynaklar

- [August 2026 Security Release | Next.js](https://nextjs.org/blog/august-2026-security-release)
- [Upcoming Next.js August Security Release | Next.js](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026)
- [45M Weekly Downloads at Risk: Next.js CVE-2026-75604 (CVSS 9.0) Enables Unauthenticated Remote Code Execution](https://securityonline.info/nextjs-rce-vulnerability/)
- [Ultimate Next.js Standalone Dockerfile Guide (Tiny Images) | Build with Matija](https://www.buildwithmatija.com/blog/nextjs-standalone-dockerfile-guide)

## Bulguların kapanış durumu (2026-08-27)

Faz 0, Faz 1, Faz 2 ve Faz 3 sırayla `main`'e merge edildi (PR #2, #3, #4, #5). Faz 4 dalı (`feature/faz-4-icerik-ve-yayin`, HEAD `8b4fe40`) PR #6 olarak açık, CI yeşil, merge kararı site sahibinde; aşağıdaki "Faz 4 (PR #6, açık)" satırları bu koda karşılık geliyor, henüz `main`'de değil.

| # | Bulgu | Kapanış | Kanıt |
|---|---|---|---|
| F1 | `--font-fraunces` tanımsız, `next/font` yok | Kapandı: Faz 3 (PR #5) | `src/fonts/` (Geist, Geist Mono, Instrument Serif woff2, latin + latin-ext), `next/font/local` ile bağlandı, Google Fonts isteği yok |
| F2 | Cookie tabanlı i18n SEO'yu kırıyor | Kapandı: Faz 2 (PR #4) | `src/i18n/routing.ts`, `app/[lang]/`, `src/proxy.ts`; `cookies()` çağrıları kaldırıldı |
| F3 | İçerik %100 şablon (Alex Chen, example.com) | Kapandı: Faz 4 (PR #6, açık) | `content/projects/{en,tr}/` (5 case study), `content/blog/` (4 yazı), `src/content/profile.ts`; `tests/no-template-residue.test.ts` |
| F4 | Mobilde ana navigasyon erişilemiyor | Kapandı: Faz 3 (PR #5) | `src/components/layout/mobile-menu.tsx` (Radix Dialog), footer'a sayfa linkleri eklendi |
| F5 | `prefers-reduced-motion` desteği yok | Kapandı: Faz 3 (PR #5) | `src/app/globals.css:218` medya sorgusu; `useReducedMotion` (hero, contact-form, project-card, post-list, skills-strip, contact-page-content); LazyMotion + `m` |
| F6 | Gerçek görsel yok, placeholder gradient | Açık: Faz 4'te bilinçli "kapaksız yayın" kararı alındı (placeholder da kaldırıldı), ama kapak görselleri hâlâ 0 ve site sahibinden bekleniyor | `content/images/` yalnızca `.gitkeep` içeriyor |
| F7 | Metadata cookie'ye bağımlı, canonical/alternates yok | Kapandı: Faz 2 (PR #4), Faz 4'te (PR #6, açık) ayrı bir katmana taşındı | `generateMetadata` locale param'ından üretiyor, canonical + hreflang + x-default var; `src/lib/seo/alternates.ts`, `src/lib/seo/page-metadata.ts` |
| F8 | Şablon SVG'ler ve README | Kapandı: Faz 0 (PR #2) | `README.md` yeniden yazıldı; create-next-app SVG'leri silindi |
| F9 | Contact form durum mesajlarında `aria-live` yok | Kapandı: Faz 3 (PR #5) | `src/components/sections/contact-form.tsx:121,129` (`role="alert"`, `role="status"`) |
| F10 | footer sosyal linkler/email hardcoded | Kapandı: Faz 4 (PR #6, açık) | `src/lib/site.ts` (`SOCIAL`, `CONTACT_EMAIL_PUBLIC`), `footer.tsx` bunlardan okuyor |
| B1 | Rate limit/honeypot/CAPTCHA yok | Kapandı: Faz 0 (PR #2) | `src/lib/rate-limit.ts` (5 istek/10 dk/IP, LRU tahliye), `src/lib/contact-validation.ts` (sunucu taraflı honeypot); Turnstile bilinçli olarak ertelendi (Not 2, hâlâ geçerli) |
| B2 | `next` güvenlik yamalarının gerisinde | Kapandı: Faz 0 (PR #2) | `package.json`: `"next": "16.3.3"` |
| B3 | Resend hata mesajı client'a sızıyor | Kapandı: Faz 0 (PR #2) | `/api/contact` jenerik hata mesajı dönüyor, detay yalnızca sunucu logunda |
| B4 | `CONTACT_EMAIL`/`FROM_EMAIL` sessiz fallback | Kapandı: Faz 0 (PR #2) | `src/lib/env.ts`: prod'da bu değişkenler zorunlu |
| B5 | `next.config.ts` boş | Kapandı: Faz 0 (PR #2) | `next.config.ts`: `output:"standalone"`, `poweredByHeader:false`, CSP + güvenlik başlıkları |
| B6 | `NEXT_PUBLIC_SITE_URL` tanımsız | Kapandı: Faz 0 (PR #2) | `src/lib/env.ts`: build'de zorunlu, http(s) origin doğrulaması |
| B7 | Email format doğrulanmıyor | Kapandı: Faz 0 (PR #2) | `src/lib/contact-validation.ts`: email regex + uzunluk sınırları |
| B8 | `sitemap.ts` şablon slug'ları index ediyor | Kapandı: Faz 2 (PR #4) iki locale'li sitemap, Faz 4'te (PR #6, açık) Velite'tan yalnızca var olan çeviriler | `src/app/sitemap.ts`: `getProjects`/`getPosts` içerik katmanından okuyor |
| B9 | Request body boyutu sınırı yok | Kapandı: Faz 0 (PR #2) | `src/lib/request-body.ts`: 16 KB byte sınırlı okuyucu, chunked dahil, 413 |
| B10 | OG image/favicon şablon içeriği | Kapandı: Faz 3 (PR #5) | `src/app/[lang]/opengraph-image.tsx`, `icon.tsx`: gerçek kimlik, DCY monogram |
| B11 | Blog/yazılar için içerik pipeline'ı yok | Kapandı: Faz 4 (PR #6, açık) | `velite.config.ts`, `content/blog/` (4 yazı) |
| B12 | Canlı status/homelab widget veri kaynağı yok | Açık: Faz 5'te planlı, henüz başlamadı | - |
| B13 | Analytics entegrasyonu yok | Açık: Faz 5'te planlı (Umami kesin evet), henüz başlamadı | - |
| D1 | Dockerfile yok | Kapandı: Faz 1 (PR #3) | `Dockerfile` (deps/builder/runner, node:24-alpine, non-root `node` kullanıcısı) |
| D2 | `.dockerignore` yok | Kapandı: Faz 1 (PR #3) | `.dockerignore` |
| D3 | `next.config.ts`'de `output:'standalone'` yok | Kapandı: Faz 0 (PR #2) | `next.config.ts`: `output:"standalone"` |
| D4 | docker-compose/Coolify compose tanımı yok | Kapandı: Faz 1 (PR #3), yalnızca yerel doğrulama amacıyla | `docker-compose.yml`: "Local verification only. Coolify does NOT use this file." |
| D5 | GitHub Actions workflow yok | Kapandı: Faz 1 (PR #3) | `.github/workflows/ci.yml`: lint/typecheck/test/build/verify:routes + hadolint + docker build, image push yok |
| D6 | Health-check endpoint yok | Kapandı: Faz 0 (PR #2) | `src/app/api/health/route.ts` |
| D7 | Node sürüm pin'i yok | Kapandı: Faz 0 (PR #2) | `.nvmrc` (24), `package.json` `engines.node ">=20.9"` |
| D8 | README hâlâ create-next-app şablonu | Kapandı: Faz 0 (PR #2) | `README.md` yeniden yazıldı (stack tablosu, Coolify/Docker deploy notları) |
| D9 | `package-lock.json`'daki değişiklik npm sürüm farkı | Kapandı: Faz 0 (PR #2) | Lockfile npm 11 ile normalize edilip commit edildi |
| D10 | 3 paket major sürüm geride | Kısmen kapandı: `tailwindcss` Faz 3'te (PR #5) güncellendi; `lucide-react`, `shadcn`, `typescript` hâlâ major geride, ayrı PR bekliyor | `package-lock.json`: `tailwindcss` `4.3.3`'e çözülüyor; `package.json`: `lucide-react ^0.575.0`, `shadcn ^3.8.5`, `typescript ^5` değişmedi |
| D11 | Test ve format script'i yok | Kapandı: Faz 0 (PR #2) | `package.json`: `test` (`vitest run`), `format`/`format:write` (prettier), `typecheck` |

Bu tabloya girmeyen D12 (`.env.example` eksiksiz) ve D13 (`tsc`/`eslint` temiz geçiyor) zaten Info seviyesinde "değişiklik gerekmiyor" olarak işaretlenmişti; D13'teki temizliğin korunması Faz 1'de GitHub Actions'a bağlandı (bkz. D5).

