# infra

Portfolyo uygulamasının yanında, aynı Coolify sunucusunda çalışan yan
servisler. Her klasör bu depoyu gösteren ayrı bir Coolify "Docker Compose"
kaynağıdır; compose dosyası ve yapılandırması sürüm kontrolünde kalır.

| Klasör   | Coolify kaynağı | Genel domain                         |
| -------- | --------------- | ------------------------------------ |
| `gatus/` | gatus           | https://status.dogancanyildiz.com    |
| `umami/` | umami           | https://analytics.dogancanyildiz.com |

Bu klasörler uygulama Docker derleme bağlamından `.dockerignore` ile
çıkarılır; Next.js imajının onlara ihtiyacı yoktur.

Umami kendi veritabanı parolasını ve uygulama sırrını Coolify
`SERVICE_PASSWORD_*` sihirli değişkenleriyle üretir, burada hiçbir sır
commit edilmez. Umami panelinde oluşan website id tasarım gereği
halka açıktır ve uygulamaya Docker build argümanı olarak verilir.

## Gatus panosu: tasarım gereği açık

`status.dogancanyildiz.com`'da giriş yok. Bu bir ihmal değil, bilinçli
seçim: durum sayfası ziyaretçi göremezse işe yaramaz ve `src/lib/status.ts`
siteden çekileni zaten ad, açık/kapalı, 24 saat uptime ve son kontrol
zamanına indirger; hiçbiri hassas değil. `gatus/config/gatus.yaml`'da asla
olmaması gerekenler: iç hostname, konteyner adı, özel IP veya servisin
gerçekten dinlediği port. Endpoint URL'leri yalnızca genel adresler kalır.

## Uyarılar

`gatus/config/gatus.yaml` bir `alerting` bloğu taşır: bir hata ateşlemeden
önce `failure-threshold` kez tekrarlanır, çözülen olay takip mesajı gönderir.
Varsayılan, `GATUS_ALERT_WEBHOOK_URL`'den okunan genel bir webhook'a post
eder (Coolify'da `gatus` kaynağının ortam değişkeni, burada commit yok);
değişken boşsa uyarı tamamen kapanır. Gatus hata vermez, hiçbir şey
göndermez. Discord veya Slack incoming webhook URL'sine yöneltmek başka
kurulum istemez. E-postayı tercih ediyorsan veya farklı sözlü bir webhook
gövdesi istiyorsan aynı dosyada yorumlu `email` bloğunu aç veya aktif
`custom` bloğunu ikinci örnekle değiştir. Aynı anda yalnızca bir `custom`
sağlayıcı aktif olabilir (`alerting:` haritası tek `custom` anahtarı alır),
ikinci örnek ek kanal değil, yerine geçen kopyadır.

Gatus, izlediği sunucunun kendisinde çalışır. Sunucu tamamen düşerse Gatus
da düşer, uyarı gönderemez. Pano ve webhook uyarısı "site ayakta ama hata
dönüyor" türü uygulama içi arızaları kapsar; "host erişilemez"i kapsamaz.
Bunu kapatan tek şey kontrol etmediğin bir altyapıdaki harici izleyici
(örneğin UptimeRobot veya Better Uptime, doğrudan
`https://dogancanyildiz.com`'a), ve onu kurmak sahip işidir — bu depo
yapılandıramaz.

## Umami ilk açılış

Umami yerleşik `admin` / `umami` girişi ile gelir; ilk açılıştan önce bunu
değiştirecek ortam değişkeni yoktur (resmi imaj başlangıçta farklı bir
yönetici parolası tohumlamayı desteklemez). İlk yayın bu yüzden kısa süre
`https://analytics.dogancanyildiz.com`'da o varsayılan parolayla erişilir.
İlk başarılı deploy'dan hemen sonra Settings altında değiştir; domain ile
başka bir şey yapmadan (paylaşmak, bağlamak, ikinci kullanıcı eklemek)
önce. `docs/plans/handoffs/faz-5-manual-checklist.md` şu an domain'i (adım 4) parola değişiminden (adım 5) önce ayağa kaldırıyor; panel erişilir
olur olmaz ilk iş parola, website eklemeden ve linki paylaşmadan önce.
