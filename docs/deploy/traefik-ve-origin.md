# Traefik ayarları ve origin kısıtlaması (el ile checklist)

Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 7 ve 8b/8e, `docs/09-guvenlik.md` bölüm 6. Traefik, Coolify'ın kendi proxy'sidir; entrypoint adları `http` (port 80) ve `https` (port 443).

## 0. Ön koşul: readonly labels kapatılır

- [ ] Coolify -> uygulama -> Advanced -> "Readonly labels" **kapatılır**. Aksi halde elle eklenen middleware etiketleri UI tarafından ezilir.
- [ ] Kapatıldığı anda Custom Labels alanındaki üretilmiş etiketlerin bakımı sahibe geçer. Bu etiketler router `rule`'unu, entrypoint'ini ve TLS ayarını taşıyor: hiçbiri silinmez, yalnızca bölüm 4'teki `middlewares` satırına ekleme yapılır. Alanın kapatmadan önceki halini bir yere kopyalamak, yanlış bir düzenlemeden dönmenin en hızlı yolu.

## 1. Cloudflare IP aralıkları (2026-08-27)

Kurulumdan önce `curl -s https://www.cloudflare.com/ips-v4` ve `curl -s https://www.cloudflare.com/ips-v6` ile tazelenir.

IPv4 (15 blok):

```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

IPv6 (7 blok):

```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

## 2. forwardedHeaders.trustedIPs (Traefik static config)

`trustedIPs` bir entrypoint ayarıdır, yani Traefik'in static config'ine girer. Coolify'da bu dosya `/data/coolify/proxy/docker-compose.yml` içindedir ve panelden Server -> Proxy -> Configuration ekranından düzenlenir.

- [ ] Traefik servisinin `command:` listesine şu iki satır eklenir:

```yaml
      - '--entryPoints.http.forwardedHeaders.trustedIPs=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32'
      - '--entryPoints.https.forwardedHeaders.trustedIPs=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32'
```

- [ ] Proxy yeniden başlatılır (Coolify -> Server -> Proxy -> Restart).
- [ ] Bu ayar olmadan Traefik gerçek ziyaretçi IP'sini Cloudflare edge IP'si sanar; contact formunun IP bazlı rate limit'i aynı edge adresinden gelen ziyaretçileri tek kovada toplar. `CF-Connecting-IP` ise bu ayardan bağımsız olarak, origin Cloudflare dışına açık kaldığı sürece taklit edilebilir bir header olarak kalır, bkz. bölüm 5.

Doğrulama:

```bash
docker inspect coolify-proxy --format '{{range .Config.Cmd}}{{println .}}{{end}}' | grep forwardedHeaders
```

Beklenen: yukarıdaki iki satırın karşılığı çıktıda görünür.

- [ ] **Ancak bu doğrulama geçtikten VE bölüm 5'teki origin kısıtı uygulandıktan sonra**: Coolify -> uygulama -> Environment Variables -> `TRUST_CF_CONNECTING_IP` değeri `false`'tan `true`'ya çevrilir ve uygulama redeploy edilir. Bu, Faz 0'ın `trustsCloudflareHeaders()` kapısını açar ve contact rate limit anahtarı `CF-Connecting-IP`'den türemeye başlar. Sıra ters çevrilirse (`true` önce, `trustedIPs` veya origin kısıtı sonra) herhangi bir peer uydurma bir başlıkla istek başına yeni kova açabilir ve rate limit tamamen atlanabilir hale gelir; `trustedIPs` yalnızca `X-Forwarded-*` ailesini yönetir, `CF-Connecting-IP`'yi korumaz.
- [ ] Doğrulama üç ayrı kanıttan oluşur ve hiçbiri diğerinin yerine geçmez. Cloudflare üzerinden atılan `CF-Connecting-IP` başlıklı bir döngü bu kanıtlardan biri **değildir**: edge, istemcinin gönderdiği başlığı kendi değeriyle ezer, üstelik `docs/deploy/cloudflare-kurulum.md` bölüm 5'teki rate limiting kuralı (10 saniyede 3 istek) dördüncü istekten itibaren zaten `429` döndürür. Böyle bir döngü `trustedIPs` de origin kısıtı da hiç yapılandırılmamışken bile "geçti" verir.

