# Faz 3 ara notu: Task 0 doğrulaması ve plan düzeltmesi

Tarih: 2026-08-27 · Dal: `feature/faz-3-tasarim-sistemi` · Base: `feature/faz-2-i18n-app-lang` @ `d8c9ddc` · Plan: `docs/plans/2026-08-27-faz-3-tasarim-sistemi.md`

Bu, fazın tamamının devir notu değil, yalnızca Task 0'ın (dalı aç, devralınan arayüzleri doğrula) çıktısı. Fazın tamamı bittiğinde `docs/plans/handoffs/faz-3.md` yazılacak.

## Dal ve devralınan arayüz doğrulaması

Dal `feature/faz-2-i18n-app-lang` HEAD'i (`d8c9ddc`) üzerinden zaten açılmıştı, `git status` temiz. Plan Step 2-3'ün listelediği dosyalar `ls`/`grep` ile tek tek doğrulandı:

- `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/app/[lang]/layout.tsx`, `messages/en.json`, `messages/tr.json`: var.
- `src/app/layout.tsx`: yok (`root layout removed: OK`).
- `src/i18n/navigation.ts`'te `createNavigation`: 1 eşleşme.
- `package.json.dependencies.motion`: `13.1.1`. `package.json.scripts.test`: `vitest run`. `src/` altında `framer-motion` importu yok.

Bu kısımda plan doğru; Step 4'ün kalite kapısı (typecheck/lint/test) bu görevin sonunda, plan düzeltmesinden sonra çalıştırıldı (aşağıda).

## Plan doğrulamasında bulunan iki hata ve düzeltmesi

Plan satır 35 Task 0'ın görevini şöyle tanımlıyor: "Dal açılmadan önce her biri `ls` / `grep` ile doğrulanır." Bu doğrulama sırasında planın "Faz 2'den devralınan arayüzler" tablosunda iki hata bulundu, ikisi de bloklayıcı: sonraki tasklar (Task 9, Task 2/3/4) yanlış dosya hedefleyecek ya da eksik dosya bırakacaktı. İkisi de bu görevde düzeltildi, kod tarafında henüz hiçbir Task 2-9 çalışmadı.

### 1. OG görseli kökte değil, `[lang]` altında ve locale bağımlı

Plan satır 45 (eski hali) `src/app/opengraph-image.tsx`, `src/app/icon.tsx` ikilisini "app kökünde, locale bağımsız, statik prerender" olarak tek satırda anlatıyordu. Gerçek:

```
$ ls src/app/opengraph-image.tsx
ls: src/app/opengraph-image.tsx: No such file or directory
$ ls src/app/icon.tsx
src/app/icon.tsx
$ ls "src/app/[lang]/opengraph-image.tsx"
src/app/[lang]/opengraph-image.tsx
```

Yalnızca `icon.tsx` kökte ve locale bağımsız. OG görseli `[lang]` altında, `generateStaticParams` + `generateImageMetadata` ile per-locale `alt` üretiyor (boş `params` fallback'i `hasLocale` ile), `size`/`contentType`/id `src/lib/seo/og-image.ts`'ten geliyor. Bu, Faz 2'nin düzeltme turunda (`2b10bd7`) bilinçli olarak kurulan bir mekanizma: `buildOpenGraph` aynı `og-image.ts`'i okuyarak `og:image` URL'sini üretiyor, iki taraf ayrışamıyor.

Planın Task 9'u (opengraph-image ve icon'u gerçek kimlikle yeniden yazan görev) bu satırı miras aldığı için kök dizinde var olmayan bir dosyayı hedefliyordu; harfiyen uygulansa ikinci bir OG route'u doğar, gerçek route hiç değişmez ve sayfaların `og:image`'ı eski placeholder'da kalırdı; `tests/seo/page-metadata.test.ts` bunu Task 9'da patlatırdı.

Düzeltme: tablo satırı ikiye bölündü (icon.tsx / opengraph-image.tsx), Task 9'un Files listesi, Interfaces'i, Step 1 kodu, Step 3 testinin `read(...)` yolu, Step 5-6'nın komutları ve "Bitti sayılma kriteri" 9 hep `src/app/[lang]/opengraph-image.tsx`'i ve `/opengraph-image/default` + `/tr/opengraph-image/default` URL çiftini hedefleyecek şekilde güncellendi. Yeniden yazılan Step 1 kodu `generateStaticParams`, `generateImageMetadata` (boş params fallback'i dahil) ve `OG_IMAGE_*` importlarını koruyor; yalnızca render gövdesi gerçek kimliğe (`siteConfig.person`) geçti, `alt` hâlâ `t("ogAlt")`'tan geliyor, sabit bir `export const alt` olmadı.

### 2. `global-not-found.tsx` plana hiç girmemişti

Faz 2 devir notunun "Sonraki faza (Faz 3) uyarılar" bölümünün ilk maddesi: `global-not-found.tsx` ayrı bir dokümandır, `[lang]/layout.tsx`'e eklenecek hiçbir şeyi (font className'i, tema, token, header/footer) otomatik almaz, Faz 3 ikisini birlikte düzenlemeli. Plan dosyasında bu dosyanın adı hiç geçmiyordu (`grep -c global-not-found` → 0).

Kod tarafında doğrulandı: `src/app/global-not-found.tsx` kendi `<html lang="en">` / `<body className="font-sans antialiased">`'ini kuruyor, kendi `ThemeProvider`'ını sarıyor, `globals.css`'i kendi import ediyor. `src/app/[lang]/layout.tsx` ile aynı `font-sans antialiased` sınıfını taşıyor ama Task 2'nin ekleyeceği `fontVariables` className'i yalnızca layout'a gidecekti; 404 dokümanında `--font-sans-latin` vb. tanımsız kalır, `--font-sans-stack` doğrudan sistem fontuna düşerdi.

Düzeltme: `src/app/global-not-found.tsx` Task 2'nin Files listesine eklendi (Step 4'e ikinci bir alt adım: aynı `fontVariables` importu ve `<body>` className'i orada da uygulanacak, `tests/i18n/app-shell.test.ts`'e bunu kilitleyen bir assert eklenecek). Task 3 ve Task 4 için ayrı bir kod değişikliği gerekmiyor: ikisi de yalnızca `globals.css`'teki `:root`/`.dark` token'larını ve `body`/`.eyebrow`/`.surface-panel` utility'lerini değiştiriyor, `global-not-found.tsx` `globals.css`'i zaten import ettiği için bu değişiklikler otomatik yansıyor (Task 4'ün `collectTsxFiles("src")` taraması da dosyayı zaten kapsıyor). Bu iki task'ın Files listesine yine de bir "Verify" notu eklendi ki Task 10'un görsel denetiminde 404 sayfası atlanmasın.

## Kapılar (düzeltmeden sonra, bu görevin sonunda)

Aşağıdaki komutlar bu notun sonunda, plan düzeltmesi commit'lendikten sonra çalıştırıldı; sonuçlar devir notunun "Doğrulananlar" bölümünde tutulacak final handoff'a taşınacak, burada yalnızca Task 0'ın kapı sonucu var.

## Sonraki task için not

Task 1 (font vendoring) bu düzeltmeden etkilenmiyor, doğrudan başlayabilir. Task 2 artık `src/app/global-not-found.tsx`'i de Files listesinde taşıyor; Task 9 artık doğru dosyayı hedefliyor ve `siteConfig`/`og-image.ts` bağımlılıklarını Interfaces'te adıyla listeliyor.
