# Cloudflare kurulumu (el ile checklist)

Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 8, `docs/09-guvenlik.md` bölüm 6. Plan ücretsiz (Free) plan varsayıyor.

## 1. DNS kayıtları

**Karar (2026-09-03):** tek zone var, `dogancanyildiz.com`. İkinci alan adı kapsam dışı bırakıldı, hiç kaydedilmedi; bu dokümanda ikinci bir zone ve ona ait Redirect Rule aranmamalı.

`ORIGIN_IPV4` yerine sunucunun statik IPv4 adresi yazılır.

### Zone: dogancanyildiz.com (ana domain, origin'e işaret eder)

| Tip | Ad | İçerik | Proxy |
|---|---|---|---|
| A | `@` | `ORIGIN_IPV4` | Proxied (turuncu bulut) |
| CNAME | `www` | `dogancanyildiz.com` | Proxied (turuncu bulut) |

- [ ] Posta DNS kayıtları (MX, DKIM, SPF, DMARC) Mailcow kurulumuna aittir ve proxy'lenmez (gri bulut); 2026-08-31 kararıyla Resend kaldırıldı, gönderim `contact@dogancanyildiz.com` üzerinden Mailcow SMTP ile yapılır, bkz. `docs/deploy/mailcow-smtp.md`.
- [ ] **Uyarı:** `me@dogancanyildiz.com` alıcı adresini taşıyan MX kayıtlarına dokunulmaz; A/CNAME kayıtlarının eklenmesi mevcut postayı etkilemez.
- [ ] `dogancanyildiz.com -> www.dogancanyildiz.com` yönlendirmesi (kanonik host www) **2026-09-03'ten beri Coolify'ın dahili "Redirect to www" ayarıyla** yapılıyor (`docs/deploy/coolify-kurulum.md` bölüm 3). Bölüm 3b'deki Redirect Rule isteğe bağlı bir edge katmanı, eklenirse aynı yönde olduğu için çakışmaz.

- [ ] **CAA kaydı** (2026-08-28 denetimi, yoktu): `CAA 0 issue "letsencrypt.org"`, `CAA 0 issue "pki.goog"`, `CAA 0 iodef "mailto:me@dogancanyildiz.com"`. Origin CA'ya geçilirse `letsencrypt.org` satırı kaldırılabilir.
- [ ] Wildcard alt alan kaydı yok ve gerekmiyor: Preview Deployments kapalı (karar 2026-09-03), bkz. `docs/deploy/coolify-kurulum.md` bölüm 5.

## 2. SSL/TLS

- [ ] SSL/TLS -> Overview -> Encryption mode: **Full (strict)**. Flexible seçilirse Cloudflare ile origin arası düz HTTP'ye düşer.
- [ ] SSL/TLS -> Edge Certificates -> "Always Use HTTPS": açık. 2026-08-28 denetimi: `http://` istekler 301 almıyordu, ayar kapalıydı. Doğrulama: `curl -sI http://dogancanyildiz.com/ | grep -i -E '^(HTTP|location)'` -> `301` ve `https://` hedef.
- [ ] SSL/TLS -> Edge Certificates -> "Minimum TLS Version": **1.2** (2026-08-28 denetimi: edge TLS 1.0/1.1 kabul ediyordu). Doğrulama: `curl -sI --tls-max 1.1 https://dogancanyildiz.com/` başarısız olmalı.
- [ ] Origin sertifikası Traefik'in Let's Encrypt HTTP-01 akışıyla kalır. Cloudflare proxied modda `/.well-known/acme-challenge` yolunu geçirir, "Always Use HTTPS" bu yolu engellemez. **Kesinti notu (2026-08-28):** site her HTTPS yolda 526 (Invalid SSL certificate) veriyor ve origin'de port 80 Traefik router'sız 404 dönüyor; Coolify'da uygulamanın çalıştığı ve Custom Labels'taki router satırları doğrulanmalı, kalıcı çözüm olarak Cloudflare Origin CA sertifikası (15 yıl, yalnızca Cloudflare güvenir) değerlendirilmeli.
- [ ] HSTS Cloudflare'da **açılmaz**. Şu an uygulama (`next.config.ts`, production) `max-age=31536000; includeSubDomains` gönderiyor; Traefik'teki `security-headers` middleware'i devreye alınınca uygulama satırı kaldırılır ve tek kaynak Traefik olur, bkz. `docs/deploy/traefik-ve-origin.md`. Yayında olan tüm alt alanların (ör. dev, send, Kuma status sayfası hangi alt alandaysa o) TLS sonlandırdığı doğrulanmalı, `includeSubDomains` hepsini bir yıl https'e kilitler.

