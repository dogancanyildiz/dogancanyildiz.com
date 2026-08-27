# Faz 2 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi uygular. Bu oturumda hiçbiri uygulanmadı: dal push edilmedi, PR açılmadı, hiçbir panele dokunulmadı. Faz 2'nin kod tarafı yerelde tamam (`docs/plans/handoffs/faz-2.md`, "Doğrulananlar"); burada kalan iş yayınlama, CI, preview ve sahibinin kararları.

Dal: `feature/faz-2-i18n-app-lang`, `feature/faz-1-deploy-hatti` (`81f97c8`) üzerine, o da `feature/faz-0-guvenlik-ve-hijyen` (`bc42737`) üzerine stacked. Faz 0 PR'ı (#2) ve Faz 1 PR'ı henüz merge edilmediği için sıra: önce Faz 0, sonra Faz 1, en son Faz 2. Alt fazlar squash merge edilirse üsttekiler `--onto` ile taşınır; adımlar bölüm 1'de.

## 1. Dalı yayınla ve PR aç (plan Task 8 Step 10, Bitti kriteri 9'un ön koşulu)

- [ ] `git log --oneline 81f97c8..feature/faz-2-i18n-app-lang` ile 18 commit'i gözden geçir (13 task commit'i, 4 entegrasyon commit'i, devir notu).
- [ ] Faz 0 ve Faz 1 merge edilmediyse önce onları `docs/plans/handoffs/faz-1-manual-checklist.md` bölüm 1-2 ve 10 ile bitir. Faz 1 squash merge edildiyse: `git rebase --onto main 81f97c8 feature/faz-2-i18n-app-lang`; Faz 1 merge commit ile alındıysa rebase gerekmez, `main` base olarak seçilir.
- [ ] `git push -u origin feature/faz-2-i18n-app-lang`
- [ ] `gh pr create --base main --head feature/faz-2-i18n-app-lang --title "Faz 2: i18n yeniden mimarisi (app/[lang] + next-intl)"`; gövde için planın Task 8 Step 10 metni (`1033563` ile düzeltilmiş hali: "Only the `/api/*` route handlers ... are marked dynamic"). Gövdeye `docs/plans/handoffs/faz-2.md` içindeki "Plandan sapmalar" ve "Açık kalanlar" bölümlerine atıf ekle; dil değiştirici düzeltmesi (`97cb727`), `verify:routes` CI adımı (`72ab71a`) ve `.gitignore` kararı (`26bf303`) plan dışı, PR'da açıkça anılmalı.
- [ ] PR diff'inde yerel dosya olmadığını doğrula: `git diff --name-only 81f97c8..HEAD | grep -E '^(\.env\.local|\.local/|\.nodeterm/|\.superpowers/|node_modules/|\.next/|AGENTS\.md|CLAUDE\.md)'` boş dönmeli.

## 2. CI kapısı (Bitti kriteri 9'un ikinci maddesi)

- [ ] `gh pr checks --watch`: `lint, typecheck, test, build` ve `hadolint and image build` check'leri `pass`. Adlar Faz 1 ile aynı; `checks` job'ında artık build'den sonra `npm run verify:routes` da koşuyor ve logda `Static route check passed: 20 content routes prerendered (6 project pages per locale).` görünmeli.
- [ ] CI'da build `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh` ile koşar; `verify:routes` aynı job'ın `.next/prerender-manifest.json`'ını okur, ek kurulum yok.
- [ ] `npm run format` CI'da koşmuyor (bölüm 6'daki karar). PR açmadan önce yerelde `npm run format` bir kez daha koşulur.

## 3. Coolify preview (Bitti kriteri 9)

Ön koşul: Faz 1 checklist'inin Coolify bölümleri (3 ve 4) uygulanmış, Preview Deployments açık, `NEXT_PUBLIC_SITE_URL` Build Variable olarak set edilmiş. Uygulanmadıysa bu bölüm bekler.

- [ ] Coolify'ın PR yorumundaki preview URL'i al: `gh pr view --json comments --jq '.comments[].body' | grep -i preview`
- [ ] Allowlist'teki makineden (`P=http://<pr-id>.preview.dogancanyildiz.sh`):
  - `curl -s -o /dev/null -w '%{http_code}\n' $P/` -> `200`; `curl -s $P/ | grep -o '<html lang="en"'`
  - `curl -s -o /dev/null -w '%{http_code}\n' $P/tr` -> `200`; `curl -s $P/tr | grep -o '<html lang="tr"'`
  - `curl -sI $P/en | grep -i -E '^(HTTP|location)'` -> `307` ve `location: /`
  - `curl -s -o /dev/null -w '%{http_code}\n' $P/fr` -> `404`
  - `curl -sI $P/ | grep -ci set-cookie` -> `0`
- [ ] Preview'da canonical ve hreflang `NEXT_PUBLIC_SITE_URL`'i, yani üretim domain'ini gösterir (`https://dogancanyildiz.sh/...`), preview host'unu değil. Bu beklenen davranış, hata değil; preview'ın kendi URL'ini gösteren canonical istenmiyor.
- [ ] `curl -s $P/api/health` -> `{"status":"ok",...}`; `curl -s -X POST $P/api/contact -H 'Content-Type: application/json' -d '{"locale":"tr"}'` -> `{"error":"Geçersiz istek. Ad, e-posta ve mesaj alanları zorunlu."}`

## 4. hreflang test aracı (Bitti kriteri 10)

