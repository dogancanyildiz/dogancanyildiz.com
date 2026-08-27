# Faz 3 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi uygular. Bu oturumda hiçbiri uygulanmadı: dal push edilmedi, PR açılmadı, tarayıcı bağlı olmadığı için ekran görüntüsü alınmadı, hiçbir panele dokunulmadı. Faz 3'ün kod tarafı yerelde tamam (`docs/plans/handoffs/faz-3.md`, "Doğrulananlar"); burada kalan iş yayınlama, CI, görsel doğrulama ve sahibinin kararları.

Dal: `feature/faz-3-tasarim-sistemi`, `feature/faz-2-i18n-app-lang` (`d8c9ddc`) üzerine, o da Faz 1 (`81f97c8`) ve Faz 0 (`bc42737`) üzerine stacked. Faz 0 (#2), Faz 1 ve Faz 2 PR'ları merge edilmediği için sıra: Faz 0, Faz 1, Faz 2, en son Faz 3. Alt fazlar squash merge edilirse üsttekiler `--onto` ile taşınır.

## 1. Dalı yayınla ve PR aç (plan Task 10 Step 7)

- [ ] `git log --oneline d8c9ddc..feature/faz-3-tasarim-sistemi` ile 23 commit'i gözden geçir (1 plan düzeltmesi, 9 task, 8 inceleme düzeltmesi, 4 entegrasyon, 1 devir notu).
- [ ] Faz 2 merge edilmediyse önce `docs/plans/handoffs/faz-2-manual-checklist.md` bölüm 1-2 ve 5 ile onu bitir. Faz 2 squash merge edildiyse: `git rebase --onto main d8c9ddc feature/faz-3-tasarim-sistemi`; merge commit ile alındıysa rebase gerekmez, `main` base olarak seçilir. Rebase sonrası `npm ci && npm run build && npm run verify:routes` bir kez daha koşulur (lockfile bu dalda Tailwind için değişti, çakışma çıkarsa bu dalın `package-lock.json`'ı alınıp `npm install` ile yeniden çözülür).
- [ ] `git push -u origin feature/faz-3-tasarim-sistemi`
- [ ] `gh pr create --base main --head feature/faz-3-tasarim-sistemi --title "Faz 3: design system (typography, palette, layout, motion, accessibility)"`; gövde için planın Task 10 Step 7 metni. Gövdeye şunları ekle: (a) "Target size audit" başlığının altına aşağıdaki tabloyu, (b) "Screenshots" başlığının altına bölüm 3'te alınan görüntüleri, (c) entegrasyon commit'lerinin plan dışı olduğunu (`9ff17df` skip link ve `<main>`, `5e9f896` tema etiketi, `57bf733` gölge token'ı, `a9a8705` Tailwind 4.3.3 ve `source("../")`) ve `docs/plans/handoffs/faz-3.md` "Plandan sapmalar" ile "Açık kalanlar" bölümlerine atfı. Gövdede uzun/en çizgi ve AI atfı yok.
- [ ] PR diff'inde yerel dosya olmadığını doğrula: `git diff --name-only d8c9ddc..HEAD | grep -E '^(\.env\.local|\.local/|\.nodeterm/|\.superpowers/|node_modules/|\.next/|AGENTS\.md|CLAUDE\.md)'` boş dönmeli.
- [ ] Vendor edilen ikili dosyaların diff'te olduğunu doğrula: `git diff --stat d8c9ddc..HEAD -- src/fonts public/fonts` 8 ikili dosya + 3 lisans + `index.ts` göstermeli.

PR gövdesine kopyalanacak hedef boyutu tablosu (plan Task 8 Step 7, değerler kodla karşılaştırıldı, `tap-target` = `min-h-11 min-w-11`):

| Eleman | Dosya | Sınıf | Hesaplanan | Sonuç |
| --- | --- | --- | --- | --- |
| Mobil menü açma butonu | `mobile-menu.tsx` | `size-9` + `tap-target` | 44x44 | geçiyor |
| Mobil menü kapatma butonu | `mobile-menu.tsx` | `size-9` + `tap-target` | 44x44 | geçiyor |
| Mobil menü linkleri | `mobile-menu.tsx` | `tap-target py-3` | 44 yükseklik | geçiyor |
| Tema anahtarı | `theme-toggle.tsx` | `size-9` + `tap-target` | 44x44 | geçiyor |
| Dil anahtarı EN/TR | `language-switcher.tsx` | `h-8 px-3` | 32x48 | geçiyor |
| Masaüstü nav linkleri | `header.tsx` | `min-h-9 px-4` | 36 yükseklik | geçiyor |
| Footer sayfa linkleri | `footer.tsx` | `tap-target` | 44 yükseklik | geçiyor |
| Footer sosyal ikonlar | `footer.tsx` | `tap-target` | 44x44 | geçiyor |
| Etiket filtre butonları | `projects-section.tsx` | `min-h-9 px-4` | 36 yükseklik | geçiyor |
| Proje satırı linki | `project-row.tsx` | `py-5` satır + `::after` | 66 yükseklik | geçiyor |
| Button `size="xs"` | `button.tsx` | `h-7` | 28 yükseklik | geçiyor |
| Button `size="icon-xs"` | `button.tsx` | `size-7` | 28x28 | geçiyor |

24 px altında eleman yok (WCAG 2.2 SC 2.5.8). Tema anahtarının hidrasyon öncesi yer tutucu butonu `tap-target` taşımıyor (`size-9`, 36x36), disabled ve anlık; eşiğin üstünde.

## 2. CI kapısı

- [ ] `gh pr checks --watch`: `lint, typecheck, test, build` ve `hadolint and image build` `pass`. `checks` job'ında altı `run` adımı var; logda `Static route check passed: 20 content routes prerendered (6 project pages per locale).` ve `Tests 367 passed` görünmeli.
- [ ] Docker job'ı bu oturumda yerelde birebir koşuldu ve geçti (`faz-3.md`, "Doğrulananlar"); CI'da farklı sonuç çıkarsa `npm ci`'ın `@tailwindcss/oxide-linux-x64-gnu` 4.3.3 binary'sini çözdüğüne bak (lockfile'da var).
- [ ] `npm run format` CI'da koşmuyor (bölüm 6). PR açmadan önce yerelde bir kez daha `npm run format`.

## 3. Görsel doğrulama ve ekran görüntüleri (plan Task 10 Step 4)

`npm run dev` (veya `npm run build && npm run start -- -p 3171`), Chrome DevTools. Her madde için ekran görüntüsü alınıp PR'a eklenir. Bu oturumda statik olarak doğrulanabilen her şey doğrulandı; aşağıdakiler gerçekten göz ister.

Masaüstü, 1440px, light tema, `/`:
- [ ] h1 Instrument Serif'te render ediliyor, sistem serif'ine düşmüyor (`g` kuyruğu ve `a` formu; DevTools > Rendered Fonts "Instrument Serif" demeli, "Georgia" veya "Iowan Old Style" değil).
- [ ] Gövde metni Geist Sans, yıl / rozet / metrik metinleri Geist Mono (Rendered Fonts).
- [ ] Zeminde renkli gradyan yok, yalnızca üst kısımda sönen çok soluk bir grid var (`body::before`, `mask-image` ile 45%'te bitiyor).
- [ ] Emerald yalnızca birincil butonda, linklerin hover'ında ve "available" noktasında. Bilinen iki ek kullanım: hero'daki uppercase eyebrow satırı (`text-primary`) ve contact sayfasındaki `Clock3` ikonu; kabul edilecekse listeye yazılır, edilmeyecekse `text-muted-foreground`'a çevrilir (bölüm 6).
- [ ] Panel ve kart gölgeleri nötr (yeşil tonu yok), `.surface-panel` header'da ve kartlarda aynı.

Masaüstü, 1440px, dark tema (tema anahtarıyla):
- [ ] Zemin `#0a0c0f` tonunda koyu nötr, yeşile çalmıyor.
- [ ] İkincil metin (muted, `#999fa6`) gövde metninden açıkça daha soluk, marka rengiyle aynı değil.
- [ ] Panel ve kartların altında açık renkli bir hale yok; gölge koyu (`--shadow-color` siyah, `57bf733`). Bu madde bu turda eklendi, plan listesinde yoktu.
- [ ] Tema anahtarı ilk tıklamada gerçekten tema değiştiriyor (sistem teması dark olan makinede özellikle: ilk tıklama light'a geçmeli, `598608e`).

Mobil, 390px genişlik (DevTools cihaz emülasyonu), `/`:
- [ ] Hamburger butonu görünüyor, masaüstü nav listesi gizli.
- [ ] Dialog açılıyor, dört link listeleniyor (Home, About, Projects, Contact), `Escape` kapatıyor, Tab odağı dialog içinde kalıyor, bir linke tıklayınca hem sayfa değişiyor hem dialog kapanıyor.
- [ ] Footer'da "Pages" bloğu dört linki gösteriyor; sosyal ikonlar ve linkler 44px yüksekliğinde (DevTools ile ölç).

`/tr` (390px ve 1440px):
- [ ] "Doğan", "İçeriğe geç", "Menüyü aç", "Temayı değiştir" gibi metinlerde `ğ`, `İ`, `ş`, `ı` karakterleri gövde fontuyla aynı yüzde çiziliyor, fallback fonta düşmüyor (Rendered Fonts iki ailenin de "Geist" olduğunu söylemeli; harf genişliği ve x-yüksekliği komşu harflerle tutarlı). Ağ sekmesinde `geist_latin_ext*.woff2` yalnızca TR sayfasında iniyor.
- [ ] Ağ sekmesinde `fonts.googleapis.com` veya `fonts.gstatic.com` isteği yok; tüm font istekleri `/_next/static/media/`.

`/projects` (1440px):
- [ ] Liste satır formatında: mono yıl, başlık, rol, sağda mono stack.
- [ ] Satırın boş alanına (başlık dışına) tıklamak detay sayfasına götürüyor; başlığa sağ tık "Yeni sekmede aç" çalışıyor (gerçek `<a>`).

`/contact` (bu madde planda "boş e-posta ile gönder" diye yazılmıştı; e-posta alanı `required` + `type="email"` olduğu için boş gönderim tarayıcının yerel doğrulamasında kalır ve React tarafı hiç çalışmaz, o senaryoda kırmızı paragraf çıkmaz; yeniden yazıldı):
- [ ] Alanları geçerli doldurup gönder; `RESEND_API_KEY` yerelde yoksa API 500 döner ve formun altında kırmızı `role="alert"` paragrafı çıkar. Göndermeden önce Tab ile alanlar arasında gezinirken odak halkası solid yeşil, 2px, 2px offset; butonda ve inputlarda aynı halka.
- [ ] Gönderim sırasında butonda `aria-busy="true"` ve disabled; başarı durumunda (geçerli API anahtarıyla) yeşil `role="status"` paragrafı.

Klavye (herhangi bir sayfa, 1440px):
- [ ] Sayfa yüklenince bir kez Tab: sol üstte "Skip to content" / "İçeriğe geç" pill'i görünüyor, metin kenara yapışık değil (padding var, `9ff17df`); Enter ile odak `<main>`'e geçiyor (sonraki Tab ilk içerik linkine gider), `<main>` çevresinde halka çizilmiyor.

DevTools > Rendering > `prefers-reduced-motion: reduce`:
- [ ] Sayfa yenilendiğinde hiçbir fade veya kayma yok. Bilinen sınır: içerik ilk boyamada `opacity:0` ile gelip hidrasyonda aniden görünür (bölüm 4). Gözlenen davranış buysa bu madde "bilinen sınır" olarak işaretlenir, "geçti" değil.

404 (`/nope` ve `/tr/nope`):
- [ ] 404 dokümanı aynı fontlarla (serif başlık, Geist gövde) ve aynı temayla açılıyor; header/footer yok (Faz 2 kararı).

## 4. Reduced-motion SSR kararı

Prerender edilmiş HTML'de `/` üzerinde 12 eleman `style="opacity:0;transform:translateY(4px)"` taşıyor (`/projects`'te her satır). Reduced-motion kullanıcısı ve JS kapalı ziyaretçi içeriği hidrasyona kadar görmüyor. Üç seçenek:

- [ ] (a) Kabul: `docs/03-tasarim-ui-ux.md`'ye sınır olarak yazılır, plan Step 15'in ifadesi düzeltilir.
- [ ] (b) CSS öncelikli: gizli durum bir sınıfa taşınır (`[data-motion="hidden"]` gibi), animasyon CSS keyframe'i ile yapılır, `@media (prefers-reduced-motion: reduce)` sınıfı etkisiz kılar; `m` yalnızca hover/tap için kalır. Motion katmanının yeniden tasarımı, ayrı task.
- [ ] (c) `initial={false}` ile ilk render'da görünür, `animate` yalnızca istemcide; SSR HTML'i temiz olur ama ilk boyamada animasyon olmaz. En küçük değişiklik, `fadeUp` fabrikasına dokunur.

Karar Faz 4 planına girer.

## 5. Coolify preview ve canlı doğrulama

Ön koşul: Faz 1 checklist'inin Coolify ve Cloudflare bölümleri. Uygulanmadıysa bu bölüm bekler.

- [ ] Preview URL'de (`P=...`): `curl -s $P/tr | grep -o 'href="[^"]*\.woff2"' | sort -u` üç `/_next/static/media/*.woff2` satırı; `curl -sI $P/_next/static/media/<dosya>` `200`, `content-type: font/woff2`, `cache-control` `immutable` içeriyor (Next'in varsayılanı; Cloudflare cache rule'u `/_next/static/*` için "Cache Everything" ise `cf-cache-status` ikinci istekte `HIT`).
- [ ] `curl -sI $P/opengraph-image/default` ve `$P/tr/opengraph-image/default` `200 image/png`; `curl -sI $P/icon` `200 image/png`; `curl -sI $P/favicon.ico` artık 404 (statik dosya silindi), tarayıcı sekmesinde DCY monogramı görünüyor.
- [ ] Bir paylaşım önizleyicisiyle (Slack, LinkedIn Post Inspector, X Card Validator) `$P/` ve `$P/tr` kartı: "Doğan Can Yıldız" tofu'suz, unvan locale'e göre. Kart alt metni hâlâ "Portfolio" / "Portfolyo" (bölüm 6).
- [ ] Merge sonrası canlıda (`S=https://dogancanyildiz.sh`) aynı üç kontrol; Cloudflare önde olduğu için `content-type` ve `cf-cache-status` başlıklarına bak.

## 6. Sahibinin kararını bekleyen maddeler

- [ ] **Header marka adı `font-display`** (`92fbe6f` ile düştü, plan kodu birebir). Serif marka istenirse `header.tsx`'teki `text-lg` span'ına `font-display` geri eklenir.
- [ ] **Header `<nav aria-label>`** "Menu" (`nav.menu`), mobil dialog başlığı da "Menu". Ayırt edici olsun isteniyorsa `nav.primary` gibi yeni anahtar ("Main navigation" / "Ana gezinme").
- [ ] **Accent kullanımı**: hero eyebrow satırı ve contact `Clock3` ikonu `text-primary`. Kabul ya da `text-muted-foreground`.
- [ ] **OG kartındaki sabit "Türkiye"**: `siteConfig.person.location.country` `"TR"` kodu; ülke adını config'e almak ya da JSX'te bırakmak.
- [ ] **Favicon monogramı** 32px tuvalde ~10px harf yüksekliği. Tek harf, daha büyük `fontSize` ya da olduğu gibi.
- [ ] **`metadata.ogAlt`** "Portfolio" / "Portfolyo": kartı anlatan metin (ör. "Doğan Can Yıldız, Full-Stack Web Developer and DevOps Engineer") Faz 4 içerik geçişinde.
- [ ] **`header.tsx`'teki sabit "Portfolio" eyebrow'u**: `/tr`'de de İngilizce; Faz 4'te anahtara bağlanır (`metadata.siteName` ya da yeni `brand.eyebrow`).
- [ ] **Ölü tanımlar**: `--destructive-foreground` (`@theme inline`'a `--color-destructive-foreground` eklenir ya da silinir), `.pull-quote` (blog yazısı sayfası kullanacaksa kalır), `footer.twitter` (silinir).
- [ ] **Proxy matcher `icon` prefix'i**: `/icons` gibi bir route gelene kadar sorun değil; gelince `icon(?:$|\?)` biçimine daraltılır.
- [ ] **`npm run format` CI adımı**: `.github/workflows/ci.yml` `checks` job'ına `- run: npm run format` ve `tests/deploy/ci-workflow.test.ts` listesine aynı komut. Bu fazda iki, Faz 2'de dört task bu kapıya takıldı.
- [ ] **DOM tabanlı test kurulumu** (vitest `jsdom` + Testing Library ya da Playwright smoke): dialog açılma / `Escape`, `::after` tıklama alanı, `useReducedMotion` davranışı, skip link odağı. Bugünkü testler kaynak metni grep'i.
- [ ] **Faz 4 launch kapısı grep'i** `messages/` ve `src/components/layout/header.tsx`'i kapsamalı: `grep -rni "alex chen\|example.com\|techcorp\|startupxyz\|>Portfolio<" src/ public/ messages/ README.md .env.example`.
- [ ] **Erişilebilirlik ince ayarları** (planın seçimi): `role="status"` için kalıcı boş kap, `aria-busy` yerine `aria-disabled` + canlı bölge, `:focus-visible { border-radius: inherit }` yan etkisi, `body::before` için `-webkit-mask-image`. Görsel turda rahatsız eden olursa açılır.

## 7. Faz 0, 1 ve 2'den devralınan, hâlâ açık manuel maddeler

Tamamı `docs/plans/handoffs/faz-1-manual-checklist.md` ve `faz-2-manual-checklist.md` içinde; bu fazın preview ve canlı doğrulaması onlara bağlı.

- [ ] Faz 0 PR (#2), Faz 1 ve Faz 2 PR'larının sırayla merge'i (Faz 2 checklist bölüm 1 ve 5).
- [ ] Coolify uygulaması, env katmanları, Preview Deployments, health check (Faz 1 bölüm 3-4).
- [ ] Cloudflare DNS, Full (strict), cache rule, `/api/contact` rate limiting, Bot Fight Mode (Faz 1 bölüm 5).
- [ ] Traefik `trustedIPs`, middleware'ler, `DOCKER-USER` origin kısıtı, ardından `TRUST_CF_CONNECTING_IP=true` (Faz 1 bölüm 6).
- [ ] Resend domain doğrulaması (Faz 1 bölüm 7).
- [ ] `.com -> .sh` 301 onayı (Faz 1 bölüm 9), Renovate, `npm audit` kararı, CSP nonce (Faz 1 bölüm 11).
- [ ] Faz 2 bölüm 6: `.gitignore`'daki `AGENTS.md` / `CLAUDE.md` kararı, sitemap `x-default`, 429/413 metinleri, 404 locale'i, hreflang test aracı (canlı URL'de).
- [x] Faz 0'ın bu faza bıraktığı iki madde kapandı: `theme-toggle.tsx` `resolvedTheme` (`598608e`), Tailwind 4.2 -> 4.3.3 (`a9a8705`).