## 3b. Redirect Rule: `apex to www` (dogancanyildiz.com zone'u)

**Karar (2026-09-02):** kanonik host `www.dogancanyildiz.com`, apex ona yönlenir.

**Güncelleme (2026-09-03):** yönlendirme fiilen Coolify'ın "Redirect to www" ayarıyla origin'de (Traefik, 307) yapılıyor; bu bölümdeki kural **isteğe bağlı**. Eklenirse apex isteği origin'e hiç düşmeden edge'de 301 ile biter, origin kapalıyken bile çalışır ve Google'a kalıcı sinyal verir; iki katman aynı yönde olduğu için çakışmaz. Ters yön (Coolify'da "Redirect to non-www" + burada apex to www) sonsuz döngü üretir, o kombinasyona asla izin verilmez. Bu kural bölüm 1'deki tek zone'da tanımlanır; bölüm numarası `3b` olarak bırakıldı çünkü bölüm 3 (kapsam dışı ikinci alan adının Redirect Rule'u) 2026-09-03'te silindi ve diğer dokümanlar bu numarayla bu bölüme atıf yapıyor.

Rules -> Redirect Rules -> Create rule.

- [ ] Rule name: `apex to www`
- [ ] Custom filter expression:

```
http.host eq "dogancanyildiz.com"
```

- [ ] Then: URL redirect -> Type: **Dynamic**
- [ ] Expression:

```
concat("https://www.dogancanyildiz.com", http.request.uri)
```

- [ ] Status code: **301**
- [ ] Preserve query string: **kapalı** (`http.request.uri` sorgu dizesini zaten taşıyor; `http.request.uri.path` kullanan bir ifadenin aksine bu anahtar açık bırakılırsa sorgu iki kez eklenir)
- [ ] Coolify'daki Direction "Redirect to www" olarak kalır (aynı yön); "Redirect to non-www" ile birlikte kullanılamaz.

Doğrulama:

```bash
curl -sI 'https://dogancanyildiz.com/hakkimda?utm_source=x' | grep -i -E '^(HTTP|location)'
```

Beklenen:

```
HTTP/2 301
location: https://www.dogancanyildiz.com/hakkimda?utm_source=x
```

Tek atlama şartı burada da geçerli: ikinci bir `301` veya `location` satırı çıkmamalı.

## 4. Cache Rule: `static assets`

Caching -> Cache Rules -> Create rule.

- [ ] Rule name: `static assets`
- [ ] Expression:

```
(starts_with(http.request.uri.path, "/_next/static/")) or (lower(http.request.uri.path.extension) in {"png" "jpg" "jpeg" "webp" "avif" "svg" "ico" "woff2"})
```

- [ ] Cache eligibility: **Eligible for cache**
- [ ] Edge TTL: **Use cache-control header if present, bypass cache if not**
- [ ] Browser TTL: **Respect origin TTL**

Next.js `/_next/static/` altına zaten `cache-control: public, max-age=31536000, immutable` gönderiyor; bu kural o header'ı edge'de de geçerli kılıyor. `/cv/*` ve `/fonts/*` origin'den `max-age=86400` alıyor (dosya adları hash'li olmadığı için immutable değil); istenirse ikinci bir Cache Rule ile edge'de daha uzun tutulabilir, CV yenilenince `/cv/*` purge edilmeli.

## 4b. Managed robots.txt

