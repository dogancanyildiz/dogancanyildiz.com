# Yönetici Özeti ve Ana Karar
Durum: Kısmen uygulandı (Faz 0-3 main'de PR #2-#5, Faz 4 PR #6 açık), kalan: Faz 4 merge kararı ve teslimatlar, Faz 5 · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

**Karar değişikliği (2026-08-27):** ana domain artık dogancanyildiz.com, dogancanyildiz.sh yalnızca 301 ile dogancanyildiz.com'a yönlenen ikincil domain. Bu bölümdeki ve doküman genelindeki tarihsel karar metni (dogancanyildiz.sh ana domain, .com 301) aşağıda olduğu gibi korunuyor; site sahibinin 2026-08-27 tarihli son kararı yönü tersine çevirdi.

Denetim üç kritik sorun ortaya çıkardı. Birincisi, site içeriği yüzde yüz şablon: Alex Chen persona'sı, altı kurgu proje, alex@example.com ve example.com kök linkli sosyal hesaplar hâlâ üretimde duruyor. İkincisi, i18n mimarisi cookie tabanlı çalıştığı için aynı URL iki farklı dil döndürüyor, hreflang teknik olarak kurulamıyor ve Googlebot cookie göndermediğinden TR içerik pratikte indekslenemiyor; kök layout'taki cookies() çağrısı ayrıca 11 route'un 8'ini gereksiz yere dynamic'e düşürüyor. Üçüncüsü, güvenlik ve deploy hattı eksik: repo Next 16.1.6'da donmuş durumda ve 2026 Temmuz-Ağustos'ta yayınlanan, biri kimlik doğrulamasız RCE olan kritik yamaların gerisinde; Docker/Coolify pipeline'ı hiç kurulmamış; contact formunun honeypot koruması yalnızca client tarafında çalışıyor, route.ts o alanı hiç okumuyor. Karar: mevcut Next.js 16 + React 19 + Tailwind 4 stack'inde kalınacak, sıfırdan yeniden yazım değil fazlı modernizasyon uygulanacak; tek istisna app/[lang] + next-intl restructure'ı olacak, o da tek PR'da bitirilecek. Çalışma altı fazda ilerleyecek (Faz 0-4 yayına kadar, Faz 5 yayın sonrası) ve 11 madde site sahibinin onayını bekliyor. 2026-08-27 itibarıyla Faz 0-3 main dalında sırayla merge edildi (PR #2-#5), Faz 4 feature/faz-4-icerik-ve-yayin dalında tamamlandı ve PR #6 olarak açık (21 commit, HEAD 8b4fe40, CI yeşil: typecheck, lint, test 32 dosya/458 test, prettier, build, verify:routes, hadolint, Docker imaj), merge kararı site sahibinde; Faz 5 henüz başlamadı.

### Bulunan 3 kritik sorun

| # | Sorun | Kanıt | Etki |
|---|---|---|---|
| 1 | İçerik yüzde yüz şablon | translations.ts'te brand hâlâ "Alex Chen Portfolio", footer'da hardcoded alex@example.com, projects.ts'te 6 kurgu proje github.com/example.com kök linkleriyle, about'ta TechCorp/StartupXYZ deneyimleri | Hiçbir tasarım veya SEO çalışması anlam taşımıyor; yanlış isim indekslenirse Person schema hedefi de bozulur |
| 2 | i18n mimarisi kırık | layout.tsx:11 ve :30'da cookies() okunuyor, aynı URL isteğe göre farklı dil döndürüyor | hreflang teknik olarak kurulamıyor, TR içerik pratikte indekslenemiyor, kök layout'taki cookies() 11 route'un 8'ini dynamic'e düşürüyor |
| 3 | Güvenlik ve deploy hattı eksik | Next 16.1.6 (Temmuz-Ağustos 2026 yamalarının gerisinde, biri AVIF/libheif üzerinden kimlik doğrulamasız RCE), repo'da Dockerfile/.dockerignore/.github/workflows yok, contact formunun honeypot alanı yalnızca contact-form.tsx'te (client) kontrol ediliyor, route.ts hiç okumuyor | CVE-2026-44578 (WebSocket upgrade SSRF, CVSS 8.6) yalnızca self-hosted Node sunucusunu etkiliyor; curl ile atılan istekte spam koruması sıfır; image build'e hiç hazır değil |

## Karar(lar)

Aşağıdaki kararlar kategori bazında gruplandı; her biri kendi detay dokümanında tam gerekçe, reddedilen alternatif ve uygulama adımlarıyla açıklanıyor. Bu bölüm yalnızca yönü veriyor.

**Stack:** Next.js 16.3.3 (App Router, app/[lang], output: 'standalone') + React 19.2 + Tailwind 4.3.x + shadcn/ui + next-intl 4.13.7 + Velite 0.4.0 (MDX) + motion 13.1.1, Docker + Coolify üzerinde self-host. Detay: [02-stack-karari.md](./02-stack-karari.md).

**Migrate vs modernize:** incremental-modernize. Aynı repo, aynı stack, fazlı dallar halinde ilerlenecek. Silinen şey mimari değil içerik ve i18n plumbing'i: src/lib/i18n/translations.ts, src/components/locale-provider.tsx, dört layout'taki cookies() çağrıları ve tüm Alex Chen metinleri gidiyor. Gerçek emek barındıran katman (shadcn bileşenleri, Button cva matrisi, ThemeToggle'ın hydration-safe kurulumu, opengraph-image route'u, çalışan Resend entegrasyonu) yerinde kalıyor. Repo şu an tsc --noEmit ve eslint'ten temiz geçiyor; bu güvenlik ağı fazlı ilerleyerek korunacak.

**Ana yön, alan bazında:**

- Tasarım/UI: Terminal Editorial yönü, nötr zemin üstünde emerald tek bir aksan/status rengine indiriliyor, tek sütun editoryal layout, mobil menü eksikliği kapatılıyor. Detay: [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md).
- i18n: app/[lang] + next-intl 4.13.7, localePrefix 'as-needed' (EN kökte, TR /tr altında), otomatik Accept-Language yönlendirmesi kapalı. Detay: [04-i18n.md](./04-i18n.md).
- İçerik altyapısı ve servisler: Velite ile MDX (proje + blog, iki dilde, çevrilmemiş içerik için fallback sayfa yok), Resend contact formu üç katmanla sertleştiriliyor, Gatus'un JSON API'sinden beslenen canlı status widget'ı ekleniyor. Detay: [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md).
- Deploy: çok aşamalı Dockerfile + Coolify GitHub App ile git tabanlı build, PR başına preview açık, GitHub Actions yalnızca lint/typecheck/build kapısı olarak çalışıyor, image push etmiyor. Detay: [06-devops-ve-deploy.md](./06-devops-ve-deploy.md).
- İçerik: tüm şablon persona siliniyor, .local/content/portfolio-content.md'den gerçek içerik (Doğan Can Yıldız, 4-5 gerçek proje case study'si, gerçek sosyal linkler) yazılıyor. Detay: [08-icerik-stratejisi.md](./08-icerik-stratejisi.md).

