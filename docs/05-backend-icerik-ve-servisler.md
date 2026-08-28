# Backend, İçerik Pipeline ve Servisler
Durum: Uygulandı: içerik pipeline ve contact (Faz 0, Faz 4), status widget ve Umami kodu (Faz 5, PR #31), contact API 2026-08-28 denetim kapanışında yeniden sertleştirildi; kalan: Gatus ve Umami container'larının Coolify'da açılması · Karar: 2026-08-27 · Güncelleme: 2026-08-28 · Kapsam: dogancanyildiz.com

## Özet

Bu doküman dört bağımsız kararı kapsar: içerik pipeline'ı (proje ve blog verisi), contact formu sertleştirmesi, canlı status widget'ı ve analytics. Ortak tema: mevcut çalışan parçaları (Resend entegrasyonu, statik proje verisi deseni) korumak, eksik olan katmanı (spam koruması, gerçek içerik kaynağı, gerçek canlı veri) en az bağımlılıkla tamamlamak. Hiçbir karar ayrı bir veritabanı veya tam CMS gerektirmiyor; tek Coolify container'ında self-host kısıtı dört kararın tamamına sızıyor (in-memory rate limit, build-time MDX derleme, sunucu tarafı status proxy'si). İçerik pipeline'ı için Velite, contact için katmanlı savunma (Turnstile hariç), status widget için Gatus, analytics için Umami seçildi; gerekçeler ve reddedilen alternatifler aşağıda.

## Karar(lar)

### 1. İçerik pipeline'ı: Velite 0.4.0 (exact pin)

Proje ve blog içeriği git tabanlı MDX dosyalarından, build-time'da Velite ile derlenir. Ayrı bir veritabanı veya admin panel yok.

**Klasör yapısı:**

```
content/
  projects/
    en/<slug>.mdx
    tr/<slug>.mdx
  blog/
    en/<slug>.mdx
    tr/<slug>.mdx
```

**Zod şema alanları (proje):** `title`, `summary`, `role`, `stack[]`, `year`, `links` (repo/live, opsiyonel), `cover` (opsiyonel), `outcome`. Blog için ek olarak `date`, `tags[]`.

Çeviri olmayan içerik için fallback sayfa üretilmez: bir slug'ın TR karşılığı yoksa o slug TR sitemap'ine ve `hreflang` alternates'ine hiç girmez, sadece EN'de görünür (bkz. 04-i18n.md). `src/data/projects.ts` (mevcut şablon proje dizisi) tamamen kaldırılır.

**@next/mdx + Turbopack kısıtı, karar gerekçesi:** Next.js 16.3.3'ün Turbopack derleyicisinde `@next/mdx`'e remark/rehype eklentileri yalnızca string paket adı ve serializable option ile geçirilebiliyor; fonksiyon tipinde plugin Rust tarafına geçemiyor. Bu, `shiki` ile kod bloğu vurgulama, `rehype-slug` + `rehype-autolink-headings` gibi fonksiyon tabanlı özel eklentileri devre dışı bırakıyor. Velite MDX'i kendi Node tabanlı pipeline'ında derlediği için bu kısıttan etkilenmiyor.

**Alternatif tablosu:**

