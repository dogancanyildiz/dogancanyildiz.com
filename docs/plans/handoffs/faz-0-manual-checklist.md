# Faz 0 manuel kontrol listesi

Bu adımlar kodla yapılamaz; site sahibi uygular. Her madde "yapıldı" olarak işaretlenmeden Faz 1 devam etmemeli. Hiçbiri bu oturumda uygulanmadı.

## 1. Dalı yayınla ve PR aç

- [ ] `git checkout feature/faz-0-guvenlik-ve-hijyen && git log --oneline main..HEAD` ile 12 commit'i (10 task, 1 inceleme düzeltmesi, 1 devir notu) gözden geçir.
- [ ] `git push -u origin feature/faz-0-guvenlik-ve-hijyen`
- [ ] PR: base `main`, head `feature/faz-0-guvenlik-ve-hijyen`, başlık `feat: phase 0, security and hygiene`. Gövde için planın Task 11 Step 4'teki metni kullan (`docs/plans/2026-08-27-faz-0-guvenlik-ve-hijyen.md`, "gh pr create" bloğu); Bilinen sapma bölümüne `vitest.config.mts`, `.prettierignore`'daki `.superpowers` satırı ve boş `RESEND_API_KEY=` notunu ekle.
- [ ] PR diff'inde `.env.local`, `.local/`, `.nodeterm/`, `node_modules`, `.next` OLMADIĞINI doğrula (bu oturumda `git diff --name-only e239564..HEAD` ile doğrulandı, boş).
- [ ] İsteğe bağlı: `npm run start` sonrası `http://localhost:3000/` adresini gerçek tarayıcıda açıp DevTools Console'da "Refused to execute inline script" olmadığını ve tema düğmesinin çalıştığını bir kez daha gör (headless kontrol yapıldı, göz kontrolü yapılmadı).

## 2. Yerel geliştirme ortamı

- [ ] `cp .env.example .env.local` ve `NEXT_PUBLIC_SITE_URL` satırının dolu olduğundan emin ol; `npm run build` bu değişken yokken bilerek patlar.
- [ ] Contact formunu yerelde denemek için `.env.local`'a gerçek `RESEND_API_KEY` yaz (dosya git-ignored, `.gitignore:20:.env.*`). Anahtarı asla `.env.example`'a, commit'e veya Coolify Build katmanına koyma.

## 3. Resend