- [ ] Preview URL herkese açık değil (DNS only + origin allowlist), araç dışarıdan erişemez. İki seçenek: (a) test süresince `ADMIN_IPV4` yerine aracın çıkış adresini geçici olarak allowlist'e eklemek yerine, (b) bu kontrolü merge sonrası canlı URL'de yapmak. Önerilen (b); allowlist'e üçüncü taraf adresi eklenmez.
- [ ] technicalseo.com/tools/hreflang/ ile `https://dogancanyildiz.sh/` ve `https://dogancanyildiz.sh/tr` taranır. Beklenen: her sayfada `en`, `tr`, `x-default`; self-referencing etiket var; karşılıklı etiket hatası yok; `x-default` ve `en` kök URL'e, `tr` `/tr`'ye işaret ediyor.
- [ ] Sonuç `docs/plans/handoffs/faz-2.md` "Doğrulananlar" tablosundaki 10. satıra yazılıp commit edilir.
- [ ] Search Console doğrulaması bu fazın kriteri değil, Faz 4 launch kapısına ait.

## 5. Merge ve canlı doğrulama

- [ ] Karar: Faz 2 tek başına yayına çıksın mı? Canlıda görünen metin hâlâ şablon persona ("Alex Chen", `alex@example.com`) ama JSON-LD gerçek ismi söylüyor; Faz 4'e kadar bu uyuşmazlık görünür olur. Faz 1 checklist'i uygulanmadıysa zaten canlı site yok ve soru Faz 4'e ertelenebilir.
- [ ] `gh pr merge --squash --delete-branch`, `git switch main && git pull --ff-only`.
- [ ] Deploy sonrası (`S=https://dogancanyildiz.sh`):
  - `curl -s -o /dev/null -w '%{http_code}\n' $S/` ve `$S/tr` -> `200`; `<html lang>` `en` / `tr`
  - `curl -sI $S/en | grep -i location` -> `location: /` (Cloudflare önde olduğu için `HTTP/2 307`)
  - `curl -s $S/sitemap.xml | grep -c '<url>'` -> `20`; `curl -s $S/robots.txt | grep 'Disallow: /api/'`
  - `curl -s $S/ | grep -o '"@type":"Person"' | wc -l` -> `1`; Google Rich Results Test'e `https://dogancanyildiz.sh/` verilir, `Person` hatasız çıkar
  - `curl -s -X POST $S/api/contact -H 'Content-Type: application/json' -d '{"locale":"tr"}'` -> TR hata gövdesi (Cloudflare rate limit kuralına takılmamak için tek istek)
- [ ] Cloudflare cache rule statik varlıklar için; HTML cache'lenmiyor, dolayısıyla `/tr` ve `/` için ayrı cache anahtarı gerekmez. `curl -sI $S/tr | grep -i cf-cache-status` `DYNAMIC` göstermeli.

## 6. Sahibinin kararını bekleyen maddeler

- [ ] **`AGENTS.md` / `CLAUDE.md` `.gitignore`'da** (`26bf303`). Kabul ediliyorsa `docs/plans/handoffs/faz-1-manual-checklist.md` bölüm 11'deki madde kapanır. İstenmiyorsa `.gitignore`'daki iki satır silinir ve ya dosyalar commit edilir (içerik uzun çizgi taşıyor, `next dev` her başlangıçta yeniden yazar) ya da `next.config.ts`'e `agentRules: false` eklenip dosyalar silinir.
- [ ] **Sitemap `x-default`**: `<head>` üretiyor, sitemap üretmiyor. Eklenecekse `src/app/sitemap.ts`'teki `languagesFor` kaldırılıp `buildAlternates`'in `languages` haritası paylaşılır ve `tests/seo/sitemap.test.ts:39` güncellenir.
- [ ] **EN og:image `/en/` prefix'i** (307 hop). Faz 3 `opengraph-image.tsx`'i yeniden yazarken kapatılır; ayrı bir düzeltme istenmiyor.
- [ ] **429, 413 ve okunamayan gövde 400'ü İngilizce.** Seçenekler `faz-2.md` "Açık kalanlar"da; hiçbiri seçilmezse `route.ts`'e neden yorumu yazılır.
- [ ] **404 dokümanı her zaman `<html lang="en">`** (TR paragrafı `lang="tr"` bloğunda). Faz 3 tasarımı `global-not-found.tsx`'e uygularken locale'e özel 404 istenip istenmediğine karar verilir.
- [ ] **`npm run format` CI adımı**: `.github/workflows/ci.yml` `checks` job'ına `- run: npm run format` ve `tests/deploy/ci-workflow.test.ts` listesine aynı komut. Bu fazda dört task bu kapıya takıldı.
- [ ] **Faz 4 launch kapısı grep'i `messages/` dizinini kapsamalı** (`docs/10-yol-haritasi.md`): `grep -rni "alex chen\|example.com\|techcorp\|startupxyz" src/ public/ messages/ README.md .env.example`.

## 7. Faz 0 ve Faz 1'den devralınan, hâlâ açık manuel maddeler

Tamamı `docs/plans/handoffs/faz-1-manual-checklist.md` içinde; bu fazın preview ve canlı doğrulaması onlara bağlı.

- [ ] Coolify uygulaması, env katmanları, Preview Deployments, health check (Faz 1 bölüm 3-4).
- [ ] Cloudflare DNS, Full (strict), cache rule, `/api/contact` rate limiting, Bot Fight Mode (Faz 1 bölüm 5).
- [ ] Traefik `trustedIPs`, middleware'ler, `DOCKER-USER` origin kısıtı, ardından `TRUST_CF_CONNECTING_IP=true` (Faz 1 bölüm 6).
- [ ] Resend domain doğrulaması (Faz 1 bölüm 7).
- [ ] `.com -> .sh` 301 onayı (Faz 1 bölüm 9), Renovate, `npm audit` kararı, CSP nonce (Faz 1 bölüm 11).
