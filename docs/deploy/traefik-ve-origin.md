# Traefik ayarları ve origin kısıtlaması (el ile checklist)

Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 7 ve 8b/8e, `docs/09-guvenlik.md` bölüm 6. Traefik, Coolify'ın kendi proxy'sidir; entrypoint adları `http` (port 80) ve `https` (port 443).

## 0. Ön koşul: readonly labels kapatılır

- [ ] Coolify -> uygulama -> Advanced -> "Readonly labels" **kapatılır**. Aksi halde elle eklenen middleware etiketleri UI tarafından ezilir.

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
- [ ] Doğrulama: uydurma bir başlıkla atılan istek limiti atlayamıyor.

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Content-Type: application/json" \
    -H "CF-Connecting-IP: 203.0.113.$i" \
    -d '{"name":"t","email":"t@example.org","message":"rate limit probe"}' \
    https://dogancanyildiz.sh/api/contact
done
```

Beklenen: son satır `429`. Cloudflare edge, istemcinin gönderdiği `CF-Connecting-IP` başlığını kendi değeriyle ezdiği için altı istek de aynı kovaya düşer; `429` görülmüyorsa `trustedIPs` veya origin kısıtlaması eksiktir.

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

    # Backup path only. The live com to sh redirect lives in Cloudflare
    # Redirect Rules. This middleware exists so the redirect survives a
    # temporary switch back to DNS only mode.
    redirect-to-sh:
      redirectRegex:
        regex: "^https://(www\\.)?dogancanyildiz\\.com/(.*)"
        replacement: "https://dogancanyildiz.sh/${2}"
        permanent: true
```

- [ ] Dosya kaydedilir, proxy yeniden başlatılır.
- [ ] `${2}` ikinci yakalama grubudur, `(www\.)?` birinci grubu tüketir. Hedef doğrudan `https://dogancanyildiz.sh/` köküne gider, `/en`'e değil; zincirli yönlendirme yasağı burada da geçerli.

## 4. Uygulamaya middleware etiketleri

Coolify -> uygulama -> Advanced -> Custom Labels:

```
traefik.http.routers.portfolio.middlewares=security-headers@file,compress@file
```

- [ ] `@file` eki dinamik dosyadan gelen middleware'lere referans verir.
- [ ] `buffering` middleware'i **eklenmez**. React'ın streaming SSR yanıtlarını Traefik'in `mem`/`maxResponseBodyBytes` buffering'i geciktirir; ihtiyaç doğarsa staging'de gözlemlenip ayrıca değerlendirilir.
- [ ] HTTP/3 ve Brotli Traefik'te ayrıca açılmaz, Cloudflare proxied modda ikisi de edge'de sağlanıyor.

Doğrulama:

```bash
curl -sI https://dogancanyildiz.sh/ | grep -i -E '^(strict-transport-security|content-encoding|x-powered-by)'
curl -sI -H 'accept-encoding: br' https://dogancanyildiz.sh/ | grep -i '^content-encoding'
```

Beklenen: `strict-transport-security: max-age=31536000; includeSubDomains` var, `x-powered-by` hiç yok, `content-encoding` `br` veya `zstd`.

## 5. Origin'i Cloudflare IP'lerine kısıtlamak

İki yol var, **ufw tercih edilir**: paket seviyesinde çalışır, Traefik'e hiç yük bindirmez ve Traefik yeniden yapılandırılırken bile geçerli kalır.

### 5a. ufw (tercih edilen)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH

# Cloudflare edge addresses on 80 and 443
for cidr in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
  sudo ufw allow from "$cidr" proto tcp to any port 80,443 comment 'cloudflare'
done

# Admin address for preview deployments, which are DNS only and therefore
# never reach the origin through Cloudflare. Replace ADMIN_IPV4 with the
# owner's current public address.
sudo ufw allow from ADMIN_IPV4 proto tcp to any port 80,443 comment 'admin previews'

sudo ufw --force enable
sudo ufw status numbered
```

- [ ] `ADMIN_IPV4` değeri `curl -s https://api.ipify.org` ile alınır ve adres değiştikçe güncellenir.
- [ ] Kural sayısı beklenen: 22 Cloudflare bloğu + OpenSSH + admin = 24 satır.

Doğrulama, Cloudflare'ı bypass edip origin'e doğrudan bağlanmayı dene:

```bash
# ORIGIN_IPV4 yerine sunucunun gerçek adresi. Bu komut allowlist'te olmayan
# bir ağdan (ör. mobil veri) çalıştırılır.
curl -sS --max-time 8 --resolve dogancanyildiz.sh:443:ORIGIN_IPV4 https://dogancanyildiz.sh/api/health
```

Beklenen: `curl: (28) Connection timed out` veya `curl: (7) Failed to connect`. Bir JSON gövdesi dönerse kısıt çalışmıyordur.

### 5b. Traefik ipAllowList (alternatif)

ufw kullanılamıyorsa (ör. sağlayıcı tarafında yönetilen bir firewall varsa) bölüm 3'teki `cloudflare-only` middleware'i uygulamanın etiketlerine eklenir:

```
traefik.http.routers.portfolio.middlewares=cloudflare-only@file,security-headers@file,compress@file
```

- [ ] Bu yol seçilirse preview router'ına `cloudflare-only` **eklenmez**, aksi halde DNS-only preview'lar hiç açılmaz.
- [ ] Bu yol origin portlarını ağ seviyesinde kapatmaz, yalnızca HTTP katmanında `403` döner. ufw ile birlikte kullanılabilir, ufw'nin yerine geçmez.

## 6. Preview deployment erişimi

- [ ] `*.preview.dogancanyildiz.sh` Cloudflare'da DNS-only (gri bulut), bkz. `docs/deploy/cloudflare-kurulum.md` bölüm 1.
- [ ] Preview'lar `http` üzerinden servis edilir, TLS yok: gri bulutta Let's Encrypt HTTP-01 doğrulaması origin'e doğrudan ulaşmak zorunda kalır ve ufw bunu keser.
- [ ] Erişim yalnızca ufw'de allowlist'e alınmış admin IP'sinden mümkündür. Bu bilerek seçilmiş bir kısıt: preview'lar herkese açık değildir.
