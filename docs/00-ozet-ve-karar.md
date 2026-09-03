# Özet, Stack ve Kararlar

Durum: Uygulandı, site 2026-09-03'te yayında (v0.5.0) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Bu dosya projenin giriş noktası: ne yapıldı, hangi stack seçildi, kararlar
nerede duruyor ve hangi kararın hangi PR ile geldiği. Konu bazlı ayrıntılar
numaralı diğer dokümanlarda, açık kalan işler
[11-acik-isler.md](./11-acik-isler.md)'de.

## Nereden başlandı

27 Ağustos 2026'da yapılan denetim üç kritik sorun buldu ve modernizasyonun
kapsamını bunlar belirledi:

1. **İçerik yüzde yüz şablon.** Alex Chen persona'sı, altı kurgu proje,
   `alex@example.com` ve `example.com` kök linkleri üretimdeydi.
2. **i18n mimarisi kırık.** Cookie tabanlı locale aynı URL'den iki dil
   sunuyordu; hreflang teknik olarak kurulamıyor, Googlebot cookie
   taşımadığı için Türkçe içerik indekslenemiyordu. Kök layout'taki
   `cookies()` çağrısı 11 rotanın 8'ini dinamik üretime düşürüyordu.
3. **Güvenlik ve deploy hattı yok.** Repo `next@16.1.6`'da donmuştu (Temmuz ve
   Ağustos 2026 yamalarının gerisinde, biri kimlik doğrulamasız RCE);
   Dockerfile, `.dockerignore`, CI workflow ve health endpoint yoktu; contact
   formunun honeypot koruması yalnızca istemcideydi.

Karar: sıfırdan yeniden yazım değil, aynı repo üzerinde fazlı modernizasyon
(incremental-modernize). Silinen şey mimari değil içerik ve i18n plumbing'iydi;
shadcn bileşenleri, Button cva matrisi, token mimarisi ve OG rotası yerinde
kaldı. Denetimin 36 bulgusunun tamamı Faz 0-4 içinde kapandı; bulgu bazlı
kapanış kaydı `git show v0.5.0:docs/01-mevcut-durum-denetimi.md` ile okunur.

## Bugünkü durum

- Site canlıda: `https://www.dogancanyildiz.com`, kanonik host www, apex ona
  yönlenir (Coolify/Traefik, 307).
- Sürüm v0.5.0; depo `dogancanyildiz/dogancanyildiz.com`, public, kod MIT,
  içerik ayrı lisansta (`LICENSE-CONTENT.md`).
- İki dil: Türkçe kökte ve Türkçe yollarda, İngilizce `/en` altında.
- İçerik: altı proje case study'si ve üç yazı, iki dilde; Velite ile
  build-time MDX derlemesi.
- Posta sahibinin Mailcow sunucusundan SMTP ile gidiyor; üçüncü taraf runtime
  bağımlılığı yok.
- Ölçüm merkezi Umami'de (`umami.dravcore.com`), izin beklemeden yükleniyor.
- Açık kalanlar (içerik teslimatları, Uptime Kuma kurulumu, `.sh` kararı,
  canlı doğrulamalar): [11-acik-isler.md](./11-acik-isler.md).

## Ana kararlar