**Kanıt 1, origin kısıtı.** Bölüm 5b'deki `--resolve` testi. Cloudflare'ı baypas ettiği için edge kuralları sonucu etkileyemez; `CF-Connecting-IP`'nin taklit edilemez olduğunun tek dayanağı budur.

**Kanıt 2, gerçek istemci IP'si Traefik'e ulaşıyor.** Proxy access log'una bakılır:

```bash
# Access log kapalıysa Traefik command listesine geçici olarak
# --accesslog=true ve --accesslog.format=json eklenip proxy restart edilir.
docker logs coolify-proxy --tail 20 | grep -o '"ClientHost":"[^"]*"'
curl -s https://api.ipify.org   # karşılaştırma için kendi genel adresiniz
```

Beklenen: `ClientHost` kendi genel adresinizi gösteriyor. `104.x`, `172.6x.x` gibi bir Cloudflare edge adresi görünüyorsa `trustedIPs` uygulanmamıştır.

**Kanıt 3, uygulamanın kendi limiti çalışıyor.** Döngü, edge kuralının altında kalacak hızda koşar (istek başına 6 saniye), böylece dönen `429` Cloudflare'ın değil uygulamanındır. Gövde bilerek geçersiz: rate limit kontrolü gövde doğrulamasından önce çalıştığı için kova tüketilir ama hiç e-posta gönderilmez.

```bash
for i in $(seq 1 6); do
  curl -s -D "/tmp/cl-h.$i" -o "/tmp/cl-b.$i" -w "$i: %{http_code}\n" -X POST \
    -H 'content-type: application/json' -d '{}' \
    https://www.dogancanyildiz.com/api/contact
  sleep 6
done
cat /tmp/cl-b.6; grep -i '^retry-after' /tmp/cl-h.6
```

Beklenen: ilk beş istek `400` (geçersiz gövde, limit tüketildi), altıncı `429`, gövdesi JSON ve yanıtta `retry-after` başlığı var (`src/lib/rate-limit.ts`, limit 5 / 600000 ms). Altıncı yanıt HTML ise o `429` Cloudflare'ın block sayfasıdır, `sleep` süresi artırılıp tekrar denenir. Alternatif: Cloudflare rate limiting kuralı test süresince geçici olarak devre dışı bırakılır.

## 3. Dinamik middleware'ler

`/data/coolify/proxy/dynamic/cloudflare.yaml` dosyası oluşturulur:

```yaml
http:
  middlewares:
    # HSTS. Single source of truth for this header. It is deliberately not
    # set in Cloudflare and not in next.config.ts headers().
    security-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: false

    # gzip, brotli and zstd negotiated through Accept-Encoding
    compress:
      compress: {}

    # Only Cloudflare edge addresses may reach the application routers.
    # No ipStrategy is set on purpose: the match must run against the real
    # TCP peer, not against a forwarded header.
    cloudflare-only:
      ipAllowList:
        sourceRange:
          - 173.245.48.0/20
          - 103.21.244.0/22
          - 103.22.200.0/22
          - 103.31.4.0/22
          - 141.101.64.0/18
          - 108.162.192.0/18
          - 190.93.240.0/20
          - 188.114.96.0/20
          - 197.234.240.0/22
          - 198.41.128.0/17
          - 162.158.0.0/15
          - 104.16.0.0/13
          - 104.24.0.0/14
          - 172.64.0.0/13
          - 131.0.72.0/22
          - 2400:cb00::/32
          - 2606:4700::/32
          - 2803:f800::/32
          - 2405:b500::/32
          - 2405:8100::/32
          - 2a06:98c0::/29
          - 2c0f:f248::/32
```

**Karar (2026-09-03):** ikinci alan adı kapsam dışı bırakıldı ve hiç kaydedilmedi, o yüzden buradaki `redirect-to-com` yedek `redirectRegex` middleware'i kaldırıldı. Kanonik host `www.dogancanyildiz.com`; apex -> www yönlendirmesi Coolify'ın "Redirect to www" ayarıyla origin'de yapılıyor, isteğe bağlı edge katmanı `docs/deploy/cloudflare-kurulum.md` bölüm 3b'de.

- [ ] Dosya kaydedilir, proxy yeniden başlatılır.

## 4. Uygulamaya middleware etiketleri

