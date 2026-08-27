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
    https://dogancanyildiz.sh/api/contact
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

curl -sI https://dogancanyildiz.sh/ | grep -i -E '^(strict-transport-security|content-encoding|x-powered-by)'
curl -sI -H 'accept-encoding: br' https://dogancanyildiz.sh/ | grep -i '^content-encoding'
```

Beklenen: middlewares etiketi `https-0-<uuid>` ve `http-0-<uuid>` router adlarını taşıyor; `strict-transport-security: max-age=31536000; includeSubDomains` var, `x-powered-by` hiç yok, `content-encoding` `br` veya `zstd`. HSTS başlığı yoksa ilk şüpheli router adıdır: yanlış ada yazılan etiket hata vermez, sessizce hiçbir şey yapmaz.

## 5. Origin'i Cloudflare IP'lerine kısıtlamak

Önce kritik gerçek: **ufw tek başına 80 ve 443'ü kapatmaz.** Coolify proxy'si Traefik'i `80:80` ve `443:443` ile publish eder. Docker bu portlar için PREROUTING'de DNAT yapıp paketi FORWARD zincirine sokar, ufw kuralları ise INPUT zincirindedir; ufw bu trafiği hiç görmez. `ufw default deny incoming` + Cloudflare allow kuralları yazılmış olsa bile origin tüm internete açık kalır. Docker tam bu iş için `DOCKER-USER` zincirini boş bırakır. Kaynak: `chaifeng/ufw-docker` ve Docker'ın kendi packet filtering dokümanı.

Bu yüzden kısıt iki parçadır: ufw host servislerini (SSH ve publish edilmemiş portlar) kapatır, `DOCKER-USER` kuralları Docker'ın publish ettiği 80/443'ü kapatır. İkisi de yapılmadan Bitti kriteri 9 sağlanmış sayılmaz ve `TRUST_CF_CONNECTING_IP=true` yapılmaz.

### 5a. ufw (host servisleri)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw --force enable
sudo ufw status numbered
```

- [ ] Buraya 80/443 kuralı yazmak gerekmiyor: o portlar ufw'nin görmediği zincirden geçiyor. Yazılırsa yanlış bir güvenlik hissi yaratır.
- [ ] ufw'nin kapattığı tek şey host üzerinde dinleyen servisler (SSH, sistem daemon'ları) ve publish edilmemiş portlardır.

### 5b. DOCKER-USER (asıl origin kısıtı)

`DOCKER-USER`, Docker'ın FORWARD zincirinde kendi kurallarından **önce** işlettiği zincirdir; publish edilmiş konteyner portlarını filtrelemenin desteklenen yolu budur. Zincirin varsayılan içeriği tek bir `RETURN` kuralıdır, bu yüzden yeni kurallar `-A` ile değil `-I` ile başa eklenir; `-A` ile eklenen kural o `RETURN`'ün altında kalır ve hiç çalışmaz.

```bash
ADMIN_IPV4="$(curl -s https://api.ipify.org)"   # preview erişimi için allowlist

# 1) Önce catch all DROP, zincirin başına
sudo iptables  -I DOCKER-USER 1 -p tcp -m multiport --dports 80,443 -j DROP
sudo ip6tables -I DOCKER-USER 1 -p tcp -m multiport --dports 80,443 -j DROP

# 2) Sonra izinli kaynaklar, yine başa: DROP'un üstünde birikirler
for cidr in $(curl -s https://www.cloudflare.com/ips-v4) "$ADMIN_IPV4"; do
  sudo iptables -I DOCKER-USER 1 -p tcp -m multiport --dports 80,443 -s "$cidr" -j RETURN
done
for cidr in $(curl -s https://www.cloudflare.com/ips-v6); do
  sudo ip6tables -I DOCKER-USER 1 -p tcp -m multiport --dports 80,443 -s "$cidr" -j RETURN
done

sudo iptables -S DOCKER-USER
sudo ip6tables -S DOCKER-USER
```

- [ ] Sıra bağlayıcı: DROP önce eklenir, izinler onun üstüne eklenir. Ters yapılırsa DROP tüm izinlerin üstünde kalır ve Cloudflare dahil her şey kesilir.
- [ ] `ADMIN_IPV4` değeri `curl -s https://api.ipify.org` ile alınır, adres değiştikçe kural güncellenir (eski kural `sudo iptables -D DOCKER-USER ...` ile silinir).
- [ ] Beklenen kural sayısı: `iptables -S DOCKER-USER` -> 15 Cloudflare IPv4 bloğu + admin + DROP; `ip6tables -S DOCKER-USER` -> 7 IPv6 bloğu + DROP.
- [ ] Kalıcılık: `sudo apt install iptables-persistent && sudo netfilter-persistent save`. Docker daemon veya Coolify proxy yeniden başlatıldıktan sonra `iptables -S DOCKER-USER` tekrar kontrol edilir; kurallar düşmüşse `netfilter-persistent reload` ile ya da yukarıdaki bloğu tekrar koşarak geri yüklenir.
- [ ] `chaifeng/ufw-docker` kurulup `ufw-docker allow` kullanmak da aynı işi yapar; hangisi seçilirse seçilsin doğrulama aynıdır.

Doğrulama, Cloudflare'ı bypass edip origin'e doğrudan bağlanmayı dene:

```bash
# ORIGIN_IPV4 yerine sunucunun gerçek adresi. Bu komut allowlist'te olmayan
# bir ağdan (ör. mobil veri) çalıştırılır.
curl -sS --max-time 8 --resolve dogancanyildiz.sh:443:ORIGIN_IPV4 https://dogancanyildiz.sh/api/health
```

Beklenen: `curl: (28) Connection timed out` veya `curl: (7) Failed to connect`. Bir JSON gövdesi dönerse kısıt çalışmıyordur. Bu tek geçerli kanıttır, ufw çıktısındaki kural listesi kanıt değildir. Test Cloudflare'ı baypas ettiği için sonucu edge'deki hiçbir kural etkilemez.

### 5c. Traefik ipAllowList (ek katman veya alternatif)

`DOCKER-USER` kullanılamıyorsa (ör. sağlayıcı tarafında yönetilen bir firewall varsa) bölüm 3'teki `cloudflare-only` middleware'i uygulamanın etiketlerine eklenir. Router adı yine bölüm 4'teki kurala uyar, mevcut satırın değeri korunur:

```
traefik.http.routers.https-0-<uuid>.middlewares=<mevcut değer>,cloudflare-only@file,security-headers@file,compress@file
```

- [ ] Bu yol seçilirse preview router'ına `cloudflare-only` **eklenmez**, aksi halde DNS-only preview'lar hiç açılmaz.
- [ ] Bu yol origin portlarını ağ seviyesinde kapatmaz, yalnızca HTTP katmanında `403` döner. Paket yine de Traefik'e ulaşır. `DOCKER-USER` ile birlikte kullanılabilir, yerine geçmez.

## 6. Preview deployment erişimi

- [ ] `*.preview.dogancanyildiz.sh` Cloudflare'da DNS-only (gri bulut), bkz. `docs/deploy/cloudflare-kurulum.md` bölüm 1.
- [ ] Preview'lar `http` üzerinden servis edilir, TLS yok: gri bulutta Let's Encrypt HTTP-01 doğrulaması origin'e doğrudan ulaşmak zorunda kalır ve bölüm 5b'deki `DOCKER-USER` DROP kuralı bunu keser.
- [ ] Erişim yalnızca bölüm 5b'de allowlist'e alınmış `ADMIN_IPV4` adresinden mümkündür. Bu bilerek seçilmiş bir kısıt: preview'lar herkese açık değildir.
