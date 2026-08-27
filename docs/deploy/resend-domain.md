# Resend domain doğrulaması (el ile checklist)

Amaç: contact formunun gönderdiği postanın spam'e düşmemesi. Alıcı adres `me@dogancanyildiz.com` olarak kesinleşti (`docs/11-acik-sorular.md` soru 5); gönderici adres doğrulanmış bir domain üzerinde olmak zorunda, bu yüzden `contact@dogancanyildiz.sh` kullanılıyor.

## 1. Resend'de domain ekle

- [ ] Resend -> Domains -> "Add Domain" -> `dogancanyildiz.sh`
- [ ] Region: `eu-west-1` (Türkiye'ye en yakın Resend bölgesi). Seçilen bölge MX kaydının hedefini belirler.
- [ ] Resend üç kayıt üretir. Değerler panelden kopyalanır, buraya yazılan `p=...` ve host adları örnektir.

## 2. Cloudflare DNS kayıtları

`dogancanyildiz.sh` zone'una eklenir. Üçü de **DNS only (gri bulut)**; MX ve TXT kayıtları zaten proxy'lenemez.

| Tip | Ad | İçerik | Öncelik |
|---|---|---|---|
| MX | `send` | Resend'in verdiği `feedback-smtp.<region>.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| TXT | `resend._domainkey` | Resend'in verdiği `p=MIGfMA0GCSq...` DKIM değeri | - |

DMARC kaydı Resend tarafından üretilmiyor, elle eklenir:

| Tip | Ad | İçerik |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:me@dogancanyildiz.com; adkim=r; aspf=r` |

- [ ] `p=none` bilinçli bir başlangıç: rapor topla, hiçbir postayı reddetme. Birkaç hafta rapor izlendikten sonra `p=quarantine`'a çıkılabilir.

## 3. Doğrulama

- [ ] Resend panelinde domain durumu `Verified` oluyor (DNS yayılması birkaç dakika sürebilir).
- [ ] Komut satırından:

```bash
dig +short TXT send.dogancanyildiz.sh
dig +short MX send.dogancanyildiz.sh
dig +short TXT resend._domainkey.dogancanyildiz.sh
dig +short TXT _dmarc.dogancanyildiz.sh
```

Beklenen: sırasıyla `"v=spf1 include:amazonses.com ~all"`, `10 feedback-smtp.<region>.amazonses.com.`, `"p=MIGfMA0GCSq..."` ile başlayan DKIM değeri ve `"v=DMARC1; p=none; ..."`.

## 4. Uçtan uca test

Coolify'da `RESEND_API_KEY`, `CONTACT_EMAIL` ve `FROM_EMAIL` Runtime değişkeni olarak set edildikten ve uygulama yeniden deploy edildikten sonra:

```bash
curl -s -X POST https://dogancanyildiz.sh/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Deploy check","email":"me@dogancanyildiz.com","subject":"faz 1 smoke test","message":"Deploy pipeline verification message."}'
```

Beklenen: `{"ok":true}` ve `me@dogancanyildiz.com` kutusuna postanın ulaşması.

- [ ] Gelen postanın kaynağında `dkim=pass` ve `spf=pass` görünüyor (Gmail'de "Show original").

## 5. Sık yapılan hata

- [ ] `dogancanyildiz.com` zone'undaki MX kayıtlarına dokunulmadı. `.com` HTTP tarafında `.sh`'a 301 yönleniyor ama posta akışı bundan tamamen bağımsız; MX silinirse `me@dogancanyildiz.com` adresine posta ulaşmaz.
- [ ] `RESEND_API_KEY` Coolify'da Build Variable olarak işaretlenmedi.