| Kategori | Karar | Detay | Durum |
| --- | --- | --- | --- |
| Stack | Next.js 16.3.3'te kalınır, migrate değil incremental-modernize | bu dosya, "Stack" | Uygulandı (Faz 0, #2) |
| Tasarım / UI | Terminal Editorial yönü, nötr palet + tek yeşil aksan, vendor'lanmış fontlar | [03](./03-tasarim-ui-ux.md) | Uygulandı (Faz 3, #5; marka paketi #45) |
| i18n | `app/[lang]` + next-intl, `localePrefix: "as-needed"`, TR varsayılan, yerelleştirilmiş yollar | [04](./04-i18n.md) | Uygulandı (Faz 2 #4, TR varsayılan #36, yerel yollar #45) |
| İçerik altyapısı ve servisler | Velite + MDX, katmanlı contact savunması, Mailcow SMTP, ince Systems paneli | [05](./05-backend-icerik-ve-servisler.md) | Uygulandı (Faz 4 #6, SMTP #37) |
| DevOps / deploy | Coolify GitHub App + git tabanlı Dockerfile build, Cloudflare proxied, Traefik önde | [06](./06-devops-ve-deploy.md) | Uygulandı (Faz 1 #3, canlı deploy 2026-09-03) |
| SEO / metadata | `generateMetadata` + canonical/hreflang/x-default + JSON-LD + sayfa başına OG kartı | [07](./07-seo-ve-metadata.md) | Uygulandı (Faz 2-4, #4/#6; kartlar #45) |
| İçerik stratejisi | Case study omurgası, düşük hacimli TR-first blog, placeholder yok | [08](./08-icerik-stratejisi.md) | Uygulandı (Faz 4, #6) |
| Güvenlik | Yükseltme + güvenlik başlıkları + CSP + bakım otomasyonu | [09](./09-guvenlik.md) | Uygulandı (Faz 0 #2, Dependabot/CodeQL #14) |
| Ana domain | `dogancanyildiz.com` tek alan adı, kanonik host `www` | [06](./06-devops-ve-deploy.md) | Uygulandı (#7/#8, www #45) |
| Dallanma ve sürüm | `feature/* -> dev -> main`, main'e her merge otomatik sürüm üretir | [06](./06-devops-ve-deploy.md) | Uygulandı (#7/#8) |

## Stack

Beş aday framework (Next.js, Astro, SvelteKit, Nuxt, TanStack Start) ölçüldü;
karar Next.js'te kalmak yönünde ve üç kritere dayanıyor:

1. **i18n mesaj katmanı.** next-intl ICU çoğul kurallarını, locale duyarlı
   tarih/sayı formatlamasını ve tipli mesaj anahtarlarını kutudan veriyor.
   Astro'nun i18n'i kendi dokümanının deyimiyle yalnızca bir routing API'si.
2. **Profil değeri.** Sahibi işte ve CV'de Next.js yazıyor; sitenin
   kanıtlaması gereken iddia zaten framework seçimi değil, Vercel olmadan
   Next.js'i kendi sunucusunda Coolify/Docker/Traefik ile çalıştırmak.
3. **Taşınabilirlik.** shadcn bileşenleri, cva varyant matrisi, token
   mimarisi ve OG rotası Next'te kalınca yerinde kalıyor; Astro'ya geçiş
   sayfa ve layout katmanının tamamını elden geçirmeyi gerektirirdi.

Astro elenmiş bir aday değil, tripwire'a bağlı canlı bir alternatif: bundle
boyutu, content collections ve server islands konularında üstün olduğu kabul
ediliyor. İlk araştırmanın "Astro self-host'ta daha ağır" gerekçesi ölçümle
çürütüldü (Astro SSR runtime 41 MB / 92 MB RSS, Next standalone 61 MB /
117-144 MB RSS) ve karar gerekçesinden çıkarıldı. SvelteKit ve Nuxt profil
çelişkisi nedeniyle, TanStack Start ise statik prerender + i18n + MDX için
kanonik bir yolu olmadığı için elendi. Cookie tabanlı i18n'i korumak
savunulabilir değildi (hreflang kurulamıyor, 8 rota dinamikleşiyor).

Ölçümden çıkan iki kalıcı sonuç: `~70 KB gzip` first-load hedefi ulaşılamaz
(React 19 + App Router tabanı boş sayfada bile 127 KB gzip), gerçekçi hedef
125-130 KB; asıl kazanç prerender'dan geliyor (cookie tabanlı halde 225 KB,
`[lang]` + prerender sonrası 131 KB).

### Sürümler

| Bağımlılık | Sürüm | Not |
| --- | --- | --- |
| next | 16.3.3 | Faz 0'da 16.1.6'dan yükseltildi, iki kritik CVE kapandı |
| react / react-dom | 19.2.8 | |
| tailwindcss | 4.3.x | oklch token mimarisi + `@theme inline` korundu |
| next-intl | 4.14.1 | Faz 2'de 4.13.7 ile kuruldu, Dependabot ile güncellendi |
| velite | 0.4.0 | Exact pin, `^` yok; 0.x API kırılma riskine karşı |
| nodemailer | ^9 | Resend 2026-08-31'de kaldırıldı |
| node | 24 | `.nvmrc` ve `engines.node >=24` |

`motion` (framer-motion) Faz 0-3'te vardı, 2026-08-28'de tamamen kaldırıldı:
JS animasyonu SSR görünürlüğünü hidrasyona bağlıyordu. Sitede artık JS animasyon
kütüphanesi yok.

### Tripwire'lar

- **Astro yeniden değerlendirilir** eğer blog ciddi büyürse (kabaca 40+ yazı),
  contact ve status ayrı bir servise taşınırsa ya da yayından üç ay sonraki
  planlı gözden geçirmede içerik pipeline'ının bakımı yük olmaya başlarsa.
- **next-intl bir tercih, zorunluluk değil.** Bağımlılıksız `[lang]` + elle
  sözlük yolunun tam statik üretimle çalıştığı build edilerek doğrulandı.
  `setRequestLocale` disiplini sistemli şekilde bozulursa veya next-intl bir
  Next major'ında takılırsa o yola dönülür.
- **Velite 0.x.** Exact pin ve lockfile commit'i dışında koruma yok.
- **Turbopack + standalone** (vercel/next.js#88844): `serverExternalPackages`
  trace edilmiyor. Bugün `serverExternalPackages` tanımlı değil; Dockerfile'a
  harici bir native paket eklenirse `next build --webpack` denenmeli.
- **Google Fonts build bağımlılığı** (vercel/next.js#91653): `next/font/google`
  kabul edilmez, yalnızca vendor edilmiş woff2 + `next/font/local`.

## Fazlar

Modernizasyon altı fazda yürüdü (Faz 0-4 yayına kadar, Faz 5 yayın sonrası);
her faz kendi dalında ve tek PR'da bitti. Sıra bağımlılık zinciriydi: güvenlik
ve hijyen hiçbir şeye bağlı değil, deploy hattı sonraki fazların canlıda
doğrulanması için gerekliydi, i18n restructure tasarımdan önce gelmeliydi
(route yapısı değişmeden bileşen taşımak çifte iş), içerik en çok elle emek
isteyen ve sahibinin teslimatına bağlı faz olduğu için sona kaldı.

| Faz | Hedef | PR |
| --- | --- | --- |
| 0. Güvenlik ve hijyen | CVE'leri kapat, üretime hazır Next yapılandırması bırak | #2 |
| 1. Deploy hattı | Dockerfile, CI kapısı, Coolify/Cloudflare/Traefik kurulumu | #3 |
| 2. i18n yeniden mimarisi | İki dil ayrı URL'de, tüm içerik rotaları prerender | #4 |
| 3. Tasarım sistemi | Fontlar yüklensin, palet nötrlensin, mobil menü gelsin | #5 |
| 4. İçerik ve yayın | Şablon persona gitsin, gerçek içerik iki dilde yayına çıksın | #6 |
| 5. Altyapı vitrini ve ölçüm | Systems paneli, ölçüm, bakım otomasyonu | #31 |

Faz başına ne yapıldığı ve tam plan metinlerine erişim:
[plans/README.md](./plans/README.md).

## Karar geçmişi

Zaman içinde yön değiştiren kararlar tek yerde. Gövde metinlerinde bunların
tarihsel halleri artık tekrarlanmıyor.

| Tarih | Karar | Sonuç |
| --- | --- | --- |
| 2026-08-27 | Ana domain `.sh` yerine `.com` | Tüm kod, env ve dokümanlar `.com`'a çevrildi (#7/#8, v0.2.0) |
| 2026-08-27 | Cloudflare DNS-only yerine proxied mod | Domain yönlendirmesi, rate limiting ve `CF-Connecting-IP` kararları buna göre yazıldı |
| 2026-08-28 | Renovate yerine Dependabot + CodeQL | `renovate.json` silindi, haftalık gruplu PR'lar `dev`'e açılıyor (#14) |
| 2026-08-28 | JS animasyon katmanı kaldırıldı | `motion` bağımlılığı, `MotionProvider` ve `.motion-item` silindi; hareket kalırsa CSS ile döner |
| 2026-08-28 | HSTS geçici olarak uygulamada | Traefik middleware'i kurulmadığı için `next.config.ts` gönderiyor; middleware canlı olunca kalkacak |
| 2026-08-30 | Varsayılan dil Türkçe | TR kökte, `/en` altında İngilizce; eski yollar 308 (#36) |
| 2026-08-30 | Gatus yerine Uptime Kuma, merkezi Umami | `infra/` klasörü silindi, Systems paneli üçüncü taraftan veri çekmiyor (#37) |
| 2026-08-31 | Resend yerine Mailcow SMTP | `src/lib/mailer.ts` (nodemailer, 587 STARTTLS); son üçüncü taraf runtime bağımlılığı kalktı (#37) |
| 2026-09-02 | Kanonik host `www` | `NEXT_PUBLIC_SITE_URL`, security.txt ve dokümanlar www'ye sabitlendi (#45) |
| 2026-09-02 | TR yolları tamamen Türkçe, çeviri başına slug | `translationKey` frontmatter alanı, üç 308 tablosu (#45) |
| 2026-09-02 | Depo adı `portfolio` yerine `dogancanyildiz.com` | LICENSE saf MIT'e döndü, içerik ayrımı `LICENSE-CONTENT.md`'ye taşındı (#49) |
| 2026-09-03 | Apex -> www yönlendirmesi Coolify'da | Traefik 307; Cloudflare'daki `apex to www` kuralı isteğe bağlı edge katmanı (#52) |
| 2026-09-03 | İzin bandı kaldırıldı | Umami çerezsiz ve IP saklamadığı için izin beklemeden yükleniyor; `src/components/consent/` silindi (#53) |
| 2026-09-03 | İkinci alan adı alınmayacak | Kapsam dışı; ikinci zone, `sh to com` Redirect Rule ve Traefik yedek regex'i dokümanlardan silindi |

## Kapsam dışı (YAGNI)

Kanıtlanmış bir ihtiyaç olmadan eklenmeyen, ama yolu açık bırakılan öğeler:

- **Cloudflare Turnstile:** honeypot + rate limit + uzunluk sınırı yeterli
  görülüyor. Gerçek spam gelirse ilk adım budur; doğrulama seam'i route'ta
  açık ve Cloudflare zaten bir bağımlılık olduğu için ekleme maliyeti düşük.
- **Upstash/Redis rate limit:** tek Coolify container'ı çalıştığı sürece
  process içi sliding window yeterli.
- **GHCR image + Coolify pull:** PR preview'ını native desteklemiyor. Gelecek
  bir yükseltme kapısı; geçilirse git SHA tag zorunlu, floating `latest`
  kullanılmaz (Coolify rollback'i yalnızca yerel imajları görüyor).
- **Nixpacks:** üreticisi aktif geliştirmediğini ilan etti, halefi hâlâ beta.
- **docker-compose build pack:** Coolify'da zero-downtime rolling update'i
  devre dışı bırakıyor. Repodaki `docker-compose.yml` yalnızca yerel
  doğrulama için.
- **Alt domain (`tr.dogancanyildiz.com`):** Google alt domainleri ayrı site
  gibi ele alıyor, tek uygulama için gereksiz DNS/TLS yükü.
- **Traefik'te HTTP/3 ve Brotli:** Cloudflare proxied modda edge'de zaten var.
- **Üçüncü taraf hata takibi (Sentry vb.):** gözlem yüzeyi Coolify logları ve
  Uptime Kuma probu.

## İlgili dokümanlar

- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md)
- [04-i18n.md](./04-i18n.md)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md)
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md)
- [09-guvenlik.md](./09-guvenlik.md)
- [11-acik-isler.md](./11-acik-isler.md)
- [plans/README.md](./plans/README.md)

## Kaynaklar

- https://nextjs.org/blog/next-16-3
- https://nextjs.org/docs/app/guides/self-hosting
- https://nextjs.org/docs/app/guides/internationalization
- https://astro.build/blog/astro-7/
- https://docs.astro.build/en/guides/internationalization/
- https://github.com/vercel/next.js/issues/88844
- https://github.com/vercel/next.js/issues/91653
- https://github.com/coollabsio/coolify/issues/7500
