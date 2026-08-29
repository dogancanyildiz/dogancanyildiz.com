# Resend domain doğrulaması (el ile checklist)

Amaç: contact formunun gönderdiği postanın spam'e düşmemesi. Alıcı adres `me@dogancanyildiz.com` olarak kesinleşti (`docs/11-acik-sorular.md` soru 5); gönderici adres doğrulanmış bir domain üzerinde olmak zorunda, bu yüzden `contact@dogancanyildiz.com` kullanılıyor. **Karar değişikliği (2026-08-27):** ana domain artık dogancanyildiz.com olduğu için doğrulanacak domain de bu; tarihsel kurulum burada `dogancanyildiz.sh` tarif ediyordu, gönderici ve alıcı artık aynı domain'de.

## 1. Resend'de domain ekle

- [ ] Resend -> Domains -> "Add Domain" -> `dogancanyildiz.com`
- [ ] Region: `eu-west-1` (Türkiye'ye en yakın Resend bölgesi). Seçilen bölge MX kaydının hedefini belirler.
- [ ] Resend üç kayıt üretir. Değerler panelden kopyalanır, buraya yazılan `p=...` ve host adları örnektir.

## 2. Cloudflare DNS kayıtları

`dogancanyildiz.com` zone'una eklenir. Üçü de **DNS only (gri bulut)**; MX ve TXT kayıtları zaten proxy'lenemez.

| Tip | Ad | İçerik | Öncelik |
|---|---|---|---|
| MX | `send` | Resend'in verdiği `feedback-smtp.<region>.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| TXT | `resend._domainkey` | Resend'in verdiği `p=MIGfMA0GCSq...` DKIM değeri | - |

DMARC kaydı Resend tarafından üretilmiyor. **Önce mevcut kaydı kontrol et** (2026-08-28 denetimi: `_dmarc.dogancanyildiz.com` zaten `p=none` ile var ve apex SPF yalnızca mevcut posta sağlayıcısını yetkilendiriyor; ikinci bir `_dmarc` TXT eklemek çakışma yaratır ve alıcılar kaydı geçersiz sayar):

```bash
dig +short TXT _dmarc.dogancanyildiz.com
dig +short TXT dogancanyildiz.com
```

- [ ] Kayıt varsa **yeni satır ekleme**, mevcut `_dmarc` değerini düzenle: `rua=` adresi `me@dogancanyildiz.com`, `adkim=r; aspf=r`.
- [ ] Resend'in SPF'i `send` alt alanında durduğu için apex SPF'e dokunma; gönderim zaten `send.dogancanyildiz.com` üzerinden yetkilendirilir (E-02 önerisi ile uyumlu: gönderim alt alanı, apex SPF bozulmaz).
- [ ] DKIM `Verified` olduktan sonra DMARC'ı kademeli sertleştir: önce `p=quarantine; pct=10`, raporlar birkaç hafta temizse `p=reject`. `p=none` yalnızca rapor toplar, alan adına sahteciliği engellemez.

## 3. Doğrulama

- [ ] Resend panelinde domain durumu `Verified` oluyor (DNS yayılması birkaç dakika sürebilir).
- [ ] Komut satırından:

```bash
dig +short TXT send.dogancanyildiz.com
dig +short MX send.dogancanyildiz.com
dig +short TXT resend._domainkey.dogancanyildiz.com
dig +short TXT _dmarc.dogancanyildiz.com
```

Beklenen: sırasıyla `"v=spf1 include:amazonses.com ~all"`, `10 feedback-smtp.<region>.amazonses.com.`, `"p=MIGfMA0GCSq..."` ile başlayan DKIM değeri ve `"v=DMARC1; p=none; ..."`.

## 4. Uçtan uca test

Coolify'da `RESEND_API_KEY`, `CONTACT_EMAIL` ve `FROM_EMAIL` Runtime değişkeni olarak set edildikten ve uygulama yeniden deploy edildikten sonra:

```bash
curl -s -X POST https://dogancanyildiz.com/api/contact \
  -H 'content-type: application/json' \
  -H 'origin: https://dogancanyildiz.com' \
  -H 'x-locale: en' \
  -d '{"name":"Deploy check","email":"me@dogancanyildiz.com","message":"Deploy pipeline verification message.","extra_field":""}'
```

Beklenen: `{"ok":true}`, yanıtta `x-request-id` başlığı ve `me@dogancanyildiz.com` kutusuna postanın ulaşması; postanın `Reply-To` başlığı gönderenin adresi. `origin` başlığı olmadan istek 403, `content-type` JSON değilse 415 alır (2026-08-28 sertleştirmesi); `subject` alanı artık kabul edilmez (400).

- [ ] Gelen postanın kaynağında `dkim=pass` ve `spf=pass` görünüyor (Gmail'de "Show original").

## 5. Sık yapılan hata

- [ ] `dogancanyildiz.com` zone'undaki mevcut MX kaydına (apex, `me@dogancanyildiz.com` alıcı postası) dokunulmadı; Resend'in eklediği `send.` alt alan adındaki MX ile çakışmaz, ikisi farklı host adlarında durur. `.sh` HTTP tarafında `.com`'a 301 yönleniyor ama posta akışı bundan tamamen bağımsız; apex MX silinirse `me@dogancanyildiz.com` adresine posta ulaşmaz.
- [ ] `RESEND_API_KEY` Coolify'da Build Variable olarak işaretlenmedi.
