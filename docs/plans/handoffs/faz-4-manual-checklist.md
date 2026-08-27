# Faz 4 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi veya kontrol oturumu uygular. Bu oturumda: dal push edildi ve PR açıldı, PR merge edilmedi; hiçbir panele dokunulmadı; bu oturuma bağlı bir tarayıcı olmadığı için Lighthouse, hreflang test aracı, Search Console ve contact formunun uçtan uca testi koşulmadı. Faz 4'ün kod tarafı yerelde tamam (`docs/plans/handoffs/faz-4.md`, "Doğrulananlar"); burada kalan iş yayın kararları, panel adımları ve sahibinin teslim etmesi gereken içerik.

Dal: `feature/faz-4-icerik-ve-yayin`, `main` (`ad56a51`) üzerine. Faz 0-3 PR'ları (#2-#5) merge edilmiş olduğu için bu dal yığın taşımıyor; tek PR, tek merge.

## 1. PR ve CI

- [ ] PR'ı gözden geçir: gövdede ne değişti, doğrulama, sapmalar ve açık kalanlar; AI atfı ve uzun çizgi yok.
- [ ] `gh pr checks --watch`: `lint, typecheck, test, build` ve `hadolint and image build` `pass`. `checks` job'ında artık yedi `run` adımı var (`npm run build:content` `npm ci`'dan hemen sonra); logda `Static route check passed: 26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts).` ve `Tests 458 passed` görünmeli.
- [ ] `npm run format` CI'da hâlâ koşmuyor (Faz 2'den beri açık). Bu fazda üç task Prettier'a takıldı ve yerelde düzeltildi; `ci.yml`'e bir satır eklemek sahibinin kararı.
- [ ] Merge kararı: bu PR merge edilince site şablon persona'dan tamamen kurtulur; Faz 2 devir notundaki "JSON-LD gerçek isim, görünen içerik şablon" uyuşmazlığı bununla kapanır.

## 2. Coolify preview ve canlı doğrulama

