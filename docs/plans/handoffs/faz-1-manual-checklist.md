# Faz 1 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi uygular. Bu oturumda hiçbiri uygulanmadı: dal push edilmedi, PR açılmadı, hiçbir panele (Coolify, Cloudflare, Traefik, Resend, GitHub) dokunulmadı. Sıra bağlayıcıdır: PR ve CI, Coolify, Cloudflare, Traefik ve origin kısıtı, Resend, canlı doğrulama, en son `.com` yönlendirmesi.

Dal: `feature/faz-1-deploy-hatti`, `feature/faz-0-guvenlik-ve-hijyen` (bc42737) üzerine stacked. Faz 0 PR'ı (#2) henüz merge edilmediği için Faz 1 PR'ı ya Faz 0 merge edildikten sonra `main`'e açılır ya da base olarak Faz 0 dalı seçilir. Faz 0 squash merge edilirse Faz 1 dalı `git rebase --onto main bc42737 feature/faz-1-deploy-hatti` ile taşınır.

## 1. Dalı yayınla ve PR aç (plan Task 11 Step 3)

- [ ] `git log --oneline bc42737..feature/faz-1-deploy-hatti` ile 11 commit'i gözden geçir (Task 2-11 ve devir notu).
- [ ] `git push -u origin feature/faz-1-deploy-hatti`
- [ ] Faz 0 merge edildikten sonra: `gh pr create --base main --head feature/faz-1-deploy-hatti --title "Faz 1: deploy pipeline (Docker, Coolify, Cloudflare, Traefik)"`; gövde için planın Task 11 Step 3 metni. Gövdeye `docs/plans/handoffs/faz-1.md` içindeki "Plandan sapmalar" ve "Açık kalanlar" bölümlerine bir atıf ekle.
- [ ] PR diff'inde `.env.local`, `.local/`, `.nodeterm/`, `.superpowers/`, `node_modules/`, `.next/` OLMADIĞINI doğrula: `git diff --name-only bc42737..HEAD | grep -E '^(\.env\.local|\.local/|\.nodeterm/|\.superpowers/|node_modules/|\.next/)'` boş dönmeli.

## 2. CI kapısı (Task 11 Step 4, Bitti kriteri 5)

- [ ] `gh pr checks --watch`: `lint, typecheck, test, build` ve `hadolint and image build` check'leri `pass`. Bu iki ad `.github/workflows/ci.yml` içindeki `checks` ve `docker` job'larının görünen adlarıdır.
- [ ] Merge sonrası: `gh run list --workflow=ci.yml --limit 1 --json conclusion,headBranch --jq '.[0]'` -> `{"conclusion":"success","headBranch":"main"}`
- [ ] GitHub -> Settings -> Branches -> `main` için "Require status checks to pass": iki check işaretlenir (`docs/deploy/coolify-kurulum.md` bölüm 9).

## 3. Coolify (`docs/deploy/coolify-kurulum.md`)

- [ ] Bölüm 1-3: GitHub App kaynağı (Pull requests izni `Read and write` şart, aksi halde Preview Deployments çalışmaz), uygulama (Build Pack **Dockerfile**, Ports Exposes `3000`, Ports Mappings **boş**), domain `https://dogancanyildiz.sh`.
- [ ] Bölüm 4, env katmanları: `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh` **Build Variable**; `RESEND_API_KEY`, `CONTACT_EMAIL=me@dogancanyildiz.com`, `FROM_EMAIL=contact@dogancanyildiz.sh`, `TRUST_CF_CONNECTING_IP=false`, `GATUS_URL` (boş, Faz 5) **Runtime only**. Dockerfile'daki `ARG NEXT_PUBLIC_SITE_URL` varsayılansızdır (commit `fc470e0`): Build Variable set edilmezse `next build`, `resolveSiteUrl` içinde hata verip durur, sessizce yanlış bir URL gömmez. Bu yüzden değer Coolify'da açıkça set edilmek zorunda.
- [ ] Bölüm 5: Auto Deploy açık, Preview Deployments açık, URL şablonu `http://{{pr_id}}.preview.dogancanyildiz.sh` (şema bilerek `http`).
- [ ] Bölüm 6, health check: Path `/api/health`, Port `3000`, Interval `15`, Timeout `5`, Retries `3`, Start Period `30`. Sunucuda `docker inspect --format '{{.State.Health.Status}}' <container>` -> `healthy`. `unhealthy` görülürse coollabsio/coolify#7500 notuna bak; health check geçici kapatıldıysa `docs/plans/handoffs/faz-1.md` "Açık kalanlar" bölümüne yaz.
- [ ] Bölüm 7: rolling update'in dört koşulu (health check geçiyor, varsayılan container adı, host port mapping yok, compose build pack yok).
- [ ] Doğrulama: deploy logunda `re_` ile başlayan string yok; canlı HTML kaynağında `https://dogancanyildiz.sh` geçiyor.

