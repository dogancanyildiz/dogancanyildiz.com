# Denetim takip devir notu (2 Eylül 2026, 3. tur)

Durum: Kod tarafı tamamlandı ve düzeltme turuyla birlikte bütün kapılar yeşil, dal `feature/audit-followups` (taban `8570f6a`) · Tarih: 2026-09-02 · Kaynak: 31 Ağustos incelemesinin V-2..V-18 maddeleri (`audit/acik-kalanlar.md` bölüm 9) ve o incelemenin ötesinde bulunan ek bulgular · Kapsam: 5 dosya-ayrık kümenin kod tarafı ve docs kümesinin doküman/defter tazelemesi; panel/DNS adımları ve sahibinin kararları "Sahibine kalanlar" bölümünde.

Bu not bir faz devir notu değil; 28 Ağustos denetim kapanışı ve 31 Ağustos incelemesinin ardından üçüncü çapraz kesen takip turunun kaydıdır. Aynı biçimde okunur: yürütme modeli, küme sonuçları, yeni bulgular, kapılar, sahibine kalanlar.

## Yürütme modeli

- Taban: `8570f6a`. 5 dosya-ayrık küme (frontend-perf, ui-a11y, backend, seo-i18n-content, test-quality-deps), her biri kendi git worktree'sinde kendi dalında çalıştı; küme başına bir uygulayıcı (4 opus, 1 sonnet) ve opus/sonnet inceleme + gerekirse düzeltme turu.
- Kontrol oturumu 5 dalı çakışmasız merge etti (`eda82e5` frontend-perf, `b002f24` ui-a11y, `e9261b1` backend, `568803e` seo-i18n-content, `8387b83` test-quality-deps), ardından ana ağaçta üç ek commit attı: `23b1749` (WhatsApp notu "footer" yerine "site"), `a34faf4` (next-intl `AppConfig` augmentation ile T-18'i kapattı), `4e583ed` (mesaj taraması yorumları soyuyor).
- Docs kümesi (bu not, sonnet) ayrı bir alt tur olarak çalıştı: `scripts/verify-docs.mjs`'e locale şeması koruması, yaşayan dokümanların tazelenmesi, bu devir notu ve `audit/acik-kalanlar.md` güncellemesi.
- Kurallar (hafıza notlarından): aynı ağaçta tek yazar, `git add -A` yasak, fork tabanlı inceleme skill'leri (code-review, security-review) ajanlarda yasak, uzun çizgi yok, AI imzası yok.

## Küme sonuçları

| Küme | Model | Dal / HEAD | Kapanan (kimlik) | Öne çıkan değişiklikler |
|---|---|---|---|---|
| frontend-perf | opus | `worktree-wf_6a493307-a75-1` / `d79273a` | F-039, T-36, T-12; E-07 doğrulandı (already_fixed); F-063 kabul (değişmedi) | `layout.tsx`'te `CLIENT_MESSAGE_NAMESPACES` daraltıldı ve `contact` namespace'i yalnızca `/contact`'a taşınıyor (`ROUTE_SCOPED_MESSAGE_NAMESPACES`); `untranslated` haritası yalnızca diğer locale'i listeliyor. Her sayfanın HTML'i ~4.4 KB küçüldü, shared RSC segmenti ~%20 küçüldü. |
| ui-a11y | opus | `worktree-wf_6a493307-a75-2` / `b212f6c` | V-2, V-3, V-4, V-8, V-9, V-10, V-11, V-13, V-18, T-20, T-21 | Consent geri alınabilir (`ConsentControls`, `/privacy`); banner `role="dialog"` -> `role="region"`; footer linkleri 44px, contact linkleri 24px, error butonları 44px, header marka linki `tap-target`; mobil menü odak tuzağı testle kilitli; `.pull-quote`/`--status-down` kaldırıldı; `tests/lib/contrast.ts` artık gerçekten kullanılıyor. |
| backend | opus | `worktree-wf_6a493307-a75-3` / `6cd08ae` | V-12, F-066 (kod tarafı), F-148 doğrulandı; T-24, T-25 doğrulandı (kabul) | Referer tabanlı locale tespiti yalnızca site origin'ine güveniyor; rate limit IP anahtarı normalize; honeypot string-olmayan değerleri de tuzak sayıyor; Reply-To adres-listesi ayraçlarını reddediyor; CSP raporlayıcı istek başına 20 rapor sınırı; SMTP hata kodu logda korunuyor. |
| seo-i18n-content | opus | `worktree-wf_6a493307-a75-4` / `2a6fc01` | V-5 (kabul), V-14, V-15, V-16, T-9, T-13, T-31; F-154, F-155 doğrulandı (kabul); T-18 uygulandı, sahiplik gereği geri alındı | TR kelime sayımı Unicode'a geçti (JSON-LD `wordCount` dahil, yüzde 40-47 şişikti); `localePath` artık `/tr`/`/en` önekini kendi çıktısına eklemiyor; eski yol tablosu trailing slash'i tanıyor; RSS başlıkları dile göre ayrışıyor; çeviri paritesi ve yayın tarihi artık testle kilitli. |
| test-quality-deps | sonnet | `worktree-wf_6a493307-a75-5` / `0c04c2c` | F-088, F-075, T-15; F-141, F-145, F-015, T-10, T-40 doğrulandı | `scripts/dev.mjs` iki çocuğu (`next dev`, `velite --watch`) tek yerden yönetiyor, SIGTERM/SIGKILL eskalasyonu var (yetim süreç bitti); `npm ci --ignore-scripts` + 5 native eklentinin `rebuild`'i (`Dockerfile`, `ci.yml`, `links.yml`); `.dockerignore` fixture `node_modules` ve `.velite-*`'ı dışlıyor. |

## Kontrol oturumunun ek commit'leri

- `23b1749`: WhatsApp gizlilik notunun "footer" yerine "site" demesi (contact sayfasında da bir WhatsApp linki var, footer'a özgü değil).
- `a34faf4`: next-intl `AppConfig` augmentation'ı eklendi (`src/types/next-intl.d.ts`), `contact-form.tsx`'teki `SERVER_FIELD_ERROR` `as const satisfies` oldu, `global-not-found.tsx`'teki gereksiz cast/import kaldırıldı. **T-18 bu commit'le kapandı, ama bkz. aşağıdaki "Yeni bulgular" bölümündeki regresyon.**
- `4e583ed`: `tests/messages.test.ts`'in string taraması artık blok ve tam satır yorumları taramadan önce soyuyor (satır sonu yorumları kalıyor); ui-a11y kümesinin bulduğu apostrof hatasının kalıcı düzeltmesi.

## Docs kümesinin bu turdaki işi

- **V-17 kapandı.** `scripts/verify-docs.mjs`'e `checkLocaleScheme()` eklendi: "İngilizce kökte", "İngilizce varsayılan", "EN kökte", "EN prefix'siz" gibi 2026-08-30 öncesi şemayı anlatan kalıpları, bir tarihsel işaretleyici (`Karar değişikliği`/`tarihsel`) olmadan yakalıyor; `docs/plans/**` hariç. Bu koruma, kendi taradığı ağaçta gerçekten bayat iki tablo hücresini buldu: `docs/04-i18n.md`'nin "URL stratejisi" karşılaştırma tablosu (satır 33-34) hâlâ "as-needed (EN prefix'siz, TR `/tr`) - seçilen" diyordu; 2026-08-30'da varsayılan dil tersine döndüğü için bu artık yanlış. Düzeltildi: hücreler artık dil-nötr ifade + tarihsel not taşıyor. `tests/scripts/verify-docs.test.ts`'e vaka eklendi (`STALE_LOCALE_SCHEME`, `checkLocaleScheme`, `HISTORICAL_MARKER` referansları). Kırmızı/yeşil doğrulandı: kontrolsüz bir "İngilizce kökte" satırı script'i kırıyor, marker'lı satırlar (ör. `docs/04-i18n.md:11`, `:65`) geçiyor.
- **T-42 doğrulandı, defterde kapatıldı.** `docs/deploy/coolify-kurulum.md` bölüm 5, satır 51: O-17 kararı ("Preview için ayrı `NEXT_PUBLIC_SITE_URL`") yazılı; kod tarafı zaten kapalıydı (F-042).
- **Yaşayan dokümanlar tazelendi:** `docs/00-ozet-ve-karar.md`, `docs/10-yol-haritasi.md`, `docs/03-tasarim-ui-ux.md`, `docs/05-backend-icerik-ve-servisler.md`, `docs/07-seo-ve-metadata.md` (ayrıca seo kümesinin yazdığı V-5/V-16 notlarının docs/04 ve docs/07 arasında tutarlı olduğu doğrulandı, ek değişiklik gerekmedi), `docs/09-guvenlik.md`, `docs/README.md`, `README.md`. Her birinde "Durum:" satırı 2026-09-02'ye çekildi ve o dosyayı ilgilendiren bu turun değişikliği bir paragrafla eklendi.

## Yeni bulgular

| Şiddet | Bulgu | Durum |
|---|---|---|
| **Yüksek (yeni, düzeltme turunda kapandı: `1e0e115`)** | `npm run typecheck` (tsbuildinfo temizlenmiş) `src/i18n/navigation.ts:21`'de `TS2322: Type 'string' is not assignable to type '"en" \| "tr"'` ile kırılıyordu. `a34faf4`'ün next-intl `AppConfig` augmentation'ı `Locale` tipini daraltıyor; `pathnameForLocale(locale: string, ...)` artık `getPathname`'in beklediği `Locale` tipini karşılamıyordu. `tsconfig.tsbuildinfo` incremental önbelleği bunu gizliyor (temizlenmeden koşulursa yeşil görünür), bu yüzden kontrol oturumunun "typecheck 0 hata" ölçümü yanıltıcıydı. Bu kapı CI'da gerçekten koşuyor (`.github/workflows/ci.yml:50`), `next build` ise tip kontrolü adımını hiç çalıştırmadığı için yakalamıyor. Docs kümesi src/ dışında olduğu için düzeltmedi; ledger'da **T-56**. Düzeltme turunun bulduğu düzeltme, bu satırın ilk halinde yazan tarifin aksine iki fonksiyonu kapsıyor; ayrıntı "Düzeltme turu" bölümünde. |
| Orta (ui-a11y, noted) | `tests/messages.test.ts`'in dizgi taraması yorum içindeki tek bir kesme işaretini string sınırlayıcı sanıyordu; iki kesme işaretli yorum aralarındaki her anahtarı yutuyordu. `4e583ed` ile kalıcı düzeltildi (bkz. yukarı). | kapandı |
| Düşük (frontend-perf, noted) | Marka SVG path verisi ana sayfa HTML'inin ~%25'i (52784 bayt, 17306'sı tekrar); F-063 kabul kararı hâlâ geçerli ama tazelenmiş rakamlarla (önceki tahminden büyük). Kabul kararı sahibinde yeniden değerlendirilebilir. | bilgi, T-34'e not düşüldü |
| Bilgi (çeşitli, noted, aksiyon istenmedi) | `links.yml` artık `--ignore-scripts` kullanıyor (test-quality-deps zaten kapattı); consent banner cevaplanmadan önce odaklı bir footer linkini gizleyebilir (SC 2.4.11, düşük risk); dış linklerde yeni sekme işareti yok (WCAG 3.2.5, AAA); `optimizePackageImports`'un simple-icons/radix-ui'a eklenmesi denendi, ölçülebilir kazanç yok, geri alındı; rate limiter'ın geri giden saat karşısında davranışı bilinçli olarak "fail closed". | bilgi, aksiyon istenmedi |

## Kapılar (birleşik ağaç, bu notun yazıldığı commit)

| Kapı | Sonuç |
|---|---|
| `npm run typecheck` (tsbuildinfo temiz) | **kırık**: `src/i18n/navigation.ts:21` `TS2322` (T-56, yukarıda). Düzeltme turunda kapandı, güncel ölçüm "Düzeltme turu" bölümünde |
| `npm run lint` | temiz, `--max-warnings=0` |
| `npm test` | 75 dosya / 1080 test yeşil |
| `npm run format` | temiz |
| `npm run verify:docs` | 21 dosya, yeni locale şeması kontrolü dahil |

Not: docs kümesinin kendi görev tanımı yalnızca `verify:docs`, `format` ve `tests/scripts`'i kapı olarak istiyordu; typecheck bu doğrulama sırasında keşfedildi ve ayrıca koşuldu, çünkü ledger'a "T-18 kapandı" yazmadan önce iddiayı doğrulamak gerekiyordu.

## Görsel onay isteyen değişiklikler (sahibin gözden geçirmesi gerekir)

- **Footer 44px'e çıktı (V-4, ui-a11y notesForMerge).** `footerTextLinkClass` `min-h-6` (24px) yerine `tap-target` (44px); sayfa-linkleri ve elsewhere sütunları satır başına ~20px büyüdü, footer belirgin şekilde uzadı. Alternatif (satır arası gap yerine per-row min-height) istenirse `tests/accessibility.test.ts`'teki floor da güncellenmeli.
- **Consent banner `role="region"` oldu (V-9).** Görsel değişiklik yok (davranış zaten dialog değildi), ama ekran okuyucu duyurusu değişti.
- **Contact sayfası e-posta/WhatsApp linkleri 4px büyüdü** (20px -> 24px), **error sayfasının iki butonu 8px büyüdü** (36px -> 44px).

## Sahibine kalanlar

- **Panel/DNS (değişmedi):** Uptime Kuma kurulumu + `/api/health` monitörü, merkezi Umami'ye site kaydı ve `UMAMI_WEBSITE_ID`, `SMTP_*` env'leri ve `contact@` uygulama parolası, `NEXT_PUBLIC_STATUS_URL`, origin'in Cloudflare'a kilitlenmesi, `TRUST_CF_CONNECTING_IP=true` (yalnızca kilitten SONRA), `.sh` alan adı kararı.
- **P-5 (backend kümesinin notu):** rate limit IP anahtarı artık canonical, ama Cloudflare'ın arkasındaki tek edge adresi hâlâ paylaşılıyor; gerçek düzeltme origin kilidi + `TRUST_CF_CONNECTING_IP=true`.
- **F-063 / T-34 (kabul, sahipte yeniden değerlendirme seçeneği):** marka SVG'lerinin `<symbol>`/`<use>` ile tekilleştirilmesi hâlâ yapılmadı; taze ölçüm ana sayfa HTML'inin ~%25'inin tekrar eden path verisi olduğunu gösteriyor.
- **Görsel onaylar:** yukarıdaki "Görsel onay isteyen değişiklikler" bölümü.

## Düzeltme turu (2026-09-02, opus, ana ağaç)

Bu bölüm notun ilk hali yazıldıktan sonra ana ağaçta koşan düzeltme turunun kaydı. Bağımsız doğrulama iki bloklayan bulgu bıraktı: T-56'nın kendisi (dal bu haliyle CI'da yeşile dönemezdi) ve T-56 için hem bu notta hem defterde yazılı olan yanlış düzeltme tarifi.

- **T-56 kapandı (`1e0e115`).** Zincirde bir değil iki `string` kapısı var. `src/lib/seo/alternates.ts:36` `localePath(locale: string, path: string)` kendi parametresini doğrudan `pathnameForLocale`'e geçiriyor, yani yalnızca `pathnameForLocale` daraltılırsa `tsc` aynı sınıftan bir hatayı `alternates.ts:40`'ta veriyor (`TS2345: Argument of type 'string' is not assignable to parameter of type '"en" | "tr"'`). Bu izole bir kopyada ölçüldü. İkisi birlikte daraltıldı: `pathnameForLocale(locale: AppLocale, href: string)` (`src/i18n/navigation.ts`, `AppLocale` `./routing`'den) ve `localePath(locale: Locale, path: string)` (`alternates.ts`, `Locale` zaten `@/lib/content`'ten import ediliyordu). Gerçek çağıranlar (`global-not-found.tsx:86`, `footer.tsx:33`, `status-screen.tsx:45` ve `:50`, `language-switcher.tsx:48`, `absoluteUrl`) zaten dar tip taşıyor, hiçbir çağrı yeri değişmedi.
- **Yanlış tarif düzeltildi.** Notun "Yeni bulgular" satırı ve `audit/acik-kalanlar.md` T-56 satırı "çağıranlar (`language-switcher.tsx`, `alternates.ts`) zaten doğru tipte değer veriyor" diyordu. `alternates.ts` doğru tipte değer veren bir çağıran değil, zincirdeki ikinci `string` kapısı. Tarif olduğu gibi uygulansaydı bir sonraki oturum kapıyı yine kırmızı bulurdu. İki yer de düzeltildi.
- **Regresyon testi eklendi.** `tsconfig.json`'ın `include`'u test dosyalarını da kapsıyor, bu yüzden `tests/i18n/navigation.test.ts` ve `tests/seo/alternates.test.ts` her iki yardımcının ilk parametresini derleme zamanında kilitleyen bir koşullu tip taşıyor: parametre yeniden `string`'e genişletilirse koşullu `false`'a düşer ve atama derlenmez. Kırmızı/yeşil doğrulandı: iki imza geçici olarak `string`'e döndürüldüğünde `tsc` dört hata verdi (özgün `TS2322` + `TS6133` + iki testin `TS2322`'si), geri alındığında sıfır hata.

Düzeltme turunun kapıları (`1e0e115`, tsbuildinfo silinerek koşuldu):

| Kapı | Sonuç |
|---|---|
| `npm run typecheck` | temiz, 0 hata |
| `npm run lint` | temiz, `--max-warnings=0` |
| `npm test` | 75 dosya / 1083 test yeşil |
| `npm run format` | temiz |
| `npm run build` | başarılı |
| `npm run verify:routes` | 38 içerik rotası prerender edildi (en: 5 proje, 3 yazı; tr: 5 proje, 3 yazı) |
| `npm run verify:docs` | temiz |

## İlgili dosyalar

- `audit/acik-kalanlar.md` bölüm 11 ("2 Eylül 3. tur"): bu turun tam kimlik listesi (gitignore'da, yerel defter).
- `scripts/verify-docs.mjs`, `tests/scripts/verify-docs.test.ts` (V-17).
- `src/i18n/navigation.ts`, `src/lib/seo/alternates.ts`, `tests/i18n/navigation.test.ts`, `tests/seo/alternates.test.ts` (T-56, düzeltme turu).
- `docs/04-i18n.md` (satır 33-34), `docs/00-ozet-ve-karar.md`, `docs/10-yol-haritasi.md`, `docs/03-tasarim-ui-ux.md`, `docs/05-backend-icerik-ve-servisler.md`, `docs/07-seo-ve-metadata.md`, `docs/09-guvenlik.md`, `docs/README.md`, `README.md`: bu turda tazelenen yaşayan dokümanlar.