- [ ] Resend panelinde `dogancanyildiz.sh` domain'ini ekle, verilen DNS kayıtlarını (SPF, DKIM, isteğe bağlı DMARC) Cloudflare DNS'e gir, doğrulamanın "Verified" olduğunu gör.
- [ ] `FROM_EMAIL` için doğrulanmış domain'de bir adres seç (örnek: `contact@dogancanyildiz.sh`). Doğrulama bitmeden üretimde gönderim 500 döner (jenerik mesaj, ayrıntı sunucu logunda).
- [ ] `CONTACT_EMAIL` olarak mesajların düşeceği gerçek kutuyu belirle (docs/11-acik-sorular.md'deki karar).

## 4. Coolify (Faz 1 ile birlikte uygulanır, kararlar şimdi verilmeli)

- [ ] Env değişkenlerini katmanına göre gir: `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh` -> Build (Build Variable işaretli); `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `TRUST_CF_CONNECTING_IP=false` -> Runtime (Build Variable işaretsiz). Ters işaretleme sessizce bozar: Build'e alınan sır image katmanına ve build loguna sızar, Runtime'a alınan `NEXT_PUBLIC_SITE_URL` client bundle'da undefined kalır.
- [ ] Health check yolu: `/api/health`, beklenen durum 200. Dockerfile HEALTHCHECK + Node kombinasyonundaki connection-refused sorununu (coollabsio/coolify#7500) staging'de doğrula.
- [ ] Dockerfile build pack, GitHub App bağlantısı ve PR preview ayarı Faz 1 planında.

## 5. Traefik ve gerçek IP sırası

- [ ] Faz 1'de Traefik entrypoint'ine `forwardedHeaders.trustedIPs` olarak güncel Cloudflare IPv4/IPv6 aralıklarını gir (https://www.cloudflare.com/ips/).
- [ ] Origin'e doğrudan erişimi kapat: sunucu güvenlik duvarı (ufw) veya Traefik `ipAllowList` ile yalnızca Cloudflare IP aralıklarına izin ver (spec: docs/09-guvenlik.md madde 6, docs/06-devops-ve-deploy.md madde e). `trustedIPs` tek başına `CF-Connecting-IP`'yi korumaz.
- [ ] Yukarıdaki iki ayar canlıya çıktıktan ve doğrulandıktan SONRA Coolify'da `TRUST_CF_CONNECTING_IP=true` yap ve yeniden deploy et. Sıra tersine dönerse `CF-Connecting-IP` taklit edilebilir ve rate limit atlatılır.
- [ ] Bayrak açılana kadar `/api/contact` için Cloudflare Rate Limiting kuralının aktif olduğundan emin ol; uygulama içi limit bu dönemde X-Forwarded-For'un son hop'una (Traefik'in eklediği, Cloudflare proxied modda edge adresi) dayanır: sahtelenemez ama kaba.

## 6. Cloudflare

- [ ] `dogancanyildiz.sh` kaydı proxied (turuncu bulut), SSL/TLS modu Full (strict).
- [ ] `dogancanyildiz.com` -> `dogancanyildiz.sh` için tek atlamalı 301 Redirect Rule, path korunarak (sahibinin domain kararı açık soru 5'te kesinleşince).
- [ ] `/api/contact` için Cloudflare Rate Limiting kuralı (dış katman; uygulama içi limit 10 dakikada 5, tek process'e bağlı). Faz 1 planında ayrıntı var.
- [ ] HSTS Traefik'te açılacak (uygulama bilerek göndermiyor); Cloudflare tarafında ayrıca HSTS açılacaksa iki kaynak çakışmasın diye tek yer seçilmeli.

## 7. Renovate (Faz 5 maddesi, kayıt için)

- [ ] GitHub'da Renovate App'i repoya kur; `renovate.json` hazır. Automerge'in anlamlı olması için Faz 1'deki GitHub Actions kapısı (lint, typecheck, test, build) önce kurulmalı.
- [ ] `vulnerabilityAlerts.minimumReleaseAge: null` kararını gözden geçir: güvenlik PR'ları bekletilmeden birleşir, istenirse `"1 day"` yap.

## 8. npm audit kararı

- [ ] `npm audit` 17 transitif bulgu listeliyor (shadcn CLI zinciri: hono, express, body-parser, express-rate-limit; resend -> svix -> uuid). Hiçbiri uygulama çalışma zamanında değil (shadcn dev CLI) veya doğrudan istismar yolu yok (svix webhook doğrulama kütüphanesi, kullanılmıyor). Karar: ayrı bir PR'da `npm audit fix` (force'suz) denenip kapılar koşulacak mı, yoksa `shadcn` major yükseltmesiyle birlikte mi ele alınacak.

## 9. `next dev` tarafından üretilen AGENTS.md ve CLAUDE.md

- [ ] Next 16.3.3 `next dev` her başlangıçta `AGENTS.md` ve `CLAUDE.md` üretiyor (bu oturumda silindi, commit'lenmedi). Üç seçenekten birini seç: (a) dosyaları commit et (içerik Next tarafından yeniden yazılır, uzun çizgi içerir), (b) `.gitignore`'a `AGENTS.md` ve `CLAUDE.md` ekle, (c) `next.config.ts`'e `agentRules: false` ekle. Karar verilmeden `npm run dev` çalıştıran herkesin çalışma ağacı kirlenir.

## 10. Açık kalan tasarım sorusu

- [ ] CSP'de `script-src 'unsafe-inline'` bilinçli; nonce yolu tüm sayfaları dinamik yapıyor. Faz 5'te Umami eklenirken CSP yeniden yazılacak; o noktada nonce/hash kararı verilmeli.
