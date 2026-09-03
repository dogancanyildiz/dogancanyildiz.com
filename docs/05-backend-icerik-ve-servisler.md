# Backend, İçerik Pipeline ve Servisler

Durum: Uygulandı (içerik pipeline Faz 4 #6; contact sertleştirmesi Faz 0 #2, denetim kapanışı #34 ve 3. tur #44; Mailcow SMTP #37; `translationKey` içerik modeli #45) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Dört karar: içerik pipeline'ı, contact formu, izleme/status paneli ve ölçüm.
Ortak kısıt tek Coolify container'ı: in-memory rate limit, build-time MDX
derlemesi ve üçüncü taraftan veri çekmeyen bir panel bu kısıttan çıkıyor.
Hiçbiri ayrı veritabanı veya CMS gerektirmiyor.

## 1. İçerik pipeline'ı: Velite

Proje ve blog içeriği git tabanlı MDX dosyalarından build-time'da Velite ile
derleniyor (exact pin `0.4.0`, `^` yok). Klasör düzeni
`content/{projects,blog}/{en,tr}/<slug>.mdx`; `locale` ayrı bir frontmatter
alanı değil, dosya yolundan türetiliyor.

**Neden Velite.** Next.js'in Turbopack derleyicisinde `@next/mdx`'e
remark/rehype eklentileri yalnızca string paket adı ve serializable option ile
geçirilebiliyor; fonksiyon tipinde plugin Rust tarafına geçemiyor. Bu, shiki
ile kod vurgulama ve `rehype-slug`/`rehype-autolink-headings` gibi eklentileri
devre dışı bırakıyordu. Velite MDX'i kendi Node pipeline'ında derlediği için
bu kısıttan etkilenmiyor; Zod şemasından otomatik TS tipi üretiyor ve
Contentlayer'ın (2024 sonundan beri commit almıyor) aktif geliştirilen yerine
geçeni. Elenenler: `@next/mdx` (Turbopack kısıtı), `next-mdx-remote` (içerik
uzak kaynaktan gelecekse anlamlı), Keystatic (tek yazarlı blog için getirisi
sınırlı, ileride yükseltme yolu), Payload/Directus (ayrı veritabanı ve admin
container'ı, tek servisli sunucuya orantısız).

### Şema ve doğrulama

Zorunlu alanlar ve tam liste `velite.config.ts` ile README'nin "İçerik ekleme"
bölümünde. Karar düzeyinde önemli olanlar:

- **`translationKey` (zorunlu):** içeriğin dilden bağımsız kimliği. Dil
  değiştirici, sitemap, hreflang, feed guid ve JSON-LD çeviri eşlemesini bunun
  üzerinden kuruyor, `slug` üzerinden değil; her çeviri kendi dilindeki slug'ı
  taşıyabiliyor.
- **`legacySlugs` (opsiyonel):** dosyanın bu dilde daha önce yayınlandığı
  slug'lar. `src/i18n/legacy-paths.ts`'teki elle yazılmış yönlendirme
  tablosunun neden var olduğunu içeriğin yanında tutuyor ve
  `tests/i18n/legacy-paths.test.ts`'in "geri" invariant'ını besliyor.
- **`prepare` doğrulaması build'i düşürüyor:** `(locale, slug)` ve
  `(locale, translationKey)` çiftleri benzersiz olmalı, `legacySlugs` içindeki
  hiçbir değer aynı koleksiyonun aynı dilindeki yaşayan bir slug ile
  çakışmamalı. `npm run build:content` bu yüzden bir kapı.
- `links.live` / `links.repo` ve sertifika `verifyUrl` yalnızca `https://`
  kabul ediyor, `javascript:` reddediliyor.
- **Fallback yok:** çevirisi olmayan `translationKey` diğer dilin rotalarına,
  sitemap'ine ve hreflang alternatiflerine hiç girmiyor.

Türkçe kelime sayımı Unicode'a geçti: Velite'ın varsayılan metadata'sı
kelimeleri `/[a-zA-Z]+/` ile sayıyordu, yani `"Türkiye"` iki kelime
sayılıyordu ve TR yazılarda okuma süresi yüzde 40-47 şişikti; bu sayı
`BlogPosting` JSON-LD'sinde `wordCount` olarak da yayınlanıyordu. Artık
`\p{L}\p{N}` kelime sınıfı kullanılıyor (265 wpm).

## 2. Contact formu: Mailcow SMTP + katmanlı savunma

**Gönderim.** Sahibinin kendi Mailcow sunucusundan SMTP ile
(`src/lib/mailer.ts`, nodemailer, 587 STARTTLS zorunlu). Resend 2026-08-31'de
kaldırıldı: form yalnızca sahibinin kutusuna teslim ediyor, transactional
sağlayıcının teslimat itibarı burada değer üretmiyor, ve bu son üçüncü taraf
runtime bağımlılığıydı. DKIM/SPF Mailcow'da. Tek kayıp sağlayıcının
idempotency penceresiydi: 504 sonrası tekrar deneme çift posta üretebilir,
alıcı sahibin kendisi olduğu için kabul edildi. Kurulum:
[deploy/mailcow-smtp.md](./deploy/mailcow-smtp.md).

**Savunma katmanları.** Hiçbiri diğerinin yerine geçmiyor:

1. **Sunucu tarafı honeypot.** `extra_field` alanı `undefined`/`null` dışında
   her değerde tuzak sayılıyor (yalnızca string kontrolü `{"extra_field": 1}`
   gibi bir gövdeyi kaçırıyordu). İstek 200 dönüyor, posta gitmiyor, satır
   loglanıyor; istemcide sessiz başarıya düşme yok.
2. **IP bazlı in-memory sliding window.** Redis gerekmiyor, çünkü tek Docker
   container / tek Node process çalışıyor. Çözümlenmiş IP için 5 istek /
   10 dakika, paylaşılan `unknown` anahtarı için 30 / 10 dakika; `maxKeys` ile
   LRU tahliye. Anahtar `CF-Connecting-IP` olacak, ama yalnızca
   `TRUST_CF_CONNECTING_IP=true` iken ve o da origin Cloudflare'a
   kilitlendikten sonra; bugün `X-Forwarded-For`'un son hop'una düşüyor
   (soldaki hop'lar istemci tarafından sahtelenebilir). IP canonical forma
   getiriliyor, aynı IPv6 istemcisi farklı yazımlarla taze kova üretemiyor.
3. **Uzunluk ve taşıma kontrolleri.** `name<=100`, `email<=200`,
   `message<=5000`; `src/lib/request-body.ts` `Content-Length` erken
   kontrolüyle ve gövde okunurken gerçek sınırla byte sayıyor (aşımda 413).
   `Content-Type: application/json` zorunlu (415), `Origin`
   `NEXT_PUBLIC_SITE_URL` ile birebir eşleşmeli (403), bilinmeyen alan 400.
4. **E-posta ve gövde hijyeni.** `name`/`email` CR/LF ve C0 kontrol
   karakterlerinde reddediliyor; e-posta regex'i virgül, noktalı virgül ve açı
   parantezi gibi adres-listesi ayraçlarını da reddediyor, böylece ziyaretçinin
   girdiği değer `Reply-To`'ya iki adres olarak giremiyor (uluslararası
   adresler hâlâ kabul).

**Sözleşme.** Gövde `name`, `email`, `topic`, `message` ve honeypot alanını
taşıyor; `topic` zorunlu ve kapalı küme (web/devops/security/other), postaya
sabit İngilizce etiket olarak giriyor ve konu satırını türetiyor. `subject`
alanı kaldırıldı. Yanıtlarda `X-Request-Id`, `X-RateLimit-Limit`,
`X-RateLimit-Remaining`; 429'da `Retry-After`; SMTP çağrısı 10 saniye zaman
aşımı (504). 400 gövdesi hatalı alanı `field` ile adlandırıyor. Loglar satır
başına tek JSON nesnesi (`src/lib/log.ts`); mesaj gövdesi ve ziyaretçi adresi
hiçbir satıra girmiyor, sağlayıcı hatası yalnızca kod adıyla loglanıyor
(`describeError` nodemailer'ın `code` alanını da yazıyor, yoksa `EAUTH`,
`ECONNECTION` ve `ETLS` ayrımı kayboluyordu).

**Turnstile ertelendi (YAGNI).** Kanıtlanmış spam problemi yokken üçüncü taraf
bağımlılığı eklenmiyor; doğrulama seam'i route'ta açık. hCaptcha bu ölçekte
marjinal avantaj sunmuyor, Formspree tarzı harici form servisi çalışan bir
kurulumdan geriye gitmek olurdu.

## 3. Systems paneli ve izleme

**Karar (2026-08-30):** Gatus kaldırıldı, gerçek izleme Coolify'daki Uptime
Kuma'ya taşındı. Kuma'nın JSON iç yapısı dokümante olmadığı için Systems paneli
üçüncü taraftan veri **çekmiyor**: yalnızca build sabitlerini gösteriyor (son
yayın tarihi, commit SHA, stack satırı) ve `NEXT_PUBLIC_STATUS_URL` doluysa
public status sayfasına link veriyor (yalnızca https, boşsa satır gizli). Ana
sayfa bu sayede tamamen statik, revalidate yok.

**Sızıntı kuralı (değişmedi).** Panel ve public status sayfası hiçbir zaman
hostname, port, iç servis adresi, IP veya Coolify UI adresi göstermez.
Güvenlik odaklı bir portfolyoda kendi altyapı haritasını sızdırmak iddianın
tersini kanıtlar; alan seçimi bilinçli kısıtlı.

`/api/health` Coolify'ın kendi sağlık kontrolü için ayrı duruyor:
`{ status, checks: { content, mail }, timestamp }`, mail env'i eksikse
`degraded`, HTTP her durumda 200 (Docker HEALTHCHECK eksik posta değişkeni
yüzünden container'ı yeniden başlatmasın). Uptime Kuma keyword monitörü gövdedeki
`"status":"ok"` metnine bakar.

## 4. Ölçüm: merkezi Umami

Umami self-hosted, çerezsiz ve gizlilik dostu. **Karar (2026-08-30):** repo
içinde container tutmak yerine sahibinin merkezi kurulumu kullanılıyor
(`umami.dravcore.com`, kendi sunucusu); bu site orada bir website kaydı.
Koddaki tek iz izinli origin (`src/lib/analytics.ts` `UMAMI_ORIGIN`) ve CSP.
`data-domains="www.dogancanyildiz.com"` aynı Umami'deki diğer sitelerin veya
preview kopyalarının bu kayda veri yazmasını engelliyor.

**Karar değişikliği (2026-09-03):** tracker izin beklemiyor, çünkü çerez yok ve
IP saklanmıyor; izin bandı kaldırıldı (bkz.
[03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md)). Özel olaylar
`src/lib/analytics-events.ts` içinde tek listede.

Plausible CE ve Rybbit ClickHouse istiyor, kaynak profili 2-4 GB+ RAM'e
çıkıyor; tek servisli küçük bir sunucu için orantısız. `@vercel/analytics`
Vercel kullanılmadığı için zaten uygun değil.

## Riskler ve tripwire'lar

- **In-memory rate limit kalıcı değil:** her deploy/restart'ta state sıfırlanır.
  Kabul edilen risk; ölçek büyürse Redis'e geçiş tripwire'ı.
- **Velite 0.x:** exact pin ve lockfile commit'i dışında koruma yok. Sürüm
  değişikliği lockfile commit edilmeden yapılmamalı.
- **MDX güven sınırı:** `content/` altındaki MDX gövdeleri sanitize edilmiyor,
  yani `content/` dizinine yazma yetkisi build sunucusunda kod çalıştırma
  yetkisidir. Depo public olduğu için dışarıdan gelen bir içerik PR'ı merge
  edilmeden önce MDX ifadeleri (JSX, `export`, `import`) elle okunmalı.
- **Posta env'leri eksikse sessiz teslim edilmeme riski:** `CONTACT_EMAIL` ve
  `FROM_EMAIL` prod'da zorunlu, `src/instrumentation.ts` açılışta eksikliği
  JSON hata satırıyla bildiriyor ve `/api/health` `degraded` dönüyor.
- **Aynı sunucu körlüğü:** Uptime Kuma izlediği sunucuda çalışıyor, sunucu
  tümden düşerse uyarı gönderemez. Kontrol dışı bir yerden ikinci bir prob
  öneriliyor.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [04-i18n.md](./04-i18n.md) - `translationKey`, fallback yok politikası
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) - env katmanları, Coolify
- [09-guvenlik.md](./09-guvenlik.md) - contact sertleştirmesinin güvenlik gerekçesi
- [deploy/mailcow-smtp.md](./deploy/mailcow-smtp.md), [runbooks/infrastructure.md](./runbooks/infrastructure.md)

## Kaynaklar

- https://velite.js.org/guide/introduction
- https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives
- https://profor.pro/blog/self-hosted-email-2026-mailcow-stalwart-mailu/
- https://dev.to/whoffagents/rate-limiting-nextjs-api-routes-in-memory-redis-and-plan-based-limits-5coo
- https://haloy.dev/blog/self-hosted-analytics-compared
- https://openalternative.co/compare/gatus/vs/uptime-kuma