| Seçenek | Sürüm | Şema/tip güvenliği | Turbopack kısıtı | Fit | Not |
|---|---|---|---|---|---|
| **Velite** (seçildi) | 0.4.0 | Zod + otomatik TS tip üretimi | Etkilenmiyor (kendi pipeline'ı) | 9/10 | Contentlayer'ın (2024 sonundan beri commit almıyor) aktif geliştirilen yerine geçeni |
| @next/mdx | 16.3.3 (Next ile birlikte) | Yok, elle yazılır | Etkileniyor (fonksiyon plugin yok) | - | En az bağımlılık ama şema/tip elle, plugin kısıtlı |
| next-mdx-remote | 6.0.0 | Yok, elle yazılır | Etkilenmiyor | 6/10 | İçerik uzak kaynaktan (DB/CMS) gelecekse anlamlı; salt git-MDX için fazladan soyutlama |
| fumadocs-mdx | - | Var | Etkilenmiyor | - | Doküman sitesi odaklı, portfolyo blogu için ölçek fazlası |
| Keystatic | 0.6.9 | Var (git-based CMS) | Etkilenmiyor | 6/10 | Tarayıcıdan görsel MDX editörü; tek yazarlı blog için getirisi sınırlı, ileride yükseltme yolu |
| Payload CMS | 3.88.0 | Var (tam CMS) | Etkilenmiyor | 3/10 | Postgres/Mongo + admin container gerektirir, tek servisli sunucuya orantısız yük |

Velite'ın 0.x sürüm olması API kırılma riski taşıyor; bu risk caret değil **exact pin** (`"velite": "0.4.0"`, `^` yok) ve lockfile commit ile sınırlanıyor.

### 2. Contact formu: Resend + katmanlı sunucu tarafı savunma, Turnstile ertelendi

Mevcut `src/app/api/contact/route.ts` ve `src/lib/resend.ts` korunur, Resend değiştirilmez. Üzerine üç koruma katmanı (honeypot, rate limit, uzunluk sınırı) ve bir hata sızıntısı düzeltmesi eklenir:

1. **Sunucu tarafı honeypot**: `website` alanı şu an yalnızca `contact-form.tsx`'in client kodunda kontrol ediliyor, `route.ts` bu alanı hiç okumuyor. Doğrudan `curl` ile atılan istekte honeypot devre dışı kalıyor; alan artık route handler'da da kontrol edilir.
2. **IP bazlı in-memory sliding window rate limit**: Redis/Upstash gerekmez. Genel web tavsiyesi ("Vercel/multi-region'da in-memory yetmez") bu projede geçerli değil, çünkü Coolify'da tek Docker container/tek Node process çalışıyor; process içi bir `Map` instance'lar arası tutarsızlık yaşamaz. Rate limit'in anahtarı **`CF-Connecting-IP`** header'ından okunan gerçek ziyaretçi IP'si olur; bu header yalnızca istek Cloudflare IP aralıklarından geliyorsa güvenilir olduğundan Traefik'te `forwardedHeaders.trustedIPs` Cloudflare listesiyle set edilmiş olmalı (detay: [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 8b). Bu ayar yoksa tüm istekler Cloudflare'ın kendi IP'sinden geliyormuş gibi görünüp tek bir kovaya düşer, meşru ziyaretçiler birbirine karışır. Cloudflare zaten proxied modda olduğu için `/api/contact` üzerine ayrıca bir **Cloudflare Rate Limiting** kuralı dış katman olarak eklenir; uygulama içi in-memory limit iç katman olarak aynen kalır, iki katman birbirini tamamlar.
3. **Uzunluk sınırları + email regex**: `name<=100`, `email<=200`, `message<=5000` karakter, aşımda `400`; ayrıca `Content-Length` kontrolü ile body boyutu sınırlanır (App Router route handler'larında Next.js kendiliğinden bir sınır uygulamıyor).
4. **Jenerik hata mesajı**: `resend.emails.send()` hatası şu an `error.message` olarak ham haliyle client'a dönüyor (env/domain doğrulama detaylarını sızdırabilir); bundan sonra client'a sabit bir mesaj döner, detay yalnızca `console.error`'a yazılır.

**Env zorunluluğu**: `CONTACT_EMAIL` ve `FROM_EMAIL` prod'da set edilmezse Resend'in paylaşılan test alanına (`onboarding@resend.dev`) sessizce düşüyor; istek `200` dönebilir ama mesaj hiç ulaşmayabilir. Prod build/start aşamasında bu iki değişken zorunlu kılınır, fallback yalnızca development'ta geçerli olur. `FROM_EMAIL` için `dogancanyildiz.com` üzerinde doğrulanmış domain kullanılır. **`CONTACT_EMAIL` (alıcı adresi) `me@dogancanyildiz.com` olarak kesinleşti** (site sahibinin 2026-08-27 cevabı, bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 5); yeni domain'e taşınmıyor.

**Turnstile ertelendi (YAGNI), ama ekleme maliyeti düştü**: Cloudflare Turnstile şimdilik eklenmiyor. Kanıtlanmış bir spam problemi yokken üçüncü taraf bağımlılığı eklemek gerekçesiz; honeypot + rate limit + uzunluk sınırı kişisel bir portfolyo formunda basit botların büyük kısmını eler. Route'ta doğrulama seam'i açık bırakılır: gerçek spam gelirse tek bir `siteverify` çağrısıyla birkaç satırla eklenir. Cloudflare zaten proxied mod ile bir bağımlılık olduğu için (bkz. [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 8) Turnstile'ı sonradan eklemenin maliyeti düştü; "gerçek spam görülürse ilk adım Turnstile" notu bu yüzden güçleniyor.

**Spam koruması seçenek tablosu:**

| Seçenek | Maliyet | Sürtünme | Fit | Not |
|---|---|---|---|---|
| Honeypot + in-memory rate limit (seçildi, şimdi) | Sıfır | Sıfır | 8/10 | Sıfır 3. parti; container restart'ta rate-limit state sıfırlanır, kısa boşluk kabul edilebilir |
| Cloudflare Turnstile (ertelendi, seçilmedi) | Ücretsiz, Standard planda sınırsız | Neredeyse sıfır (managed/invisible) | 9/10 | Gerçek spam kanıtlanınca eklenecek; Cloudflare zaten DNS/proxy katmanında bağımlılık olduğundan ekleme maliyeti düşük |
| hCaptcha | Pro plan 99-139$/ay | Turnstile'dan yüksek | 5/10 | Bu ölçekte Turnstile'a göre marjinal avantajı yok |
| Formspree-benzeri harici servis | Ücretsiz plan ~50 gönderim/ay | - | 2/10 | Zaten çalışan Resend entegrasyonundan geriye gitmek olur |
| Self-hosted SMTP (Stalwart/Postal) | Sunucu bakım yükü | - | 4-5/10 | Yeni VPS IP'sinin deliverability/reputation riski tek contact formu için orantısız |

### 3. Canlı status widget: Gatus

Coolify'da ayrı, küçük bir container olarak Gatus çalıştırılır; YAML ile izlenecek endpoint'ler tanımlanır ve yalnızca public gösterilmesi güvenli olan bir grup dışarı açılır.

**Veri akışı:**
- Next tarafı, Gatus'un `/api/v1/endpoints/statuses` çıktısını **sunucu tarafında** (Server Component veya route handler) çeker; Gatus URL'i ve varsa token client'a hiç gönderilmez.
- **60 saniyelik revalidate** ile cache'lenir; dış servise her sayfa yüklemesinde istek atılmaz.
- **v1 kapsamı kesinleşti (bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 6, 2026-08-27):** widget ilk sürümde **yalnızca portfolyo sitesinin kendisini** gösterir, başka bir servis listelenmez. Gösterilen agregat veri: up/down durumu, 24 saat uptime yüzdesi, son deploy zamanı, commit SHA (build-time env), stack satırı.
- **Topoloji sızdırma yasağı**: hostname, port, iç servis adresi, IP, Coolify UI adresi asla client'a gönderilmez. Güvenlik odaklı bir portfolyoda bu sızıntı özellikle ironik bir hata olur; alan seçimi bilinçli kısıtlanır.
- Ayrıca Coolify'ın kendi sağlık kontrolü için `src/app/api/health/route.ts` eklenir (Gatus'tan bağımsız, uygulamanın kendi liveness endpoint'i).

**İleride eklenebilecekler (sahibi seçerse):** v1 yalnızca portfolyo sitesini gösteriyor olsa da, sahibi ileride genişletmek isterse aşağıdaki adaylar topoloji sızdırmadan, takma adla eklenebilir; hiçbiri bugün için zorunlu değil, seam açık bırakılıyor:

- İzlenen toplam servis sayısı (yalnızca agregat sayı, hangi servisler olduğu belirtilmeden)
- Gatus/status sayfasının kendisine link
- Umami instance'ına link (kurulduktan sonra)
- Cargo Pilot gibi public projelerin uptime'ı
- Son 30 gün uptime trendi (sunucunun genel yükü değil, yalnızca bu trend)
- Deploy sıklığı ("son 30 günde N deploy")
- En son yayınlanan blog yazısının tarihi
- GitHub commit aktivitesi (GitHub'ın public API'si üzerinden)

Bu listedeki hiçbir alan hostname, port, IP veya iç servis adı içermez; yukarıdaki "asla gönderilmeyen" kuralı bu adaylar için de aynen geçerli kalır.

**Uptime Kuma neden değil**: Uptime Kuma'nın badge SVG ve HTML status page çıktısı var ama dokümante edilmiş bir JSON API'si yok (socket tabanlı iç mimari). Özel tasarımlı bir widget için kırılgan bir temel olurdu. Gatus'un JSON API'si dokümante ve stabil; bu tek başına belirleyici.

Coolify API'si (`/v1/servers/{uuid}/resources`) ikincil/tamamlayıcı bir kaynak olarak değerlendirildi ama ana veri kaynağı yapılmadı: API token gerektiriyor ve iç otomasyona ayrılmalı, ziyaretçiye açık bir feed'in doğrudan kaynağı olmamalı.

### 4. Analytics: Umami, Faz 5 (kesin)

Umami, self-hosted, çerezsiz ve gizlilik dostu bir web analytics aracı; Coolify'da ayrı bir container (Node + Postgres) olarak kurulur, script Content-Security-Policy ile uyumlu tanımlanır. **Kurulum kesinleşti** (site sahibinin 2026-08-27 cevabı, bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 11); koşullu "sahibi onaylarsa" ifadesi kalkıyor, Umami Faz 5'in (altyapı vitrini ve ölçüm, yayın sonrası) kesin bir maddesi. Yayın (launch) için zorunlu değil, yalnızca sıralaması Faz 5'e bırakılıyor.

**Plausible/Rybbit neden değil**: Self-host senaryosunda Umami en hafif stack, tek Postgres bağımlılığıyla ~512 MB civarında kalıyor. Plausible CE ve Rybbit ise ClickHouse istiyor, kaynak profili 2-4 GB+ RAM'e çıkıyor; tek servisli, küçük bir Coolify sunucusu için orantısız. `@vercel/analytics` zaten uygun değil çünkü Vercel kullanılmıyor.

**Env değişkenleri listesi:**

| Değişken | Kapsam | Zorunlu | Not |
|---|---|---|---|
| `RESEND_API_KEY` | Runtime | Prod'da evet | .env.example:1-9'da mevcut |
| `CONTACT_EMAIL` | Runtime | Prod'da evet | Fallback yalnızca development |
| `FROM_EMAIL` | Runtime | Prod'da evet | `dogancanyildiz.com` doğrulanmış domain |
| `GATUS_URL` | Runtime | Status widget için evet | Client'a sızmaz, yalnızca sunucu tarafı çeker |
| `NEXT_PUBLIC_SITE_URL` | Build | Evet | Şu an `.env.example`'da yok, eklenecek; `robots.ts`/`sitemap.ts` fallback'i `example.com`'dan kaldırılacak |
| Umami script/site ID | Runtime, Faz 5 | Faz 5'te evet | CSP ile uyumlu script tag'i |

## Gerekçe

Mevcut kod tabanı zaten Resend üzerine kurulu ve çalışıyor (`src/app/api/contact/route.ts:56-61`, `src/lib/resend.ts:3-5`); bunu değiştirmenin somut bir getirisi yok, eksik olan tek şey spam koruması katmanı. Self-hosted SMTP self-host kimliğine hikaye olarak uysa da yeni bir VPS IP'sinin deliverability/reputation riskini tek bir contact formu için üstlenmek orantısız.

Blog tarafında Contentlayer'ın terkedilmiş olması (2024 sonundan beri commit yok) ve Velite'ın onun aktif geliştirilen, Zod şemalı, tip güvenli halefi olması net bir sinyal; proje zaten `src/data/projects.ts`'te statik/derlenmiş veri deseni kullanıyor, Velite bu deseni MDX'e taşımanın en doğal yolu. `@next/mdx` + Turbopack'in fonksiyon plugin kısıtı, Velite'ı tercih etmenin salt "daha uygun" değil teknik olarak gerekli olduğu noktayı oluşturuyor.

Turnstile ertelemesinde YAGNI ilkesi belirleyici: kanıtlanmış bir spam problemi olmadan üçüncü taraf bağımlılığı eklemenin somut bir getirisi yok, seam açık bırakılarak gelecekte tek satırlık bir ekleme olarak bırakılıyor.

Gatus seçimi dokümante JSON API'sine dayanıyor; özel tasarımlı, sunucu tarafında agregatlanan bir widget için bu, Uptime Kuma'nın socket tabanlı iç mimarisine göre belirgin bir avantaj. Umami seçimi ise saf kaynak ayak izi karşılaştırmasına dayanıyor (Postgres-only vs ClickHouse gerektiren alternatifler).

## Reddedilen alternatifler (neden)

- **Self-hosted SMTP (Stalwart/Postal)**: Tam self-host felsefesine daha çok uyar, ancak yeni IP'nin reputation/warm-up süreci ve 7/24 izleme yükü, düşük hacimli tek bir contact formu için orantısız. Postal ayrıca MySQL + RabbitMQ gerektiren daha ağır bir stack.
- **Formspree-benzeri harici form servisi**: Zaten çalışan, daha iyi bir Resend entegrasyonundan geriye gitmek olur; ücretsiz plan ~50 gönderim/ay ile kısıtlı.
- **hCaptcha**: Turnstile'a göre bu ölçekte marjinal avantajı yok; Pro plan (bot-score gerekirse) 99-139$/ay kişisel site için gereksiz.
- **Turnstile'ı şimdi eklemek**: Backend araştırmasının orijinal önerisiydi, ancak kanıtlanmış bir spam problemi yokken üçüncü taraf bağımlılığı eklemek YAGNI'ye aykırı bulundu; sentezde ertelendi.
- **Upstash/Redis rate limit**: Çoklu instance/edge senaryosu bu projede yok (Vercel değil, tek Coolify container'ı); in-memory yeterli.
- **next-mdx-remote**: İçerik uzak bir kaynaktan (DB/CMS) gelecekse anlamlı; salt git tabanlı MDX için Velite daha az kod ve otomatik şema doğrulaması sunuyor.
- **Keystatic**: Tarayıcıdan görsel MDX editörü sunuyor ama tek yazarlı kişisel blog için getirisi sınırlı; ileride "telefondan yazı düzenleme" istenirse yükseltme yolu olarak duruyor.
- **Payload/Directus**: Ayrı veritabanı ve admin container gerektiriyor; 2469 satırlık (.ts + .tsx toplamı), tek yazarlı bir portfolyo/blog için Coolify sunucusuna gereksiz bakım yükü ekler.
- **Uptime Kuma**: Kurulumu kolay, badge endpoint'leri auth istemiyor, ama JSON API'si dokümante değil; özel tasarımlı widget için kırılgan bir temel olurdu.
- **Coolify API'sini doğrudan status kaynağı yapmak**: API token gerektiriyor, iç otomasyona ayrılmalı; ziyaretçiye açık bir feed'in doğrudan kaynağı olmamalı.
- **Statik/mock status verisi**: DevOps kimliğini güçlendirmek yerine zayıflatır; veri gerçek olmak zorunda.
- **Plausible self-hosted / @vercel/analytics**: Plausible CE ClickHouse istiyor, kaynak profili orantısız; `@vercel/analytics` Vercel kullanılmadığı için zaten uygun değil.

## Uygulama durumu (2026-08-27)

**İçerik pipeline'ı (Faz 4, PR #6, dal `feature/faz-4-icerik-ve-yayin`, HEAD `8b4fe40`).** Velite `0.4.0` exact pin uygulandı (`package.json`, `^` yok). `velite.config.ts` iki koleksiyon tanımlıyor: `projects` (pattern `projects/**/*.mdx`) ve `posts` (pattern `blog/**/*.mdx`); `locale` alanı ayrı bir front matter alanı değil, dosya yolundan (`content/projects/en/cargo-pilot.mdx` -> `en`) `localeFromPath` ile türetiliyor. Şema kararda yazılana yakın: proje için `title`, `slug`, `summary`, `role`, `stack[]`, `year`, `links.{live,repo}` (opsiyonel), `cover` (opsiyonel), `outcome`, artı kararda geçmeyen `featured` ve `order`; blog için `title`, `slug`, `date`, `summary`, `tags[]`, `cover` (opsiyonel), `draft`. `rehype-slug` + `rehype-autolink-headings` + `rehype-external-links` + `@shikijs/rehype` (çift tema: `github-light`/`github-dark`) kararda öngörülen fonksiyon tabanlı eklentiler olarak çalışıyor, çünkü Velite kendi Node pipeline'ında derliyor. `npm run build` script'i `velite --clean --strict && next build`; `--strict` şemadan sapan bir MDX'i build'i patlatıyor, ayrı bir `build:content` script'i CI'da içerik derlemesini typecheck/test'ten önce çalıştırıyor (Velite çıktısı gitignore'lu, `#site/content` alias'ı derlenmeden çözülemiyor). `content/projects/{en,tr}/` altında 5 proje (cargo-pilot, ticket-purchasing-system, wikonya, hubit, gpa-calculator; yıllar herkese açık repolarla doğrulandı), `content/blog/` altında 4 yazı (TR: self-hosting-with-coolify, capt-sinavina-hazirlik, ccna-dan-web-guvenligine; EN: yalnızca self-hosting-with-coolify) commit'li. **Kapak görseli sayısı 0**: hiçbir MDX dosyasında `cover` alanı dolu değil; kararda örtük olarak varsayılan "kapaklı yayın" beklentisinden sapma, README'nin "Adding content" bölümü bunu artık kapaksız yayının geçerli bir durum olduğunu açıkça belirtecek şekilde güncellendi (CSS gradient/stok görsel fallback'i yok). `src/data/projects.ts` kararda öngörüldüğü gibi tamamen silindi, erişim `src/lib/content.ts` üzerinden.

**Contact sertleştirmesi (Faz 0, PR #2, ana dala merge).** Dört madde de uygulandı: (1) sunucu tarafı honeypot `contact-validation.ts`'te `website` alanını kontrol ediyor, tetiklenirse `console.warn` + jenerik `400`. (2) IP bazlı in-memory sliding window `src/lib/rate-limit.ts`'te; kararda geçmeyen bir ek koruma var, `maxKeys` (varsayılan 5000) ile **LRU tahliye**: Map dolduğunda önce stale key'ler budanıyor, hâlâ doluysa en son aktif olmayan key atılıyor. IP çözümü kararda tarif edilenden daha temkinli: `src/lib/client-ip.ts` `CF-Connecting-IP`'yi yalnızca `TRUST_CF_CONNECTING_IP=true` iken okuyor (bugün `.env.example`'da `false`, origin Cloudflare'a kilitlenene kadar); `X-Forwarded-For` fallback'i ilk hop'u değil, güvenilen proxy'nin eklediği **son hop'u** alıyor (soldaki hop'lar client tarafından sahtelenebilir). (3) Uzunluk sınırları (`name<=100`, `email<=200`, `message<=5000`) ve email regex `contact-validation.ts`'te; ayrıca kararda geçmeyen bir katman, `src/lib/request-body.ts` **16 KB (`MAX_BODY_BYTES=16384`)** byte sınırlı bir okuyucu: `Content-Length` erken kontrolü (advisory, chunked istekte yok) artı gövde okunurken gerçek sınır, aşımda `413`. (4) Jenerik hata mesajları: `resend.emails.send()` hatası artık client'a sabit bir mesaj olarak dönüyor, detay yalnızca `console.error`'a yazılıyor. **Sapma**: contact formunun konu alanı UI'dan kaldırıldı (`contact-form.tsx`), ama `route.ts`/`contact-validation.ts` `subject` alanını hâlâ **opsiyonel** kabul ediyor (`MAX_SUBJECT_LENGTH=200`, boşsa e-posta konusu `Portfolio contact from ${name}`'e düşüyor): API geriye dönük uyumlu bırakıldı, UI'dan kaldırılması şemayı değiştirmedi.

**Turnstile**: hâlâ ertelenmiş, kod tabanında hiçbir Turnstile referansı yok; kararda tarif edilen seam (validation seam) açık bırakıldı.

**Gatus / Umami**: ikisi de başlamadı (Faz 5). `GATUS_URL` `.env.example`'da runtime env olarak tanımlı ama boş; Gatus container'ı, status widget'ı ve Umami container'ı henüz kurulmadı.

## Uygulama durumu (2026-08-28)

- **Contact API sözleşmesi değişti** (dal `feature/audit-closure`, ayrıntı [09-guvenlik.md](./09-guvenlik.md) "Uygulama durumu (2026-08-28)"): gövde yalnızca `name`, `email`, `message` ve honeypot alanı `extra_field` taşır; `subject` kaldırıldı, `locale` gövdeden çıkıp `X-Locale` başlığına taşındı; bilinmeyen alan 400. Yeni durum kodları 415 (JSON değil), 403 (`Origin` yok veya farklı), 504 (Resend 10 sn içinde cevap vermedi); 400 gövdesi hatalı alanı `field` ile adlandırır. Rate limit çözümlenmiş IP için 5/10 dk, `unknown` için 30/10 dk. Honeypot artık istemcide sessiz başarıya düşmez: istek gönderilir, sunucu 200 döner ama posta gitmez ve loglar. Form `noValidate` ile kendi doğrulamasını site dilinde yapar, `aria-invalid`/`aria-describedby`, kalıcı `aria-live`, `readOnly` kilidi, 429'da `Retry-After` geri sayımı, `autoComplete="name"`/`"email"`, alan `maxLength` değerleri `contact-validation.ts` sabitlerinden gelir. Gizlilik metni Resend'i işleyici, Umami'yi çerezsiz ölçüm olarak belirtir.
- **Health endpoint'i** `{ status, checks: { content, mail }, timestamp }`; Gatus koşulu değişmedi (`[BODY].status == ok`), mail env eksikse `degraded`.
- **Status okuyucusu (`src/lib/status.ts`) sertleşti:** iki Gatus isteği 3 sn `AbortSignal.timeout` ve `Promise.allSettled` ile (uptime isteği düşerse durum yine gelir), her hata host'u maskelenmiş tek satır JSON uyarı olarak ortak `log()` biçiminde loglanır (`GATUS_URL` boşsa `gatus-url-unset` uyarısı); modül `server-only` importu taşır, `timestamp` doğrulanır (geçersizse alan düşer). Systems paneli tek `PageSection` içinde, etiket kontrastı iki temada 4.5:1 (test hesaplıyor), "son yayın" ve "son kontrol" locale'e göre `timeZoneName: "short"` ile biçimlenir. `buildInfo.year` yalnızca `NEXT_PUBLIC_BUILD_DATE`'ten türer; tarih yoksa footer yıl basmaz (istemci tarafı `new Date()` fallback'i kaldırıldı).
- **Gatus/Umami altyapısı:** `infra/gatus/config/gatus.yaml` artık bir `alerting` bloğu taşıyor (`GATUS_ALERT_WEBHOOK_URL` boşsa uyarı gitmez; failure-threshold 3, success-threshold 2, send-on-resolved), dashboard public kalıyor (yalnızca public URL'ler listelenir, kural `infra/README.md`'de). Umami imajı sabit sürüme, Postgres minor tag'e pinli; Dependabot docker ekosistemi `infra/gatus` ve `infra/umami` dizinlerini de tarıyor. Container'lar Coolify'da henüz açılmadı (`docs/plans/handoffs/faz-5-manual-checklist.md`).
- **İçerik şeması genişledi:** posts ve projects için opsiyonel `updated` (isodate), `coverAlt`; projects için `draft` (prod'da filtrelenir); `links.live`/`links.repo` yalnızca `https://`. `ProjectMeta` ve `Screenshot` MDX kısayolları hiçbir içerik kullanmadığı ve planlanmadığı için kaldırıldı; tablo `.table-wrap` ile sarılır.

## Riskler ve tripwire'lar

- **Turnstile bağımlılığı ertelendi ama tamamen yok değil**: Cloudflare zaten DNS/proxy katmanında (bkz. [06-devops-ve-deploy.md](06-devops-ve-deploy.md) bölüm 8) bir bağımlılık olduğundan Turnstile eklemenin ek maliyeti düşük. Eklenirse captcha servisi kesinti yaşarsa contact formu etkilenmesin diye, doğrulama başarısız/timeout olduğunda honeypot+rate-limit'e düşecek şekilde yazılmalı.
- **In-memory rate limit kalıcı değil**: Container her deploy/restart'ta state sıfırlanır; Coolify'da sık deploy yapılan bir dönemde kısa süreli koruma boşluğu oluşabilir. Kabul edilen bir risk, ölçek büyürse Redis'e geçiş tripwire'ı.
- **Velite 0.x sürüm riski**: Contentlayer kadar olgun/yaygın değil; API kırılma riski var. Tripwire: `package.json`'da exact pin (`^` yok) ve `package-lock.json` commit edilmeden Velite sürümü değiştirilmemeli.
- **EN/TR fallback mantığı yanlış kurulursa 404/boş sayfa riski**: MDX şemasında `locale` + `slug` ilişkisi net tanımlanmalı, çevirisi olmayan içerik sitemap/hreflang'a hiç girmemeli (bkz. 04-i18n.md).
- **Gatus ek container = ek bakım yükü**: Coolify sunucusuna yeni bir servis eklemek demek. Alternatifi (yalnızca Coolify API'sine dayanmak) daha az altyapı ister ama Coolify dışı servisleri izleyemez ve daha az esnek; bilinçli bir trade-off olarak Gatus tercih edildi.
- **`CONTACT_EMAIL`/`FROM_EMAIL` prod'da unutulursa sessiz teslim edilmeme**: İstek `200` dönebilir ama mesaj `onboarding@resend.dev`'e düşüp kimseye ulaşmayabilir. Tripwire: prod build/start'ta bu iki değişken eksikse hata fırlatılmalı, sessiz fallback olmamalı.
- **`NEXT_PUBLIC_SITE_URL` eksikse SEO hasarı**: `robots.ts`/`sitemap.ts` şu an `example.com`'a düşüyor; bu değişken Coolify'da Build-time env olarak zorunlu kılınmalı (detay: 06-devops-ve-deploy.md).

## Uygulama notları

- `route.ts`'teki mevcut `validateBody` fonksiyonunun genel yapısı (tip kontrolü + trim) korunur, yalnızca email regex ve uzunluk sınırları eklenir.
- `contact-form.tsx`'teki honeypot alanı (`absolute -left-9999px` ile gizlenmiş input) iyi bir UX pattern; tasarım değişmeden yalnızca sunucu tarafı kontrolü eklenir.
- `src/lib/resend.ts`'teki "apiKey yoksa `resend=null`, route.ts 503 döner" pattern'i doğru bir defensive coding örneği, aynen korunur.
- `sitemap.ts`/`robots.ts`'in `projects.ts`'den slug türetme mantığı doğru; yalnızca veri kaynağı Velite çıktısıyla değiştirilir, türetme mantığı değişmeden çalışır.
- İçerik pipeline'ı, contact sertleştirmesi ve status widget'ının hangi fazda uygulanacağı için bkz. 10-yol-haritasi.md (Faz 4: içerik/Velite, Faz 0: contact sertleştirmesi, Faz 5: Gatus + Umami).

## İlgili dokümanlar

- [02-stack-karari.md](./02-stack-karari.md) - genel stack kararı ve Velite'ın framework seçimiyle ilişkisi
- [04-i18n.md](./04-i18n.md) - EN/TR içerik fallback mantığı, hreflang, sitemap locale ayrımı
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) - Gatus/Umami container'larının Coolify kurulumu, env değişkenlerinin Build/Runtime ayrımı
- [09-guvenlik.md](./09-guvenlik.md) - contact endpoint sertleştirmesinin güvenlik gerekçesi, next.config.ts security header'ları
- [10-yol-haritasi.md](./10-yol-haritasi.md) - bu dokümandaki kararların hangi fazda uygulanacağı
- [11-acik-sorular.md](./11-acik-sorular.md) - status widget'ında hangi servislerin public gösterileceği, contact adresi kararı gibi sahibi onayı bekleyen sorular

## Kaynaklar

- [Resend Pricing in 2026: Every Plan, Price, and Overage Rate Explained](https://flexprice.io/blog/detailed-resend-pricing-guide)
- [Resend Pricing 2026 - Free 3k + Pro from $20/mo](https://www.stackscored.com/pricing/transactional-email/resend/)
- [Cloudflare Turnstile Alternatives 2026 - 8 Options Ranked](https://prosopo.io/blog/top-cloudflare-turnstile-alternatives/)
- [hCaptcha vs. Turnstile - Compare Pricing & Features in 2026](https://www.oopspam.com/compare/hcaptcha-vs-turnstile)
- [ContentLayer has been Abandoned - What are the Alternatives?](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives)
- [Introduction | Velite](https://velite.js.org/guide/introduction)
- [Refactoring ContentLayer to Velite](https://medium.com/@mikevpeeren/refactoring-contentlayer-to-velite-6bb4bfaf2182)
- [Payload CMS v3 vs Keystatic vs Outstatic 2026](https://www.pkgpulse.com/guides/payload-cms-v3-vs-keystatic-vs-outstatic-headless-cms-2026)
- [Payload vs Directus: Headless CMS Compared](https://www.13labs.au/compare/payload-vs-directus)
- [Gatus vs Uptime Kuma](https://openalternative.co/compare/gatus/vs/uptime-kuma)
- [Uptime Kuma vs Gatus | Talos.tools](https://talos.tools/compare/uptime-kuma-vs-gatus)
- [Application API Endpoints | coollabsio/coolify | DeepWiki](https://deepwiki.com/coollabsio/coolify/8.2-application-api-endpoints)
- [Self-Hosted Web Analytics 2026 - Plausible vs Matomo vs Umami vs OpenPanel](https://openpanel.dev/articles/self-hosted-web-analytics)
- [Self-Hosted Analytics: Umami vs Plausible vs Rybbit](https://haloy.dev/blog/self-hosted-analytics-compared)
- [Self-hosted email in 2026: mailcow vs Stalwart vs Mailu](https://profor.pro/blog/self-hosted-email-2026-mailcow-stalwart-mailu/)
- [Rate Limiting Next.js API Routes: In-Memory, Redis, and Plan-Based Limits](https://dev.to/whoffagents/rate-limiting-nextjs-api-routes-in-memory-redis-and-plan-based-limits-5coo)
- [velite on npm](https://www.npmjs.com/package/velite)
- [@keystatic/core on npm](https://www.npmjs.com/package/@keystatic/core)