- [ ] PR preview'ında `/`, `/tr`, `/about`, `/tr/about`, `/projects`, `/tr/projects`, `/blog`, `/tr/blog`, `/contact`, `/tr/contact`, `/feed.xml`, `/tr/feed.xml`, `/sitemap.xml`, `/robots.txt` 200; `/blog/capt-sinavina-hazirlik` ve `/foo/feed.xml` 404; `/favicon.ico` 308 -> `/icon`.
- [ ] Preview'da `NEXT_PUBLIC_SITE_URL` preview adresine ayarlı olmalı; aksi halde canonical, hreflang, sitemap, RSS ve og:image production domain'ini gösterir (Faz 1 checklist'i bölüm 3).
- [ ] Merge sonrası canlıda aynı liste + `/cv/dogancanyildiz-cv.pdf` 200 `application/pdf`.
- [ ] Canlıda `curl -s https://dogancanyildiz.sh/ | grep -ci "alex chen\|example.com"` 0.

## 3. Sahibinin teslim etmesi gereken içerik (kod hazır, veri bekliyor)

- [ ] **Speaking (Konuşmalar) verisi**: `.local/content/portfolio-content.md` bölüm 6'daki satır hâlâ `[Etkinlik adı] - [Konu] - [Tarih] - [Şehir/Yer]` yer tutucusu. `src/content/profile.ts` içindeki `speaking.en` ve `speaking.tr` dizileri boş, About sayfası bloğu render etmiyor. Etkinlik adı, konu ve tarih gelince iki diziye `{ event, topic, date }` eklemek yeterli; `tests/profile.test.ts` köşeli parantezli metni yasaklıyor.
- [ ] **Sertifika doğrulama linkleri**: `src/content/profile.ts` içindeki `certificates.en/tr` kayıtlarında `verifyUrl` alanı tanımsız. Link gelince `verifyUrl: "https://..."` eklenir, About sayfası satırın yanına "Verify" / "Doğrula" linkini otomatik basar (test `https://` ile başlamasını ister).
- [ ] **Proje ekran görüntüleri**: `content/images/` boş, hiçbir projede `cover` yok (`covers=0` bugünkü doğru durum). Görsel gelince `content/images/<slug>-cover.png` konur ve ilgili iki MDX'in frontmatter'ına `cover: ../../images/<slug>-cover.png` yazılır; Velite `public/static/` altına hash'li kopya üretir, kart ve detay sayfası `next/image` ile blur placeholder'lı basar.
- [ ] **Blog yazıları ve case study metinleri**: üç TR yazı, bir EN çeviri ve beş case study (EN+TR) plan metninden yazıldı ve `.local/content/portfolio-content.md` ile kısmen doğrulandı. Sahibi yayından önce hepsini okumalı; özellikle Cargo Pilot "neden böyle kurgulandı", Hubit ve GPA anlatıları ile CAPT/CCNA yazılarındaki birinci şahıs deneyim cümleleri sahibinin gerçek deneyimiyle örtüşmeli.
- [ ] **CV PDF içeriği**: `public/cv/dogancanyildiz-cv.pdf` artık herkese açık ve git tarihçesinde. İçinde telefon numarası veya ev adresi varsa (içerik notu 11 telefonu siteye koymamayı seçmişti) yeni bir sürüm konulmalı; eski sürüm tarihçede kalır.
- [ ] **Wikonya canlı linki**: `https://wikonya.vercel.app` bugün kendini "Konya Genç - Bilgi Evreni" olarak tanıtıyor, sayfada "Wikonya" geçmiyor. Link doğru hedefte mi, proje adı güncellenmeli mi sahibi karar versin.
- [ ] **Ticket projesi repo linki**: `https://github.com/dogancanyildiz/bilet-satin-alma` case study'ye eklendi (repo açıklaması "Yavuzlar Web Project Task"). Sahibi bu repo linkinin yayınlanmasını istemiyorsa `content/projects/{en,tr}/ticket-purchasing-system.mdx` içindeki `links.repo` satırı silinir.
- [ ] **Hubit**: `t0-hubit` reposu fork olduğu için link verilmedi; sahibi ekip reposunu vermek isterse `links.repo` eklenir.

## 4. SEO ve i18n (herkese açık URL ister)

- [ ] `https://dogancanyildiz.sh/sitemap.xml` Search Console'a gönderildi; 24 url (10 statik, 10 proje, 4 yazı) hatasız işlendi.
- [ ] Search Console URL inceleme: yalnız TR olan bir yazı (`/tr/blog/capt-sinavina-hazirlik`) dizinlenebilir; `/blog/capt-sinavina-hazirlik` 404 olarak görünüyor.
- [ ] technicalseo.com hreflang tester ile `/`, `/about`, `/projects`, `/projects/cargo-pilot`, `/blog/self-hosting-with-coolify` (iki dilli) ve `/tr/blog/capt-sinavina-hazirlik` (tek dilli) tarandı; self-referencing ve karşılıklı hreflang hatası yok. Beklenen: iki dilli sayfalarda `en`, `tr`, `x-default`; tek dilli yazıda yalnızca `tr` ve `x-default` (x-default TR'ye işaret eder).
- [ ] Sitemap `x-default` üretmiyor, sayfa `<head>` üretiyor (Faz 2'den beri açık). Karar sahibinin; eklenecekse `src/app/sitemap.ts` `languagesFor` içine `x-default` girmeli ve `tests/seo/sitemap.test.ts` güncellenmeli.
- [ ] `docs/launch-checklist.md` bölüm 3'ün tamamı işaretlendi.

## 5. Performans, erişilebilirlik ve tarayıcı kontrolleri

- [ ] Lighthouse (mobil, production URL): Performance, Accessibility, Best Practices, SEO kaydedildi; SEO 100, Accessibility 95 altına düşmüyor. Bu oturumda koşulmadı.
- [ ] Ekran kontrolleri: `/projects` kart ızgarası (iki sütun md ve üstü), `/projects/cargo-pilot` dört hücreli künye + canlı site butonu, `/tr/projects/ticket-purchasing-system` canlı site yok yalnızca kaynak kod butonu, `/tr/blog` üç satır, `/blog` tek satır, `/tr/blog/self-hosting-with-coolify` başlık autolink'leri link gibi görünmüyor (renk foreground, altı çizili değil), `/about` Konuşmalar bloğu yok, sertifikalarda link yok, Download CV butonu var, `/contact` tek `<h1>`.
- [ ] Dil değiştirici: `/tr/blog/capt-sinavina-hazirlik` sayfasında EN linki `/blog`'a gidiyor (404 değil); `/tr/blog/self-hosting-with-coolify` sayfasında EN linki `/blog/self-hosting-with-coolify`'a gidiyor.
- [ ] Dark modda shiki kod blokları: bugünkü yazılarda kod bloğu yok; ilk kod bloklu yazıda `.dark .prose-content .shiki` kuralının koyu tema renklerini uyguladığı görülmeli.
- [ ] `prefers-reduced-motion: reduce` açıkken kart ve satır animasyonları yok. Faz 3'ün açık maddesi (gizli varyantın SSR HTML'e yazılması) bu fazda değişmedi: JS kapalıyken kartlar ve satırlar `opacity:0` ile gelir. Karar sahibinin (Faz 3 checklist bölüm 4).
- [ ] DevTools Network: Google Fonts isteği yok (yerelde 0).

## 6. Contact ve altyapı

- [ ] Production'da contact formu uçtan uca test: gerçek e-posta `me@dogancanyildiz.com` adresine ulaştı. Form artık konu alanı göndermiyor; e-posta konusu `Portfolio contact from <ad>` olur.
- [ ] Honeypot: `curl -X POST .../api/contact -H 'content-type: application/json' -d '{"name":"a","email":"a@b.co","message":"x","website":"spam","locale":"tr"}'` 400 dönüyor.
- [ ] Cloudflare `.com -> .sh` 301 (Faz 1 checklist, sahibinin domain onayı, `docs/11-acik-sorular.md` soru 5).
- [ ] Coolify sağlık kontrolü yeşil, `/api/health` 200 (yerel imajda `healthy` görüldü).

## 7. Sahibinin kararını bekleyen maddeler

- [ ] `npm run format` CI'a girsin mi (bölüm 1).
- [ ] Sitemap `x-default` (bölüm 4).
- [ ] Reduced-motion SSR gizli varyantı (Faz 3 devri).
- [ ] 404 dokümanı her zaman `<html lang="en">` (Faz 2 devri); `/tr/blog/nope` da İngilizce 404 dokümanı alıyor.
- [ ] Hero ve header tasarımı: hero tek sütun, metrik kartları ve "available for work" rozeti kaldırıldı (kaynakta böyle bir iddia yok); header monogram + görünür isim. Plan Step 5 ismi `sr-only` istiyordu, görünür bırakıldı.
- [ ] Footer'daki büyük "Contact" CTA butonu kaldırıldı (nav'da ve header'da zaten var).
- [ ] Ana sayfa yetkinlik şeridi profildeki `featured` işaretli dört grubu gösteriyor (Frontend, Backend, DevOps ve altyapı, Güvenlik); değiştirmek için `src/content/profile.ts` içindeki `featured` bayrakları.
- [ ] Blog dil politikası TR-first uygulandı: EN blog listesi tek yazı gösteriyor, `blog.empty` metni EN'de yalnızca hiç yazı kalmazsa görünür.
- [ ] Task 15 alt ajanı, 3000 portunda dinleyen ve kendisine ait olmayan bir `next-server` sürecini yanlışlıkla sonlandırdı. Bu oturumun tüm doğrulamaları 3171 ve 3172'de koşuldu. Başka bir oturumun dev sunucusu kapanmış olabilir, yeniden başlatılması gerekir.

## 8. Faz 0-3'ten devralınıp hâlâ açık olanlar

Panel adımlarının hiçbiri (Coolify, Cloudflare, Traefik, Resend, DNS), `TRUST_CF_CONNECTING_IP`, `.com -> .sh` onayı, Renovate GitHub App, `npm audit` kararı, CSP nonce (Faz 5), `MAX_MESSAGE_LENGTH` ile `MAX_BODY_BYTES` ilişkisi, 429/413 metinlerinin İngilizce kalması, next-intl TypeScript augmentation, DOM tabanlı test kurulumu, `--destructive-foreground` ve `.pull-quote` ölü tanımları, Faz 3'ün 14 maddelik görsel kontrol listesi. Bu fazda kapananlar: `/favicon.ico` 404 (308 -> `/icon`), proxy `icon` prefix eşleşmesi (`icon$`), `metadata.ogAlt` şablon değeri, `footer.twitter` ölü anahtarı, header'daki sabit "Portfolio" eyebrow'u, `localesForProject` boş dalı ve `verify:routes`'un eşit sayı iddiası (slug bazlı karşılaştırma), sitemap `lastModified` yazılar için gerçek tarih (statik sayfalar ve projeler hâlâ build zamanı).