Coolify router adlarını uygulamanın UUID'sinden üretir: `http-0-<uuid>` (entrypoint 80) ve `https-0-<uuid>` (entrypoint 443); ek domain tanımlanırsa sıra numarası artar ve servis adı eklenir (`https-1-<uuid>-<service>`). `portfolio` adında bir router hiçbir zaman oluşmaz. Kuralı olmayan bir router adına yazılan `middlewares` etiketini Traefik sessizce yok sayar, yani HSTS ve compress hiç uygulanmaz. Kaynak: Coolify "Custom middlewares" dokümanı ve `coollabsio/coolify#9886`.

- [ ] Coolify -> uygulama -> Advanced -> Custom Labels alanını aç. Bölüm 0'da readonly labels kapatıldığı için bu alandaki üretilmiş etiketler artık elle yönetiliyor: **var olan satırlar silinmez**. Alan tek bir middleware satırına indirilirse router `rule`, `entrypoints` ve TLS etiketleri de düşer ve uygulama tamamen erişilemez hale gelir.
- [ ] `<uuid>` uydurulmaz: alandaki mevcut `traefik.http.routers.https-0-<uuid>.rule=Host(...)` satırından kopyalanır.
- [ ] Alandaki `traefik.http.routers.https-0-<uuid>.middlewares=...` satırını bul ve mevcut değeri koruyarak sonuna `,security-headers@file,compress@file` ekle. Böyle bir satır yoksa aynı router adıyla yeni bir satır yaz.
- [ ] Aynı ekleme `http-0-<uuid>` router'ı için de yapılır, yoksa 80'den gelen istekler bu middleware'leri görmez.

```
traefik.http.routers.https-0-<uuid>.middlewares=<mevcut değer>,security-headers@file,compress@file
traefik.http.routers.http-0-<uuid>.middlewares=<mevcut değer>,security-headers@file,compress@file
```

- [ ] `@file` eki dinamik dosyadan gelen middleware'lere referans verir.
- [ ] `buffering` middleware'i **eklenmez**. React'ın streaming SSR yanıtlarını Traefik'in `mem`/`maxResponseBodyBytes` buffering'i geciktirir; ihtiyaç doğarsa staging'de gözlemlenip ayrıca değerlendirilir.
- [ ] HTTP/3 ve Brotli Traefik'te ayrıca açılmaz, Cloudflare proxied modda ikisi de edge'de sağlanıyor.

Doğrulama:

```bash
# Etiketin gerçekten var olan router'a bağlandığını gör
docker inspect "$(docker ps --format '{{.Names}}' | grep -i portfolio | head -1)" \
  --format '{{json .Config.Labels}}' | tr ',' '\n' | grep -i middlewares

curl -sI https://www.dogancanyildiz.com/ | grep -i -E '^(strict-transport-security|content-encoding|x-powered-by)'
curl -sI -H 'accept-encoding: br' https://www.dogancanyildiz.com/ | grep -i '^content-encoding'
```

Beklenen: middlewares etiketi `https-0-<uuid>` ve `http-0-<uuid>` router adlarını taşıyor; `strict-transport-security: max-age=31536000; includeSubDomains` var, `x-powered-by` hiç yok, `content-encoding` `br` veya `zstd`. HSTS başlığı yoksa ilk şüpheli router adıdır: yanlış ada yazılan etiket hata vermez, sessizce hiçbir şey yapmaz.

## 5. Origin'i Cloudflare IP'lerine kısıtlamak