## 4. Preview deployment (Task 11 Step 5, Bitti kriteri 7)

- [ ] Test PR'ında Coolify yorumu preview URL içeriyor: `gh pr view --json comments --jq '.comments[].body' | grep -i preview`
- [ ] Allowlist'teki (bölüm 6'daki `ADMIN_IPV4`) makineden: `curl -s http://<pr-id>.preview.dogancanyildiz.sh/api/health` -> `{"status":"ok",...}`
- [ ] Preview ortamında `TRUST_CF_CONNECTING_IP` `false` kalır (preview'lar Cloudflare'ın arkasında değil).

## 5. Cloudflare (`docs/deploy/cloudflare-kurulum.md`)

- [ ] Bölüm 1, DNS: `dogancanyildiz.sh` apex `A ORIGIN_IPV4` proxied, `www` CNAME proxied, `*.preview` `A ORIGIN_IPV4` **DNS only**; `dogancanyildiz.com` apex `A 192.0.2.1` proxied, `www` CNAME proxied. `.com` zone'undaki MX kayıtlarına dokunma.
- [ ] Bölüm 2: SSL/TLS **Full (strict)**, Always Use HTTPS açık, HSTS Cloudflare'da **kapalı** (tek kaynak Traefik).
- [ ] Bölüm 4: Cache Rule `static assets` (curl ile ikinci istekte `cf-cache-status: HIT`).
- [ ] Bölüm 5: Rate limiting rule `contact endpoint` (`/api/contact`, 10 saniyede 3 istek, 10 saniye block). Doğrulama döngüsünde altıncı istek `429`.
- [ ] Bölüm 6: Bot Fight Mode açık. Bölüm 7: Turnstile eklenmez.
- [ ] Bölüm 3, Redirect Rule `com to sh`: **yalnızca site sahibinin `.com -> .sh` onayından sonra** (bkz. bölüm 9 aşağıda).

## 6. Traefik ve origin kısıtı (`docs/deploy/traefik-ve-origin.md`)