- [ ] AI Crawl Control veya Security -> Bots altında "Managed robots.txt" **kapalı** (2026-08-28 denetimi: yayınlanan `robots.txt` uygulamanınki değildi, `Sitemap:` ve `Disallow: /api/` satırları yoktu). Uygulamanın `src/app/robots.ts` çıktısı tek kaynak. Doğrulama: `curl -s https://www.dogancanyildiz.com/robots.txt` içinde `Sitemap: https://www.dogancanyildiz.com/sitemap.xml` ve `Disallow: /api/` var (apex üzerinden sorulursa 301 gövdesi döner, uygulamanın çıktısı değil).

Doğrulama (build sonrası gerçek bir asset yolu ile, ikinci istekte `HIT` beklenir):

```bash
ASSET=$(curl -s https://www.dogancanyildiz.com/ | grep -o '/_next/static/[^"]*\.js' | head -1)
curl -sI "https://www.dogancanyildiz.com${ASSET}" | grep -i -E '^(cf-cache-status|cache-control)'
curl -sI "https://www.dogancanyildiz.com${ASSET}" | grep -i '^cf-cache-status'
```

Beklenen: ilk çağrıda `cf-cache-status: MISS` ve `cache-control: public, max-age=31536000, immutable`, ikinci çağrıda `cf-cache-status: HIT`.

## 5. Rate limiting rule: `contact endpoint`

Security -> WAF -> Rate limiting rules -> Create rule.

Ücretsiz planın sert sınırları var ve kural buna göre kuruluyor: en fazla 1 kural, sayma periyodu yalnızca 10 saniye, mitigation timeout yalnızca 10 saniye, ifadede yalnızca `Path` ve `Verified Bot` alanları kullanılabiliyor. HTTP metoduna göre filtreleme ücretsiz planda mümkün değil, bu yüzden ifade yalnızca yola bakar.

- [ ] Rule name: `contact endpoint`
- [ ] Expression:

```
(http.request.uri.path eq "/api/contact")
```

- [ ] Characteristics: `IP`
- [ ] Period: `10 seconds`
- [ ] Requests: `3`
- [ ] Action: `Block`, Duration: `10 seconds`
- [ ] Bu yalnızca dış katman. Uygulama içindeki in-memory sliding window limiti (çözümlenmiş IP için 5 istek / 10 dakika, paylaşılan `unknown` anahtarı için 30 / 10 dakika; 2026-08-28) aynen yerinde kalır, biri diğerinin yerine geçmez. `TRUST_CF_CONNECTING_IP` `false` kaldığı sürece uygulama kovası edge IP başına sayar; origin kilidi tamamlanıp bayrak `true` yapılınca ziyaretçi başına olur.

Doğrulama:

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "$i: %{http_code}\n" -X POST https://www.dogancanyildiz.com/api/contact \
    -H 'content-type: application/json' -d '{}'
done
```

Beklenen: ilk istekler uygulamadan `403` döner (curl `Origin` göndermediği için; `-H 'origin: https://www.dogancanyildiz.com'` eklenirse boş gövde `400` olur). Apex `Origin` başlığı artık işe yaramaz: `src/app/api/contact/route.ts` `Origin`'i `NEXT_PUBLIC_SITE_URL` ile tam eşleştirdiği ve değer www olduğu için `https://dogancanyildiz.com` gönderen istek `403` alır. Altıncı istekte Cloudflare `429` verir.

## 6. Bot Fight Mode

- [ ] Security -> Bots -> "Bot Fight Mode": açık.
- [ ] Bu edge katmanı, uygulama içi honeypot ve rate limit'in yerine geçmez, üstüne eklenir.

## 7. Turnstile: şimdilik eklenmiyor

- [ ] Cloudflare zaten bir bağımlılık olduğu için Turnstile'ın ek maliyeti düşük, ama kanıtlanmış spam görülene kadar eklenmiyor (YAGNI). Gerçek spam gelirse ilk adım budur.

## 8. Cloudflare IP aralıkları

Traefik `forwardedHeaders.trustedIPs` ve origin firewall kuralları bu listeye dayanır. Liste değişebilir, kurulumdan önce tazelenir:

```bash
curl -s https://www.cloudflare.com/ips-v4
curl -s https://www.cloudflare.com/ips-v6
```

2026-08-27 tarihindeki liste `docs/deploy/traefik-ve-origin.md` içinde birebir yazılı.