**Durum (2026-09-05): tamamlandı.** Origin kısıtı Hetzner Cloud Firewall ile uygulandı. Bu, sunucudan bağımsız, ağ kenarında (Hetzner'in kendi altyapısında) çalışan bir kısıttır; konteyner içinde iptables kuralı veya `DOCKER-USER` zinciri gerekmiyor, çünkü paket sunucuya hiç ulaşmadan filtreleniyor.

### 5a. Hetzner Cloud Firewall (asıl origin kısıtı)

- [ ] Hetzner Cloud Console -> Firewalls -> `coolify server` (CPX42) -> Edit.
- [ ] Inbound kurallar:
  - TCP 22 (SSH): Sources `0.0.0.0/0`, `::/0` (herkese açık, dokunulmadı).
  - ICMP: Sources `0.0.0.0/0`, `::/0` (herkese açık, dokunulmadı).
  - TCP 80: Sources yalnızca Cloudflare IPv4/IPv6 aralıkları (bölüm 1'deki liste, 15 IPv4 + 7 IPv6 blok).
  - TCP 443: Sources yalnızca Cloudflare IPv4/IPv6 aralıkları (aynı liste).
- [ ] Tanımlı olmayan her port/kaynak kombinasyonu Hetzner Cloud Firewall'ın varsayılan davranışıyla reddedilir, ayrıca bir catch-all DROP kuralı eklemek gerekmiyor.
- [ ] Kaydet. Hetzner Cloud Firewall sunucudan bağımsız çalıştığı için Docker, Traefik veya sunucu yeniden başlatmaya gerek yok; kural anında etkinleşiyor.

Doğrulama, Cloudflare'ı bypass edip origin'e doğrudan bağlanmayı dene:

```bash
# <ORIGIN_IPV4> yerine sunucunun gerçek adresi. Zaman aşımı beklenir.
curl -m 8 --resolve www.dogancanyildiz.com:443:<ORIGIN_IPV4> \
  https://www.dogancanyildiz.com/api/health

# 22 dokunulmadı, açık kalmalı.
nc -z <ORIGIN_IPV4> 22

# Cloudflare üzerinden site normal şekilde 200 dönmeli.
curl -sI https://www.dogancanyildiz.com/ | head -1
```

Beklenen: ilk komut zaman aşımına uğrar (`curl: (28) Connection timed out` veya benzeri), ikinci komut portun açık olduğunu gösterir, üçüncü komut `HTTP/2 200` döner. İlk komut bir JSON gövdesi dönerse kısıt çalışmıyordur; bu tek geçerli kanıttır. Coolify paneli ve Uptime Kuma origin IP'sinin kendisi üzerinden (sunucu içinden veya SSH tüneli ile) erişilebilir kalır, bu doğrulamayı etkilemez.

- [ ] Kural kaydedildikten ve yukarıdaki üç kanıt doğrulandıktan sonra: Coolify -> uygulama -> Environment Variables -> `TRUST_CF_CONNECTING_IP` değeri `true` yapılır ve redeploy edilir (sıra bağlayıcı, bkz. bölüm 2).

### 5b. Bakım: Cloudflare IP aralıkları

Cloudflare aralıkları nadiren değişir ama sabit değildir. Yılda bir:

```bash
curl -s https://www.cloudflare.com/ips-v4
curl -s https://www.cloudflare.com/ips-v6
```

çıktısı bölüm 1'deki listeyle karşılaştırılır. Fark varsa üç yer birden güncellenir: Hetzner Cloud Firewall'daki 80 ve 443 satırlarının Sources alanı, bölüm 2'deki `trustedIPs` ve bölüm 3'teki `cloudflare-only` middleware'i.

### 5c. Alternatif: DOCKER-USER / iptables

Hetzner Cloud Firewall sağlayıcıya özgü bir katman. Başka bir sağlayıcıya taşınırsa veya ek bir savunma katmanı istenirse aynı kısıt `DOCKER-USER` zincirine yazılan iptables kurallarıyla origin üzerinde de uygulanabilir: ufw tek başına yetmez, çünkü Coolify'ın publish ettiği 80/443 Docker'ın DNAT'ıyla FORWARD zincirine giriyor ve ufw INPUT'ta çalıştığı için bu trafiği hiç görmüyor; `DOCKER-USER` zinciri Docker'ın FORWARD kurallarından önce işlediği için publish edilmiş portları filtrelemenin desteklenen yoludur (kaynak: `chaifeng/ufw-docker` ve Docker'ın packet filtering dokümanı). Doğrulama komutu aynıdır (bölüm 5a'daki `curl --resolve`, zaman aşımı beklenir). Bu yol bu sitede kullanılmadı.

### 5d. Traefik ipAllowList (ek katman veya alternatif)

Ağ seviyesinde bir kısıt mümkün değilse (ör. sağlayıcı tarafında yönetilen bir firewall yoksa) bölüm 3'teki `cloudflare-only` middleware'i uygulamanın etiketlerine eklenir. Router adı yine bölüm 4'teki kurala uyar, mevcut satırın değeri korunur:

```
traefik.http.routers.https-0-<uuid>.middlewares=<mevcut değer>,cloudflare-only@file,security-headers@file,compress@file
```

- [ ] Bu yol origin portlarını ağ seviyesinde kapatmaz, yalnızca HTTP katmanında `403` döner. Paket yine de Traefik'e ulaşır. Hetzner Cloud Firewall ile birlikte kullanılabilir, yerine geçmez.