- [ ] Bölüm 0: Coolify -> uygulama -> Advanced -> "Readonly labels" kapatılır.
- [ ] Bölüm 1-2: `curl -s https://www.cloudflare.com/ips-v4` ve `ips-v6` ile listeyi tazele (2026-08-27'de 15 + 7 blok, dokümandaki listeyle birebir); `/data/coolify/proxy/docker-compose.yml` içindeki Traefik `command:` listesine `--entryPoints.http.forwardedHeaders.trustedIPs=...` ve `--entryPoints.https.forwardedHeaders.trustedIPs=...` satırları; proxy restart; `docker inspect coolify-proxy --format '{{range .Config.Cmd}}{{println .}}{{end}}' | grep -c forwardedHeaders` -> `2` (Bitti kriteri 10).
- [ ] Bölüm 3: `/data/coolify/proxy/dynamic/cloudflare.yaml` (middleware'ler `security-headers`, `compress`, `cloudflare-only`, `redirect-to-sh`); proxy restart.
- [ ] Bölüm 4: Custom Labels alanındaki mevcut `traefik.http.routers.https-0-<uuid>.middlewares=...` satırının sonuna `,security-headers@file,compress@file` ekle, aynısını `http-0-<uuid>` için de yap. `<uuid>` aynı alandaki `...rule=Host(...)` satırından kopyalanır; `portfolio` adında bir router yok, o ada yazılan etiket sessizce yok sayılır ve site HSTS'siz yayına girer. Üretilmiş etiketlerin hiçbiri silinmez. `buffering` eklenmez. Doğrulama: `curl -sI https://dogancanyildiz.sh/` -> `strict-transport-security: max-age=31536000; includeSubDomains`, `x-powered-by` yok, `content-encoding` `br` veya `zstd`.
- [ ] Bölüm 5a, ufw: yalnızca `default deny incoming` + `OpenSSH`. ufw 80/443'ü **kapatmaz**, Docker o portları publish ettiği için trafik ufw'nin görmediği FORWARD zincirinden geçer.
- [ ] Bölüm 5b, `DOCKER-USER` (asıl origin kısıtı): önce 80/443 için catch all DROP `-I DOCKER-USER 1` ile eklenir, sonra Cloudflare blokları ve `ADMIN_IPV4` (`curl -s https://api.ipify.org`) yine `-I ... 1` ile üstüne eklenir. Beklenen: `iptables -S DOCKER-USER` -> 15 IPv4 bloğu + admin + DROP, `ip6tables -S DOCKER-USER` -> 7 IPv6 bloğu + DROP. `netfilter-persistent save` ile kalıcı yapılır ve proxy restart sonrası tekrar kontrol edilir.
- [ ] Doğrulama (Bitti kriteri 9), allowlist dışındaki bir ağdan: `curl -sS --max-time 8 --resolve dogancanyildiz.sh:443:ORIGIN_IPV4 https://dogancanyildiz.sh/api/health` -> `curl: (28)` veya `curl: (7)`. Gövde dönerse kısıt çalışmıyor. Kural listesinin dolu görünmesi kanıt değildir, tek kanıt bu testtir.
- [ ] **Ancak bölüm 2 VE bölüm 5 tamamlandıktan sonra**: Coolify -> Environment Variables -> `TRUST_CF_CONNECTING_IP=true`, redeploy. Sıra ters çevrilirse rate limit atlanabilir hale gelir. Doğrulama bölüm 2'deki üç kanıttır: (1) bölüm 5b'nin `--resolve` testi origin'i kapalı gösteriyor, (2) Traefik access log'undaki `ClientHost` kendi genel adresinizi gösteriyor, Cloudflare edge adresini değil, (3) `/api/contact`'a 6 saniye aralıkla, `-d '{}'` gövdesiyle atılan altı istekte ilk beşi `400`, altıncısı JSON gövdeli ve `retry-after` başlıklı `429`. Cloudflare üzerinden `CF-Connecting-IP` başlığı göndererek yapılan eski döngü kanıt değil: edge başlığı ezer ve edge'in kendi rate limit kuralı hiçbir şey yapılandırılmamışken bile `429` döndürür.
- [ ] `ADMIN_IPV4` değiştikçe `DOCKER-USER` kuralı güncellenir, eskisi `iptables -D DOCKER-USER ...` ile silinir (admin adresi ve tarihi `docs/plans/handoffs/faz-1.md` "Açık kalanlar" bölümüne yazılır).

## 7. Resend (`docs/deploy/resend-domain.md`)

- [ ] Resend -> Domains -> Add `dogancanyildiz.sh`, region `eu-west-1`.
- [ ] Cloudflare `dogancanyildiz.sh` zone'una DNS only kayıtlar: MX `send`, TXT `send` (SPF), TXT `resend._domainkey` (DKIM), TXT `_dmarc` (`p=none`).
- [ ] `dig +short TXT send.dogancanyildiz.sh` / `MX send...` / `TXT resend._domainkey...` / `TXT _dmarc...` beklenen değerleri döner; Resend panelinde `Verified`.
- [ ] Coolify'da `RESEND_API_KEY` Build Variable olarak işaretlenmedi (Runtime).

## 8. Canlı doğrulama (Bitti kriteri 6, 11, 12)

- [ ] `curl -s https://dogancanyildiz.sh/api/health` -> `{"status":"ok",...}`; `curl -s -o /dev/null -w '%{http_code}' https://dogancanyildiz.sh/` -> `200`.
- [ ] `curl -sI https://dogancanyildiz.sh/ | grep -i -E '^(strict-transport-security|x-content-type-options|referrer-policy|x-powered-by)'` -> HSTS, `nosniff`, `strict-origin-when-cross-origin` var; `x-powered-by` yok.
- [ ] Contact formu uçtan uca: planın Bitti kriteri 11 komutu -> `{"ok":true}`, posta `me@dogancanyildiz.com` kutusuna ulaşır, kaynağında `dkim=pass` ve `spf=pass`.
- [ ] Rate limiting: Bitti kriteri 12 döngüsünde son istek(ler) `429`.
- [ ] `docs/deploy/` altındaki dört checklist'in kutuları işaretlenip commit edilir: `git add docs/deploy && git commit -m "docs: tick off the completed deploy checklists" && git push`.

## 9. `.com -> .sh` yönlendirmesi (Task 11 Step 8, Bitti kriteri 8)

- [ ] `docs/11-acik-sorular.md` soru 5 için site sahibinin kesin onayı alınır. Onay yoksa bu bölüm atlanır, `.com` zone'u olduğu gibi kalır.
- [ ] Onay sonrası `docs/deploy/cloudflare-kurulum.md` bölüm 3 uygulanır: `curl -sI https://dogancanyildiz.com/projects` -> `HTTP/2 301` + `location: https://dogancanyildiz.sh/projects`; `curl -sI -L https://dogancanyildiz.com/projects | grep -c -i '^location'` -> `1` (tek atlama).

## 10. Merge ve otomatik deploy (Task 11 Step 7)

- [ ] `gh pr merge --squash --delete-branch` (Faz 0 PR'ı merge edildikten sonra), `git switch main && git pull --ff-only`.
- [ ] 2 dakika sonra `curl -s https://dogancanyildiz.sh/api/health` ve `/` 200.

## 11. Faz 0'dan devralınan, hâlâ açık manuel maddeler

- [ ] Renovate GitHub App kurulumu (Faz 5; `renovate.json` hazır, automerge bu fazın CI kapısıyla anlamlı hale geldi, branch protection bölüm 2'de).
- [ ] `npm audit` bulguları için karar (Faz 0 devir notu "Açık kalanlar").
- [ ] `next dev`'in ürettiği `AGENTS.md` / `CLAUDE.md` dosyaları için karar (commit, ignore veya `agentRules: false`).
- [ ] CSP nonce sorusu (Faz 5, Umami ile birlikte).
