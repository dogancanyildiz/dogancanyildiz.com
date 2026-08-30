# Mailcow SMTP (el ile checklist)

Karar (2026-08-31): contact formu Resend yerine sahibinin kendi Mailcow
sunucusundan SMTP ile gönderir. Form yalnızca sahibinin kutusuna teslim ettiği
için bir transactional sağlayıcının teslimat itibarına ihtiyaç yok; DKIM ve
SPF Mailcow tarafında zaten yönetiliyor. `contact@dogancanyildiz.com` Mailcow'da
tanımlı.

## 1. Mailcow tarafı

- [ ] `contact@dogancanyildiz.com` posta kutusu (veya alias + gönderim izni) var.
- [ ] Bu kutu için bir **uygulama parolası** üret (hesap parolası env'e girmez).
- [ ] `dogancanyildiz.com` domain'inin DKIM anahtarı yayında ve SPF kaydı
      Mailcow'u yetkilendiriyor (Mailcow > Configuration > ARC/DKIM keys).
- [ ] DMARC sertleştirmesi (öneri, E-02): raporlar temizken `p=quarantine; pct=10`,
      sonra `p=reject`.

## 2. Ağ

- [ ] Portfolio container'ı Mailcow'un submission portuna (587) erişebiliyor
      (aynı sunucu veya erişilebilir ağ). 587 STARTTLS ile açılır; uygulama
      `requireTLS` kullanır, düz bağlantı reddedilir. 465 kullanılacaksa
      `SMTP_PORT=465` yeterli (implicit TLS).

## 3. Coolify ortam değişkenleri (Runtime only)

| Key | Value |
|---|---|
| `SMTP_HOST` | Mailcow sunucusunun SMTP host adı |
| `SMTP_PORT` | `587` (boş bırakılırsa varsayılan 587) |
| `SMTP_USER` | `contact@dogancanyildiz.com` |
| `SMTP_PASSWORD` | uygulama parolası |
| `CONTACT_EMAIL` | `me@dogancanyildiz.com` |
| `FROM_EMAIL` | `contact@dogancanyildiz.com` |

Beşi de Runtime only; Build işaretlenirse imaj katmanına sızar. Eksik değişken
container açılış logunda hata satırı üretir ve `/api/health` `"degraded"` döner.

## 4. Uçtan uca test

```bash
curl -s -X POST https://dogancanyildiz.com/api/contact \
  -H 'content-type: application/json' \
  -H 'origin: https://dogancanyildiz.com' \
  -H 'x-locale: tr' \
  -d '{"name":"Deploy check","email":"me@dogancanyildiz.com","topic":"other","message":"Mailcow SMTP dogrulama mesaji.","extra_field":""}'
```

Beklenen: `{"ok":true}`, `me@dogancanyildiz.com` kutusuna posta; `Reply-To`
gönderen adres; kaynakta `dkim=pass` ve `spf=pass` (Gmail "Show original").
Zaman aşımı 10 sn: SMTP cevap vermezse ziyaretçi 504 alır; kaybedilen yarış
sonrası tekrar gönderim çift posta üretebilir (idempotency penceresi yok,
alıcı sahibin kendisi olduğu için kabul edildi).

## 5. Sık yapılan hata

- [ ] Apex MX kayıtlarına dokunulmadı; `me@dogancanyildiz.com` alım akışı bu
      kurulumdan bağımsız.
- [ ] `SMTP_PASSWORD` Coolify'da Build Variable olarak işaretlenmedi.