### Faz özeti

| Faz | Hedef (tek satır) | Durum |
|---|---|---|
| 0. Güvenlik ve hijyen | Bilinen CVE'leri kapat, Next 16.3.3'e çık, ölü boilerplate'i temizle; site hâlâ şablon ama temel sağlam. | Uygulandı (main, PR #2) |
| 1. Deploy hattı | Her push'ta kendi sunucusunda otomatik yayın, PR preview, doğru domain yönlendirmesi. | Uygulandı (main, PR #3); panel/Coolify adımları sahibinin manuel checklist'inde ayrıca doğrulanacak |
| 2. i18n yeniden mimarisi | İki dil ayrı URL'de, tüm içerik route'ları build'de prerender, hreflang/canonical doğru. | Uygulandı (main, PR #4) |
| 3. Tasarım sistemi | Font gerçekten yüklensin, palet nötrlensin, mobil menü gelsin, hareket ve erişilebilirlik toparlansın. | Uygulandı (main, PR #5) |
| 4. İçerik ve yayın | Şablon persona tamamen gitsin, gerçek case study'ler ve ilk blog yazıları iki dilde yayına çıksın; bu fazın sonu launch. | PR #6 açık, CI yeşil, merge kararı sahibinde; sahibinin teslim edeceği içerikler bekleniyor |
| 5. Altyapı vitrini ve ölçüm | Gatus tabanlı status widget, Umami, Renovate/Dependabot otomasyonu; yayın sonrası. | Başlamadı |

Detay: [10-yol-haritasi.md](./10-yol-haritasi.md).

### Sürüm özeti

Hızlı referans için ana bağımlılıkların hedef sürümleri:

| Bağımlılık | Mevcut (Faz 0 öncesi) | Hedef | Durum (2026-08-27) |
|---|---|---|---|
| next | 16.1.6 | 16.3.3 | Uygulandı, package.json'da 16.3.3 |
| react | 19.x | 19.2 | Uygulandı, package.json'da 19.2.3 |
| tailwindcss | 4.x | 4.3.x | Uygulandı, package-lock'ta çözülen sürüm 4.3.3 |
| next-intl | yok | 4.13.7 | Uygulandı, package.json'da 4.13.7 |
| velite | yok | 0.4.0 (exact pin) | Uygulandı, package.json'da exact 0.4.0 |
| motion (framer-motion) | ^12.34.3 | motion 13.1.1 | Uygulandı, package.json'da motion 13.1.1 |
| node | pin yok | 24 (.nvmrc), engines.node >=24 | Uygulandı, .nvmrc 24 ve engines.node >=24 |

typescript ve lucide-react major yükseltmeleri kasten bu listede yok; breaking değişiklik riski taşıdıkları için güvenlik yamasından ayrı, sonraki bir PR'a bırakıldı. Tam gerekçe ve yükseltme sırası: [02-stack-karari.md](./02-stack-karari.md).

**Açık sorular:** 11 sorunun tamamı 2026-08-27'de site sahibi tarafından cevaplandı (CV PDF, sertifika doğrulama linkleri, Speaking içeriği, proje/ekran görüntüsü kapsamı, contact e-posta adresi, status widget kapsamı, sunucu RAM/CPU, Cloudflare proxied mod, blog dil politikası, Harp Okulu/İngilizce sunumu, Umami). Son kalan soru da aynı gün cevaplandı: iletişim domain'inin son hali. **Karar değişikliği (2026-08-27):** ana domain dogancanyildiz.com, dogancanyildiz.sh 301 ile yönlenir (tarihsel öneri metni "dogancanyildiz.sh ana domain, .com 301" idi, sahibinin son kararıyla yönü tersine döndü, bkz. [11-acik-sorular.md](./11-acik-sorular.md) soru 5). Bunun dışında Faz 4'ün PR #6'sı somut teslimatlar bekliyor, bunlar açık soru değil eksik girdi: Konuşmalar (speaking) verisi, sertifika verifyUrl'leri, proje kapak görselleri, birinci şahıs metin onayı, CV içerik onayı, Wikonya'nın canlı site adı ("Konya Genç" olarak değişti, link teyidi gerekiyor) ve ticket-purchasing-system repo linki onayı. Tam liste ve cevaplar: [11-acik-sorular.md](./11-acik-sorular.md).

## Gerekçe

Stack kararı üç kritere dayanıyor, dördüncüsüne değil. next-intl'in kutudan verdiği ICU mesaj/çoğul/tarih katmanı Astro'da yok (Astro'nun i18n'i yalnızca bir routing API'si). Sahibinin BerrSoft'ta yazdığı ve CV'sinde geçen Next.js becerisi, sitenin kanıtlaması gereken profille örtüşüyor; asıl iddia zaten framework seçimi değil, Vercel'siz Next.js'i kendi sunucusunda Coolify/Docker/Traefik ile çalıştırmak. Üçüncüsü taşınabilirlik: mevcut shadcn bileşenleri, token mimarisi ve çalışan Resend entegrasyonu Next'te kalınca yerinde kalıyor. Dördüncü kriter, yani self-host ayak izi, gerekçeden çıkarıldı: doğrulama, stack araştırmasının Astro için verdiği 190 MB node_modules ölçümünün hatalı olduğunu gösterdi (test projesinde devDependencies hiç yoktu, npm prune no-op çalışmıştı). Gerçek rakamlar Astro SSR runtime 41 MB / RSS 92 MB, Next standalone 61 MB / RSS 117-144 MB; yani disk ve RAM'de Next önde değil, Astro'nun bundle ve content collections üstünlükleri açıkça kabul ediliyor. Modernize kararı ise repo'nun büyük kısmının zaten sağlam olmasından geliyor: klasör yapısı, renk token değerleri, font yükleme ve içerik kaynağı dosya bazında cerrahi düzenlemelerle değişiyor; sıfırdan yazım bu katmanları da çöpe atardı ve karşılığında hiçbir şey kazandırmazdı.

Doğrulama sürecinde üç teknik çelişki daha çözüldü ve karar setini değiştirdi. MDX pipeline'ında @next/mdx + Turbopack kombinasyonunun remark/rehype eklentilerini yalnızca string adıyla kabul ettiği, fonksiyon plugin geçirilemediği doğrulandı; bu yüzden Velite 0.4.0 seçildi, çünkü MDX'i kendi pipeline'ında derleyip bu kısıttan etkilenmiyor. Performans hedefi de düzeltildi: 16.3.3'te hiçbir şey import etmeyen boş bir sayfa bile 127 KB gzip first-load JS taşıyor, bu yüzden hedef ~70 KB değil ~125-130 KB gzip olarak revize edildi; asıl kazanç LazyMotion'dan değil i18n prerender'ından geliyor (225 KB'den 131 KB'ye, yüzde 42). Font tarafında next/font/google'ın build-time Google Fonts isteği self-host build'ini kırabildiği (vercel/next.js#91653) doğrulanınca woff2 dosyalarının repoya vendor'lanması zorunlu kılındı. Tam gerekçe: [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md), [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md).

## Reddedilen alternatifler

| Alternatif | Neden reddedildi |
|---|---|
| Astro 7.2.7 + @astrojs/node | i18n mesaj katmanı yok, mevcut React/shadcn/motion katmanının tamamı yeniden yazılır, sahibinin Next.js kanıtı siteden kalkar. Ayak izi cezası ölçüldüğü üzere yok; blog ciddi büyürse yeniden değerlendirilecek gerçek bir seçenek. |
| SvelteKit 2.70.3 | Muhtemelen en hafif çıktı ama Svelte ne işte ne CV'de geçiyor, profille çelişki kabul edilemez. |
| Nuxt 4.5.2 + @nuxtjs/i18n | Listedeki en eksiksiz i18n modülü ama Vue olması aynı profil çelişkisini yaratıyor, tüm kod yeniden yazılır. |
| TanStack Start 1.168.x | React kalır ama statik prerender, i18n routing ve MDX content layer için kanonik yol yok. |
| Next'te kalıp cookie tabanlı i18n'i korumak | Aynı URL iki dil sunduğundan hreflang kurulamıyor, layout.tsx:11 ve :30'daki cookies() çağrısı 8 route'u dynamic'e düşürüyor. Savunulabilir değil. |
| Sıfırdan yeniden yazım (full rewrite) | Çalışan katmanları (UI bileşenleri, token mimarisi, Resend entegrasyonu) da siler, karşılığında hiçbir kazanç getirmez; fazlı yaklaşım her adımda çalışan bir site bırakıyor. |

Kategori bazlı reddedilen alternatiflerin tam gerekçesi: [02-stack-karari.md](./02-stack-karari.md), [04-i18n.md](./04-i18n.md), [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md).

## Riskler ve tripwire'lar

- **Ayak izi iddiası çürütüldü:** Stack kararı artık disk/RAM üstünlüğüne dayanmıyor, yalnızca i18n, profil ve taşınabilirlik gerekçesine dayanıyor. Tripwire: blog ciddi şekilde büyürse (Faz 5 sonunda, ilk 3 ayın ardından) Astro yeniden değerlendirilecek.
- **next-intl bir tercih, zorunluluk değil:** Bağımlılıksız [lang] + elle sözlük de ~40 satırla çalışıyor ve tam statik üretim veriyor. Tripwire: setRequestLocale disiplini yüzünden route'lar sessizce dynamic'e düşerse veya next-intl bir Next major'ında takılırsa bağımlılıksız yola dönülecek.
- **Velite 0.x sürüm riski:** Exact pin ve lockfile commit ile sınırlanıyor, caret kullanılmıyor.
- **Turbopack + standalone external paket trace regresyonu** (vercel/next.js#88844): bugün bu projeyi ısırmıyor, ama Dockerfile'a external paket eklenirse next build --webpack'e geçiş gerekebilir.
- **Google Fonts build-time bağımlılığı** (vercel/next.js#91653): self-host build'ini kırabiliyor, bu yüzden font vendoring zorunlu kılındı, next/font/google kullanılmıyor. **Kapandı (Faz 3, PR #5):** Geist, Geist Mono, Instrument Serif woff2 dosyaları src/fonts/ altında vendor'landı, next/font/local ile bağlandı, build sırasında Google Fonts isteği yok.
- **Coolify health check bug'ı** (coollabsio/coolify#7500): Dockerfile HEALTHCHECK + Node container kombinasyonunda bilinen connection-refused sorunu var, staging'de ayrıca doğrulanacak. **Kısmen doğrulandı (Faz 1, PR #3):** yerel Docker'da `docker run` + `docker inspect` ile health status "healthy" doğrulandı, PORT override ile de çalıştığı görüldü; Coolify sunucusundaki canlı doğrulama (panel adımı) henüz uygulanmadı, faz-1-manual-checklist.md'de bekliyor.
- **Env katmanı hatası:** RESEND_API_KEY Build olarak işaretlenirse image katmanlarına veya build loglarına sızabilir; NEXT_PUBLIC_SITE_URL yalnızca Runtime işaretlenirse client bundle'a hiç gömülmez ve production'da sessizce undefined döner. **Belgelendi, canlıda doğrulanmadı:** Build/Runtime ayrımı docs/deploy/coolify-kurulum.md ve faz-1-manual-checklist.md'de adım adım yazılı; Coolify panelinde fiilen uygulanması ve doğrulanması panel adımları arasında, henüz koşulmadı.
- **Açık sorular büyük ölçüde çözüldü, Faz 4 artık yalnızca teslimat ve merge kararı bekliyor:** CV PDF'i, sertifika linkleri, Speaking içeriği ve proje kapsamı kararları 2026-08-27'de netleşti (bkz. [11-acik-sorular.md](./11-acik-sorular.md)); Faz 4 kod olarak PR #6'da tamamlandı ve CI yeşil, kalan bağımlılık yalnızca somut dosyaların (sertifika doğrulama linkleri, proje kapak görselleri, Konuşmalar verisi) teslim edilmesi ve sahibinin merge kararı. Teslim gelmezse ilgili alan placeholder olarak değil, boş/kapaksız bırakılarak yayınlanır. Geriye kalan tek gerçek açık soru (iletişim domain'inin son hali) Faz 4'ü değil, yalnızca domain 301'inin canlıya alınmasını etkiler.

Açık soruların tam listesi ve her birinin gerektirdiği karar: [11-acik-sorular.md](./11-acik-sorular.md).

## Uygulama durumu (2026-08-27)

Bu bölüm kontrol oturumu tarafından repodaki gerçek duruma bakılarak doğrulandı; yukarıdaki karar metni tarihsel kayıt olarak korunuyor, bu bölüm onun üstünde geçerli.

### Faz-PR eşlemesi

| Faz | Dal | PR | Durum |
|---|---|---|---|
| 0. Güvenlik ve hijyen | feature/faz-0-guvenlik-ve-hijyen | #2 | Merged -> main |
| 1. Deploy hattı | feature/faz-1-deploy-hatti | #3 | Merged -> main |
| 2. i18n yeniden mimarisi | feature/faz-2-i18n-app-lang | #4 | Merged -> main |
| 3. Tasarım sistemi | feature/faz-3-tasarim-sistemi | #5 | Merged -> main |
| 4. İçerik ve yayın | feature/faz-4-icerik-ve-yayin | #6 | Açık, CI yeşil, 21 commit, HEAD 8b4fe40, merge kararı sahibinde |
| 5. Altyapı vitrini ve ölçüm | yok | yok | Başlamadı |

Bunların dışında, bir faz sayılmayan çapraz kesen bir altyapı değişikliği daha var: **ana domainin dogancanyildiz.com'a sabitlenmesi ve dallanma/sürüm otomasyonu** (dal `feature/com-primary-and-release-flow`, `dev`'den açıldı). Kapsamı: `NEXT_PUBLIC_SITE_URL`/sitemap/robots/testlerin `.com`'a geçirilmesi, `ci.yml`'in `dev` ve `main`'de zorunlu koşması, `main`'e her merge'de otomatik tag + GitHub Release + `CHANGELOG.md` üreten `release.yml`. Kod tarafı bu dalda tamamlandı ve kalite kapıları yeşil; bu değişiklik dev'e PR ile girer, PR numarası burada henüz belirtilmiyor, ana oturum PR açıldığında bu satırı günceller. Detay: [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) "Dallanma ve sürüm akışı".

### Kapılar (Faz 4 HEAD, 8b4fe40)

`npm run typecheck`, `npm run lint`, `npm test` (32 dosya / 458 test), `npm run format`, `npm run build` (yalnızca `/api/contact` ve `/api/health` dynamic, geri kalan tüm route'lar statik), `verify:routes` (26 içerik route'u statik: 5 proje x 2 locale, 1 EN yazı, 3 TR yazı), `hadolint` ve Docker imaj build'i; hepsi CI'da yeşil. Docker imajı iki locale'i (en, tr) servis ediyor. Şablon persona kalıntısı (Alex Chen, example.com) repoda sıfır; `tests/no-template-residue.test.ts` bunu kilitliyor.

### Süreç özeti

Faz 0 ve Faz 1 workflow içi faz liderleriyle yürütüldü; Faz 1'de faz lideri ile fork'un aynı git ağacında çakışması üzerine paralel ajanlar durduruldu ve kontrol oturumu devraldı. Faz 2 ve Faz 3 task bazlı v2 executor ile ilerledi: haiku planı task'lara ayrıştırıp model atadı, her task'ı task'a uygun model (haiku/sonnet/opus) uyguladı, opus bağımsız inceleme yaptı, fable entegrasyonu ve devir notunu yazdı, ardından iki bağımsız doğrulayıcı geçiş yaptı. Faz 4 ise sahibinin talebiyle ayrı bir nodeterm Claude Code oturumunda (Fable, ultracode) yürütüldü; her fazda iki bağımsız opus doğrulama geçişi yapıldı ve bloklayan bulgular tek düzeltme turuyla kapatıldı (örn. Faz 4'te 7 olgu bulgusu `0d418af` ile, `/foo/feed.xml` 200 bulgusu `48bbd9e` ile).

### Kalanlar

- **Faz 4 (PR #6):** merge kararı sahibinde; sahibinin teslim etmesi gereken içerikler: Konuşmalar (speaking) verisi, sertifika `verifyUrl` değerleri, proje kapak görselleri, birinci şahıs metin onayı (üç blog yazısı ve beş case study), CV PDF içerik onayı, Wikonya'nın canlı site adı teyidi ("Konya Genç"), ticket-purchasing-system repo linki onayı.
- **Manuel kapılar hiç koşulmadı:** Lighthouse, hreflang test aracı, Search Console doğrulaması, contact formu uçtan uca testi, Coolify'daki canlı health check, Cloudflare 301'in canlıya alınması; docs/launch-checklist.md bu kapıların listesi.
- **Faz 1 panel adımları uygulanmadı:** Coolify, Cloudflare, Traefik, Resend domain kurulumu kodda ve dokümanda hazır ama sahibinin manuel checklist'i (docs/plans/handoffs/faz-1-manual-checklist.md) henüz işaretlenmedi.
- **Faz 5 hiç başlamadı:** Gatus container + status widget, Umami, Renovate GitHub App kurulumu, Next aylık güvenlik takibi, CSP nonce yolunun yeniden ele alınması, Faz 4'ten devredilen küçük test/sitemap x-default işleri.
- **Cevaplandı, canlıya alınmadı:** iletişim domain'inin son hali. **Karar değişikliği (2026-08-27):** ana domain dogancanyildiz.com, dogancanyildiz.sh 301 ile yönlenir (tarihsel öneri "dogancanyildiz.sh ana domain, .com 301" idi); Cloudflare Redirect Rule'un canlıya alınması hâlâ bekliyor.

## Uygulama notları

Faz sırası bağımlılık taşıyor. Faz 0 ve Faz 1 yayından bağımsız, hemen başlanabilir ve içerik onayı beklenirken bile ilerler; ikisi arasında sıkı bir sıra yok, paralel yürütülebilir. Faz 2 (i18n restructure) Faz 1'deki deploy hattı üzerinden test edilebilmesi için Faz 1'den sonra planlandı ve tek PR'da bitirilecek büyük hamle olarak işaretlendi, kısmi commit'lerle yarım bırakılmayacak; doğrulama kriteri build çıktısında tüm içerik route'larının statik olması, yalnızca /api/* altındaki route'ların dynamic kalması. Faz 3 (tasarım sistemi) Faz 2'den bağımsız çalışabilir ama aynı dosyalara (layout, globals.css) dokunduğu için sıraya alındı, çakışma riski azaltıldı. Faz 4 sonu launch noktası: Lighthouse ölçümü, hreflang testi, Search Console doğrulaması ve contact formu uçtan uca testi burada zorunlu kılınıyor; bu dört kontrol geçmeden domain yönlendirmesi (dogancanyildiz.sh -> dogancanyildiz.com) canlıya alınmıyor.

Domain ve ortam ayrımı yayın öncesi kritik: dogancanyildiz.com ana domain (**Karar değişikliği (2026-08-27):** sahibinin son kararı, tarihsel öneri metni tersiydi, bkz. açık soru 5), dogancanyildiz.sh Cloudflare Redirect Rules'ta tek atlamalı 301 ile dogancanyildiz.com'a yönlenecek (Traefik'teki karşılığı yalnızca yedek yol), dil prefix'ine dokunulmayacak. Coolify'da env değişkenleri Build/Runtime olarak bilinçli ayrılacak; bu ayrım Faz 1'de kurulmazsa NEXT_PUBLIC_SITE_URL client bundle'a hiç gömülmeyebilir veya RESEND_API_KEY yanlışlıkla build loglarına sızabilir, bkz. Riskler bölümü.

### Ana kararlar

**Karar değişikliği (2026-08-27):** ana domain dogancanyildiz.com, dogancanyildiz.sh 301 ile yönlenir (aşağıdaki DevOps satırındaki "Cloudflare proxied + Redirect Rules tek atlama 301" yönü de buna göre tersine döndü, bkz. [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)).

| Kategori | Karar | Güven | Detay dokümanı | Durum |
|---|---|---|---|---|
| Stack | Next.js 16.3.3'te kal, migrate değil incremental-modernize | Yüksek (0.88) | 02-stack-karari.md | Uygulandı (Faz 0, PR #2) |
| Tasarım / UI-UX | Terminal Editorial yönü, nötr palet + tek aksan, font vendoring | Yüksek | 03-tasarim-ui-ux.md | Uygulandı (Faz 3, PR #5) |
| i18n | app/[lang] + next-intl 4.13.7, as-needed prefix | Orta-yüksek, tripwire'lı | 04-i18n.md | Uygulandı (Faz 2, PR #4) |
| Backend / içerik altyapısı | Velite + MDX, Resend sertleştirme, Gatus status widget | Yüksek | 05-backend-icerik-ve-servisler.md | Kısmen uygulandı: Velite + Resend Faz 0/4'te (PR #2, #6); Gatus status widget Faz 5'te, başlamadı |
| DevOps / deploy | Docker + Coolify git tabanlı build, Cloudflare proxied + Redirect Rules tek atlama 301 (Traefik 301 yedek yol) | Yüksek | 06-devops-ve-deploy.md | Kısmen uygulandı (Faz 1, PR #3): Dockerfile/CI/Coolify dokümantasyonu kodda, kalan: Coolify panel kurulumu ve Cloudflare 301'in canlıya alınması |
| SEO / metadata | generateMetadata + hreflang + JSON-LD | Yüksek | 07-seo-ve-metadata.md | Uygulandı (Faz 2-4, PR #4, #6) |
| İçerik stratejisi | Şablon persona kaldırılır, case study formatı | Orta, açık sorulara bağlı | 08-icerik-stratejisi.md | Kısmen uygulandı (Faz 4, PR #6 açık), kalan: sertifika linkleri, kapaklar, Konuşmalar verisi, sahibinin metin/CV onayı |
| Güvenlik | Yükseltme + güvenlik başlıkları + Renovate otomasyonu zorunlu | Yüksek | 09-guvenlik.md | Kısmen uygulandı (Faz 0, PR #2): yükseltme ve başlıklar kodda, kalan: Renovate GitHub App kurulumu (Faz 5), npm audit ayrı PR |
| Yol haritası | 6 fazlı plan (Faz 0-5) | Yüksek | 10-yol-haritasi.md | Kısmen uygulandı: Faz 0-3 main'de, Faz 4 PR #6 açık, Faz 5 başlamadı |
| Ana domain | dogancanyildiz.com ana domain, dogancanyildiz.sh yalnızca 301 ile ona yönlenen ikincil domain (karar değişikliği; tarihsel öneri metni tam tersiydi, bkz. yukarıdaki not ve [11-acik-sorular.md](./11-acik-sorular.md) soru 5) | Kesin (sahibin kararı, 2026-08-27) | 07-seo-ve-metadata.md, 06-devops-ve-deploy.md | Kod tarafı uygulandı: `NEXT_PUBLIC_SITE_URL`, sitemap/robots/JSON-LD çıktısı, testler (dal `feature/com-primary-and-release-flow`, dev'e PR ile girer); kalan: Cloudflare Redirect Rule'un (`.sh -> .com` 301) canlıya alınması sahipte |
| Dallanma ve sürüm | `feature/* -> dev -> main`, main'e her merge otomatik sürüm üretir (tag `vX.Y.Z` + GitHub Release + `CHANGELOG.md`); ilk otomatik sürüm 0.2.0, 1.0.0 launch'ta sahibinin `workflow_dispatch` ile elle kestiği sürüm | Yüksek | 06-devops-ve-deploy.md | Uygulandı: `release.yml`, `ci.yml`'in `dev`+`main`'de koşması, `scripts/release-version.mjs`, `CHANGELOG.md` taban girdisi (dal `feature/com-primary-and-release-flow`, dev'e PR ile girer) |

### Şimdilik kapsam dışı (YAGNI)

Kanıtlanmış bir ihtiyaç olmadan eklenmeyen, ama route/seam'i açık bırakılan öğeler:

- Cloudflare Turnstile: honeypot + rate limit + uzunluk sınırı yeterli görülüyor, kanıtlanmış spam gelirse eklenir.
- Upstash/Redis rate limit: tek Coolify container'ı çalıştığı sürece in-memory sliding window yeterli.
- Self-hosted SMTP (Stalwart/Postal): deliverability riski tek bir contact formu için orantısız, Resend'de kalınıyor.
- GHCR image + Coolify pull: PR preview'ı native desteklemiyor; gelecekteki yükseltme kapısı olarak kayıtlı, geçilirse git SHA tag zorunlu.
- Nixpacks: 2 GB RAM'li sunucuda OOM riski var ve artık aktif geliştirilmiyor.
- Alt domain (tr.dogancanyildiz.com): Google ayrı site gibi ele alıyor, tek uygulama için gereksiz DNS/TLS yükü.
- HTTP/3'ü Traefik'te ayrıca açmak: Cloudflare proxied mod açık olduğu için HTTP/3 ve Brotli zaten edge'de sağlanıyor, Traefik'te tekrar açmanın getirisi yok.

## İlgili dokümanlar

- [01-mevcut-durum-denetimi.md](./01-mevcut-durum-denetimi.md)
- [02-stack-karari.md](./02-stack-karari.md)
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md)
- [04-i18n.md](./04-i18n.md)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md)
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md)
- [09-guvenlik.md](./09-guvenlik.md)
- [10-yol-haritasi.md](./10-yol-haritasi.md)
- [11-acik-sorular.md](./11-acik-sorular.md)
- [12-kaynaklar.md](./12-kaynaklar.md)

## Kaynaklar

Bu dokümanın metninde doğrudan atıfta bulunulan kaynaklar aşağıda listeleniyor; araştırma sürecinde dayanılan kaynakların tam listesi için bkz. [12-kaynaklar.md](./12-kaynaklar.md).

- https://github.com/vercel/next.js/issues/91653
- https://github.com/vercel/next.js/issues/88844
- https://github.com/coollabsio/coolify/issues/7500
