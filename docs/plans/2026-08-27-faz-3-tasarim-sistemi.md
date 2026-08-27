# Faz 3: Tasarım sistemi (tipografi, palet, layout, hareket, erişilebilirlik) Implementation Plan


> Durum: Uygulandı, PR #5 merge edildi (main). Devir notu: handoffs/faz-3.md
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Siteye gerçekten yüklenen üç fontlu bir tipografi sistemi, nötr bir renk paleti, mobilde gezilebilir bir navigasyon, sınırlı ve `prefers-reduced-motion` saygılı bir hareket katmanı ve WCAG 2.2 AA hedef boyutu/odak halkası/canlı bölge düzeltmeleri kazandırmak.

**Architecture:** Üç `@fontsource*` paketinden woff2 dosyaları tek seferlik bir script ile `src/fonts/` altına kopyalanıp repoya commit edilir ve `next/font/local` ile yüklenir; her aile için `latin` ve `latin-ext` alt kümeleri ayrı `@font-face` olarak `unicode-range` ile tanımlanır, böylece TR karakterleri fallback fonta düşmez. `globals.css`'teki `:root` / `.dark` token blokları 03-tasarim-ui-ux.md'deki nötr hex değerlerinin oklch karşılığına geçirilir ve emerald yalnızca `--primary`, `--ring` ve status token'larında kalır. Hareket katmanı `LazyMotion` + `m` (`domAnimation`) ile tek bir provider'ın altına alınır, tüm varyantlar `src/lib/motion.ts`'teki paylaşılan fabrikalardan gelir.

**Tech Stack:** Next.js 16.3.3 (App Router, `output: 'standalone'`), React 19.2.x, Tailwind CSS 4.3.x, next-intl 4.13.7, motion 13.1.1 (`motion/react`, `motion/react-m`), radix-ui 1.4.3 (Dialog), next-themes, vitest (node environment), `@fontsource-variable/geist@5.3.0`, `@fontsource-variable/geist-mono@5.3.0`, `@fontsource/instrument-serif@5.3.0`.

**Spec:**
- `docs/03-tasarim-ui-ux.md` (ana spec: palet tablosu, tipografi kuralları, layout, hareket, erişilebilirlik)
- `docs/01-mevcut-durum-denetimi.md` (F1, F4, F5, F6, F9, B10 bulguları ve dosya:satır kanıtları)
- `docs/10-yol-haritasi.md` (Faz 3 checklist'i ve bitti sayılma kriteri)
- `docs/00-ozet-ve-karar.md` (stack ve sürüm kararları)
- `docs/04-i18n.md` (Faz 2 çıktısı: `app/[lang]`, `src/i18n/*`, `messages/*.json`, latin-ext zorunluluğu)
- `.local/content/portfolio-content.md` (gerçek isim ve unvan; yalnızca OG/icon metinleri için kullanılır)

## Global Constraints

- next 16.3.3 (Active LTS), react 19.2.x, tailwindcss 4.3.x, next-intl 4.13.7, velite 0.4.0 (EXACT pin, caret yok), motion 13.1.1 (import: motion/react), node 24 (.nvmrc), package.json engines.node ">=20.9", npm (lockfile commit edilir).
- Paket yöneticisi npm; script'ler: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run), format (prettier --check).
- Test aracı: vitest (node environment) lib/ ve app/api kodu için; UI için build çıktısı ve curl tabanlı doğrulama. Faz 0 vitest'i kurar, sonraki fazlar kullanır.
- output: 'standalone'; edge runtime kullanılmaz; next/image remotePatterns TANIMLANMAZ; next/font/google KULLANILMAZ (woff2 vendor + next/font/local).
- URL şeması: EN kökte (/, /about), TR /tr altında; localeDetection kapalı; çevirisi olmayan içerik diğer dilin sitemap/hreflang'ına girmez.
- İçerik: .local/content/portfolio-content.md gerçek kaynak; "Alex Chen", example.com, alex@example.com, placeholder sosyal link ve CSS gradyan kapak yayına çıkmaz. Görseli olmayan proje kapaksız yayınlanır.
- Metin üslubu (EN ve TR site metinleri, commit mesajları, yorumlar): uzun çizgi (em dash) ve en dash kullanılmaz; kısa çizgi, virgül, iki nokta kullanılır.
- Commit mesajları Conventional Commits (feat:, fix:, chore:, refactor:, docs:), gövde İngilizce, AI atıf/co-author satırı ASLA eklenmez.
- Güvenlik: RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL, GATUS_URL yalnızca Runtime env; NEXT_PUBLIC_SITE_URL Build env. .local/, .nodeterm/, .env* Docker build context'ine girmez. Gerçek IP CF-Connecting-IP'den, yalnızca Cloudflare IP aralıklarından gelen istekte güvenilir.
- Cloudflare proxied (turuncu bulut) + Full (strict) önde; dogancanyildiz.com -> dogancanyildiz.sh 301 Cloudflare Redirect Rule ile (tek atlama, path korunur).
- Her faz tek dal (feature/faz-N-slug), tek PR; faz bitiş kriteri planın sonunda "Bitti sayılma kriteri" olarak yer alır ve doğrulama komutları içerir.

## Faz 2'den devralınan arayüzler (bu plan bunları var kabul eder)

Bu faz Faz 2 (i18n yeniden mimarisi) merge edildikten sonra başlar. Aşağıdakiler Faz 2'nin ürettiği ve Faz 3'ün tükettiği arayüzlerdir. Dal açılmadan önce her biri `ls` / `grep` ile doğrulanır (Task 0).

| Arayüz | İmza / şekil |
|---|---|
| `src/i18n/routing.ts` | `export const routing = defineRouting({ locales: ["en","tr"], defaultLocale: "en", localePrefix: "as-needed" })` |
| `src/i18n/navigation.ts` | `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)` |
| `src/i18n/request.ts` | `export default getRequestConfig(async ({ requestLocale }) => ...)` |
| `src/app/[lang]/layout.tsx` | Kök layout. `<html lang={lang}>` ve `<body>` bu dosyadadır, `src/app/layout.tsx` yoktur. `generateStaticParams` + `setRequestLocale` çağırır. |
| `messages/en.json`, `messages/tr.json` | `src/lib/i18n/translations.ts`'teki anahtar ağacının birebir taşınmış hali (`nav.home`, `brand`, `hero.*`, `footer.*`, `projects.*`, `form.*`, `contact.*`, `metadata.*`). |
| Bileşenlerde çeviri | `const t = useTranslations()` (kök scope), tam nokta yolu ile çağrı: `t("nav.home")`. Server tarafında `getTranslations({ locale, namespace })`. |
| `src/app/icon.tsx` | `app` kökünde, locale bağımsız, statik prerender (`/icon`). |
| `src/app/[lang]/opengraph-image.tsx` | `[lang]` altında, **locale bağımlı**: `generateStaticParams` (`routing.locales`) + `generateImageMetadata` üretir, ikincisi Next tarafından önce boş `params` ile çağrıldığı için `hasLocale` ile `routing.defaultLocale`'e düşen bir fallback taşır. `size` / `contentType` / görsel id'si `src/lib/seo/og-image.ts`'teki `OG_IMAGE_SIZE` / `OG_IMAGE_CONTENT_TYPE` / `OG_IMAGE_ID`'den gelir, `alt` `getTranslations({ locale, namespace: "metadata" })` ile `t("ogAlt")`'tan üretilir. Build çıktısında `/[lang]/opengraph-image/[__metadata_id__]` olarak görünür, çalışan sunucuda `/opengraph-image/default` (EN, prefix'siz) ve `/tr/opengraph-image/default` (TR) olarak yayınlanır. `src/app/opengraph-image.tsx` (kökte) YOKTUR; kökte böyle bir dosya oluşturmak ikinci bir OG route'u doğurur ve `buildOpenGraph`'ın işaret ettiği `OG_IMAGE_PATH` ile uyuşmaz. |
| `src/app/global-not-found.tsx` | `app` kökünde, locale bağımsız ayrı bir doküman: kendi `<html lang="en">` / `<body className="font-sans antialiased">`'ini kurar, `globals.css`'i kendi import eder, kendi `ThemeProvider`'ını sarar, `next.config.ts`'teki `experimental.globalNotFound: true` ile açılır. `[lang]/layout.tsx`'e eklenecek hiçbir şeyi (font className'i, tema, yeni token, header/footer) otomatik almaz; bu fazın font ve zemin katmanı görevleri (Task 2, Task 4) bu dosyayı da hesaba katmalı (Faz 2 devir notu, "Sonraki faza uyarılar" madde 1). |
| Silinmiş dosyalar | `src/components/locale-provider.tsx`, `src/lib/i18n/translations.ts`, `src/lib/i18n/use-translation.ts`, `src/app/layout.tsx`, `src/app/{about,contact,projects}/layout.tsx` |
| Faz 0 çıktısı | `motion@13.1.1` kurulu, tüm importlar `motion/react`; `vitest` kurulu, `npm test` = `vitest run`, `vitest.config.ts` içindeki include deseni `["src/**/*.test.ts", "tests/**/*.test.ts"]` (Faz 0 birinciyi, Faz 1 ikinciyi ekledi). Bu fazın testleri `tests/` altına yazılır. |

> **Task 0 düzeltmesi (2026-08-27):** Yukarıdaki tablo dal açılmadan önce `ls` ile yeniden doğrulandı ve iki hata bulundu, ikisi de bu revizyonda düzeltildi: (1) `src/app/opengraph-image.tsx` diye bir dosya yok, gerçek OG route'u `src/app/[lang]/opengraph-image.tsx`'te ve locale bağımlı, bu yüzden Task 9'un dosya hedefi ve kodu da güncellendi; (2) `src/app/global-not-found.tsx` bu tabloda hiç yoktu, Faz 2 devir notunun bağlayıcı uyarısına rağmen Task 2 ve Task 4'ün Files listelerine girmemişti, ikisi de eklendi. Ayrıntı: `docs/plans/handoffs/faz-3-notlar.md`.

---

### Task 0: Dalı aç ve devralınan arayüzleri doğrula

**Files:**
- Modify: yok (yalnızca doğrulama)

**Interfaces:**
- Consumes: Faz 2'nin merge edilmiş `main` dalı
- Produces: `feature/faz-3-tasarim-sistemi` dalı

- [ ] **Step 1: main'i güncelle ve faz dalını aç**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git checkout main
git pull --ff-only
git checkout -b feature/faz-3-tasarim-sistemi
```

- [ ] **Step 2: Faz 2 arayüzlerinin varlığını doğrula**

```bash
ls src/i18n/routing.ts src/i18n/navigation.ts src/i18n/request.ts
ls src/app/\[lang\]/layout.tsx
ls messages/en.json messages/tr.json
test ! -f src/app/layout.tsx && echo "root layout removed: OK"
grep -c "createNavigation" src/i18n/navigation.ts
```

Beklenen: altı dosya listeleniyor, `root layout removed: OK` yazıyor, son komut `1` döndürüyor.

- [ ] **Step 3: Faz 0 çıktısının yerinde olduğunu doğrula**

```bash
node -p "require('./package.json').dependencies.motion"
node -p "require('./package.json').scripts.test"
grep -rn "framer-motion" src/ || echo "no framer-motion imports: OK"
```

Beklenen: `13.1.1`, `vitest run`, `no framer-motion imports: OK`.

- [ ] **Step 4: Temiz başlangıç kapısı**

```bash
npm run typecheck && npm run lint && npm test
```

Beklenen: üçü de exit 0. Herhangi biri kırmızıysa Faz 3 başlamaz, önce Faz 2 dalına dönülür.

---

### Task 1: Font dosyalarını repoya vendor et

**Files:**
- Create: `scripts/vendor-fonts.mjs`
- Create: `src/fonts/index.ts`
- Create (script üretir, commit edilir): `src/fonts/geist-latin.woff2`, `src/fonts/geist-latin-ext.woff2`, `src/fonts/geist-mono-latin.woff2`, `src/fonts/geist-mono-latin-ext.woff2`, `src/fonts/instrument-serif-latin.woff2`, `src/fonts/instrument-serif-latin-ext.woff2`, `src/fonts/LICENSE-geist.txt`, `src/fonts/LICENSE-geist-mono.txt`, `src/fonts/LICENSE-instrument-serif.txt`, `public/fonts/og/instrument-serif-latin.woff`, `public/fonts/og/instrument-serif-latin-ext.woff`
- Modify: `package.json`
- Test: `tests/fonts.test.ts`

**Interfaces:**
- Consumes: yok
- Produces:
  - `src/fonts/index.ts` -> `export const geistSans: NextFontWithVariable`, `geistSansExt`, `geistMono`, `geistMonoExt`, `instrumentSerif`, `instrumentSerifExt`, `export const fontVariables: string`
  - CSS değişken adları: `--font-sans-latin`, `--font-sans-ext`, `--font-mono-latin`, `--font-mono-ext`, `--font-display-latin`, `--font-display-ext`
  - `npm run vendor:fonts` script'i

**Neden bu tasarım:** `next/font/local`'ın `src` dizisindeki her girdi yalnızca `path`, `weight`, `style` kabul eder, `unicode-range` kabul etmez (Next kaynağındaki `LocalFont` tipi). Aynı aile adı altında iki dosyayı `unicode-range` olmadan tanımlamak, tarayıcının aile içi glif fallback'ine güvenmek demektir ve bu davranış garantili değildir. Bu yüzden her alt küme AYRI bir `localFont()` çağrısıdır, kendi `declarations: [{ prop: "unicode-range", ... }]` bloğunu alır ve `globals.css`'teki font yığınında sırayla dizilir. `adjustFontFallback: false` zorunludur: açık bırakılırsa Next her aile için `unicode-range`'siz, metrik uyarlanmış bir Arial fallback yüzü üretir ve bu yüz `latin-ext` yüzüne sıra gelmeden ğ/İ/ş gliflerini yakalar.

**Rol sayısı üç, yükleyici sayısı altı:** Tasarım kararı üç font rolü tanımlıyor (sans, mono, display). Bu roller `globals.css`'te `--font-sans-stack`, `--font-mono-stack`, `--font-display-stack` olarak kalır ve `@theme inline` üzerinden Tailwind'in `font-sans` / `font-mono` / `font-display` utility'lerine bağlanır, yani bileşenler hâlâ üç isim görür. Altı `localFont()` çağrısı ve altı `--font-*-latin` / `--font-*-ext` değişkeni yalnızca bu üç yığının içindeki uygulama detayıdır; bir rol bir yığın, bir yığın iki yüz.

- [ ] **Step 1: Font paketlerini exact pin ile devDependency olarak kur**

```bash
npm install --save-dev --save-exact @fontsource-variable/geist@5.3.0 @fontsource-variable/geist-mono@5.3.0 @fontsource/instrument-serif@5.3.0
```

Paketler devDependency olarak kalır (runtime'da kullanılmazlar), böylece vendor edilen dosyalar istendiğinde yeniden üretilip karşılaştırılabilir.

- [ ] **Step 2: Vendor script'ini yaz**

`scripts/vendor-fonts.mjs`:

```js
// One-off vendoring script. Not a postinstall hook: the copied woff2/woff files
// are committed to the repository so the Docker build never needs the font
// packages or any network access.
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = join(projectRoot, "src", "fonts");
const ogFontsDir = join(projectRoot, "public", "fonts", "og");

const WOFF2 = [
  ["@fontsource-variable/geist/files/geist-latin-wght-normal.woff2", "geist-latin.woff2"],
  ["@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2", "geist-latin-ext.woff2"],
  ["@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2", "geist-mono-latin.woff2"],
  ["@fontsource-variable/geist-mono/files/geist-mono-latin-ext-wght-normal.woff2", "geist-mono-latin-ext.woff2"],
  ["@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", "instrument-serif-latin.woff2"],
  ["@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-normal.woff2", "instrument-serif-latin-ext.woff2"],
];

// satori (next/og) cannot read woff2, so the OG image gets woff copies.
const WOFF = [
  ["@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff", "instrument-serif-latin.woff"],
  ["@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-normal.woff", "instrument-serif-latin-ext.woff"],
];

const LICENSES = [
  ["@fontsource-variable/geist/LICENSE", "LICENSE-geist.txt"],
  ["@fontsource-variable/geist-mono/LICENSE", "LICENSE-geist-mono.txt"],
  ["@fontsource/instrument-serif/LICENSE", "LICENSE-instrument-serif.txt"],
];

function copyAll(entries, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const [specifier, targetName] of entries) {
    const source = require.resolve(specifier);
    const target = join(targetDir, targetName);
    copyFileSync(source, target);
    console.log(`${targetName} <- ${specifier} (${statSync(target).size} bytes)`);
  }
}

copyAll(WOFF2, fontsDir);
copyAll(LICENSES, fontsDir);
copyAll(WOFF, ogFontsDir);
console.log(`Vendored ${WOFF2.length + LICENSES.length} files into src/fonts and ${WOFF.length} into public/fonts/og.`);
```

- [ ] **Step 3: package.json'a script ekle**

`package.json` içindeki `"scripts"` bloğuna ekle:

```json
"vendor:fonts": "node scripts/vendor-fonts.mjs"
```

- [ ] **Step 4: Script'i çalıştır**

Run: `npm run vendor:fonts`

Beklenen çıktı (bayt sayıları birebir bu olmalı):

```
geist-latin.woff2 <- @fontsource-variable/geist/files/geist-latin-wght-normal.woff2 (29404 bytes)
geist-latin-ext.woff2 <- @fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2 (16512 bytes)
...
Vendored 9 files into src/fonts and 2 into public/fonts/og.
```

Bayt sayıları paket sürümüne bağlıdır; kritik olan 11 dosyanın da sıfırdan büyük olması ve hata çıkmamasıdır.

- [ ] **Step 5: Dosyaların git tarafından ignore edilmediğini doğrula**

```bash
git check-ignore -v src/fonts/geist-latin.woff2 public/fonts/og/instrument-serif-latin.woff || echo "not ignored: OK"
```

Beklenen: `not ignored: OK`. Eğer bir kural eşleşirse `.gitignore`'a `!src/fonts/*.woff2` ve `!public/fonts/og/*.woff` negatif kuralları eklenir.

- [ ] **Step 6: Font modülünü yaz**

`src/fonts/index.ts`:

```ts
import localFont from "next/font/local";

// Subset ranges copied verbatim from the fontsource packages' unicode.json.
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

// Each subset is its own localFont() call because next/font/local accepts
// unicode-range only per font loader, never per src entry. adjustFontFallback is
// off everywhere: an auto generated Arial fallback face has no unicode-range and
// would swallow the Turkish glyphs before the latin-ext face is reached.
export const geistSans = localFont({
  src: "./geist-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const geistSansExt = localFont({
  src: "./geist-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const geistMono = localFont({
  src: "./geist-mono-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const geistMonoExt = localFont({
  src: "./geist-mono-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-mono-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const instrumentSerif = localFont({
  src: "./instrument-serif-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-latin",
  preload: true,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN }],
});

export const instrumentSerifExt = localFont({
  src: "./instrument-serif-latin-ext.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-display-ext",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: LATIN_EXT }],
});

export const fontVariables = [
  geistSans.variable,
  geistSansExt.variable,
  geistMono.variable,
  geistMonoExt.variable,
  instrumentSerif.variable,
  instrumentSerifExt.variable,
].join(" ");
```

- [ ] **Step 7: Başarısız testi yaz**

`tests/fonts.test.ts`:

```ts
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const VENDORED_WOFF2 = [
  "src/fonts/geist-latin.woff2",
  "src/fonts/geist-latin-ext.woff2",
  "src/fonts/geist-mono-latin.woff2",
  "src/fonts/geist-mono-latin-ext.woff2",
  "src/fonts/instrument-serif-latin.woff2",
  "src/fonts/instrument-serif-latin-ext.woff2",
];

const VENDORED_OG_WOFF = [
  "public/fonts/og/instrument-serif-latin.woff",
  "public/fonts/og/instrument-serif-latin-ext.woff",
];

describe("vendored fonts", () => {
  it.each(VENDORED_WOFF2)("%s exists and is a real woff2 file", (relative) => {
    const file = join(root, relative);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(5000);
    // woff2 magic number: "wOF2"
    expect(readFileSync(file).subarray(0, 4).toString("latin1")).toBe("wOF2");
  });

  it.each(VENDORED_OG_WOFF)("%s exists and is a real woff file", (relative) => {
    const file = join(root, relative);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(5000);
    // woff magic number: "wOFF"
    expect(readFileSync(file).subarray(0, 4).toString("latin1")).toBe("wOFF");
  });

  it("ships the OFL licence next to the vendored files", () => {
    for (const name of [
      "LICENSE-geist.txt",
      "LICENSE-geist-mono.txt",
      "LICENSE-instrument-serif.txt",
    ]) {
      expect(existsSync(join(root, "src", "fonts", name))).toBe(true);
    }
  });

  it("declares one unicode-range per subset and disables the auto fallback", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).toContain("U+0100-02BA");
    expect(source).toContain("U+0131");
    expect(source.match(/adjustFontFallback: false/g)).toHaveLength(6);
    expect(source.match(/prop: "unicode-range"/g)).toHaveLength(6);
    for (const variable of [
      "--font-sans-latin",
      "--font-sans-ext",
      "--font-mono-latin",
      "--font-mono-ext",
      "--font-display-latin",
      "--font-display-ext",
    ]) {
      expect(source).toContain(variable);
    }
  });

  it("never reaches for next/font/google", () => {
    const source = readFileSync(join(root, "src", "fonts", "index.ts"), "utf8");
    expect(source).not.toContain("next/font/google");
  });
});
```

- [ ] **Step 8: Testi çalıştır**

Run: `npm test -- tests/fonts.test.ts`
Beklenen: PASS, 11 test.

Eğer Step 4 atlanmışsa: FAIL, "expected false to be true" (dosya yok).

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Beklenen: exit 0. (`src/fonts/index.ts` henüz hiçbir yerden import edilmiyor, bu normal.)

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json scripts/vendor-fonts.mjs src/fonts public/fonts/og tests/fonts.test.ts
git commit -m "feat(fonts): vendor Geist, Geist Mono and Instrument Serif woff2 subsets

Copy latin and latin-ext woff2 files from the fontsource packages into
src/fonts with a one-off script instead of a postinstall hook, so the Docker
build never needs network access or the font packages themselves. Each subset
gets its own next/font/local loader with an explicit unicode-range, which keeps
Turkish glyphs (g-breve, dotted capital I, s-cedilla) on the real typeface.
Instrument Serif also ships as woff under public/fonts/og because satori cannot
read woff2."
```

---

### Task 2: Fontları layout'a ve token yığınına bağla, ölü `--font-fraunces` referansını kaldır

**Files:**
- Modify: `src/app/[lang]/layout.tsx`
- Modify: `src/app/global-not-found.tsx` (`<body>` className'ine `fontVariables` eklenir; bu dosya `[lang]/layout.tsx`'ten ayrı bir doküman olduğu için font className'ini kalıtım yoluyla almaz, bkz. Faz 2 devir notu "Sonraki faza uyarılar" madde 1)
- Modify: `src/app/globals.css:51-56` (font stack değişkenleri), `src/app/globals.css:157-163` (h1-h4 kuralı)
- Test: `tests/design-tokens.test.ts`
- Modify: `tests/i18n/app-shell.test.ts` (404 dokümanının da `fontVariables` taşıdığını kilitleyen assert eklenir; bu dosya zaten `globals.css` importunu kilitliyor)

**Interfaces:**
- Consumes: `fontVariables: string` (`@/fonts`)
- Produces:
  - `--font-sans-stack`, `--font-mono-stack`, `--font-display-stack` (`:root`) artık vendor edilmiş ailelerle başlıyor
  - `@theme inline` eşlemesi değişmediği için `font-sans` / `font-mono` / `font-display` Tailwind utility'leri aynı adlarla çalışmaya devam ediyor
  - `.pull-quote` utility sınıfı

- [ ] **Step 1: Font yığınlarını globals.css'te güncelle**

`src/app/globals.css`, `:root` bloğunun ilk beş satırını (mevcut `--font-sans-stack` / `--font-display-stack` / `--font-mono-stack` tanımları) şununla değiştir:

```css
  /* Vendored faces first, latin then latin-ext, then the system fallbacks.
     The two vendored faces carry disjoint unicode-range declarations, so the
     browser resolves Turkish glyphs on the -ext family instead of dropping to
     a system font. */
  --font-sans-stack: var(--font-sans-latin), var(--font-sans-ext), ui-sans-serif,
    system-ui, "Segoe UI", sans-serif;
  --font-display-stack: var(--font-display-latin), var(--font-display-ext),
    "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  --font-mono-stack: var(--font-mono-latin), var(--font-mono-ext), ui-monospace,
    "SFMono-Regular", "SF Mono", Consolas, monospace;
```

- [ ] **Step 2: h1-h4 kuralını düzelt**

`src/app/globals.css`'te `@layer base` içindeki şu bloğu:

```css
  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-fraunces);
    letter-spacing: -0.03em;
  }
```

şununla değiştir:

```css
  /* Instrument Serif is a single weight display face: it only holds up at h1
     and pull quote size. Everything below h1 stays on Geist Sans. */
  h1 {
    font-family: var(--font-display-stack);
    font-weight: 400;
    letter-spacing: -0.02em;
  }
  h2,
  h3,
  h4 {
    font-family: var(--font-sans-stack);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
```

`var(--font-display-stack)` bilerek kullanılıyor, `var(--font-display)` değil: `@theme inline` altındaki tema değişkenleri yalnızca bir utility tarafından kullanıldıklarında CSS çıktısına yazılır, `--font-display-stack` ise `:root`'ta her zaman tanımlı.

- [ ] **Step 3: pull-quote utility'sini ekle**

`src/app/globals.css`'te `@layer utilities` bloğunun sonuna, `.section-copy` tanımından sonra ekle:

```css
  .pull-quote {
    @apply font-display text-2xl leading-snug text-foreground sm:text-3xl;
  }
```

- [ ] **Step 4: Fontları layout'a ve 404 dokümanına bağla**

`src/app/[lang]/layout.tsx` içinde import bloğuna ekle:

```ts
import { fontVariables } from "@/fonts";
```

ve `<body>` etiketini şununla değiştir:

```tsx
      <body className={`${fontVariables} font-sans antialiased`}>
```

`src/app/global-not-found.tsx` kendi `<html>`/`<body>`'sini kurduğu için aynı değişiklik orada da tekrarlanmak zorunda, aksi halde 404 dokümanında `--font-sans-latin` tanımsız kalır ve `--font-sans-stack` doğrudan `ui-sans-serif, system-ui` fallback'ine düşer. Aynı import satırını ekle ve:

```tsx
      <body className="font-sans antialiased">
```

satırını şununla değiştir:

```tsx
      <body className={`${fontVariables} font-sans antialiased`}>
```

- [ ] **Step 5: Testi yaz**

`tests/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("typography tokens", () => {
  it("has no dangling --font-fraunces reference", () => {
    expect(css).not.toContain("--font-fraunces");
  });

  it("puts the vendored faces at the head of every font stack", () => {
    expect(css).toMatch(/--font-sans-stack:\s*var\(--font-sans-latin\),\s*var\(--font-sans-ext\)/);
    expect(css).toMatch(/--font-mono-stack:\s*var\(--font-mono-latin\),\s*var\(--font-mono-ext\)/);
    expect(css).toMatch(/--font-display-stack:\s*var\(--font-display-latin\),\s*var\(--font-display-ext\)/);
  });

  it("reserves the serif display face for h1 and the pull quote", () => {
    expect(css).toMatch(/h1\s*\{[^}]*font-family:\s*var\(--font-display-stack\)/);
    expect(css).toMatch(/h2,\s*\n\s*h3,\s*\n\s*h4\s*\{[^}]*font-family:\s*var\(--font-sans-stack\)/);
    expect(css).toContain(".pull-quote");
  });
});
```

`tests/i18n/app-shell.test.ts`'e (Faz 2'nin bu dosyayı `globals.css` importunu kilitlemek için kullandığı yerin yanına, dosyanın kendi `read` yardımcısıyla) 404 dokümanının vendor edilmiş fontları da taşıdığını kilitleyen bir assert ekle:

```ts
describe("global-not-found font parity", () => {
  it("carries the same vendored font className the [lang] layout uses", () => {
    const source = read("src/app/global-not-found.tsx");
    expect(source).toContain('import { fontVariables } from "@/fonts"');
    expect(source).toMatch(/className=\{`\$\{fontVariables\}/);
  });
});
```

- [ ] **Step 6: Testi çalıştır**

Run: `npm test -- tests/design-tokens.test.ts tests/i18n/app-shell.test.ts`
Beklenen: `design-tokens.test.ts` PASS 3 test, `app-shell.test.ts` içindeki yeni `global-not-found font parity` bloğu dahil tüm suite PASS.

- [ ] **Step 7: Build ile fontların gerçekten yüklendiğini doğrula**

```bash
npm run build
grep -rl "font-sans-latin" .next/static/css/ | head -1
grep -o "unicode-range:[^;]*" .next/static/css/*.css | sort -u | head -4
```

Beklenen: en az bir CSS dosyası listeleniyor ve `unicode-range` çıktısı hem `U+0000-00FF` hem `U+0100-02BA` içeren en az iki farklı satır veriyor.

```bash
ls .next/static/media/*.woff2 | wc -l
```

Beklenen: `6`.

- [ ] **Step 8: Google Fonts isteği olmadığını doğrula**

```bash
grep -rn "fonts.googleapis.com\|fonts.gstatic.com\|next/font/google" src/ .next/static/css/ || echo "no google fonts: OK"
```

Beklenen: `no google fonts: OK`.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css "src/app/[lang]/layout.tsx" src/app/global-not-found.tsx tests/design-tokens.test.ts tests/i18n/app-shell.test.ts
git commit -m "fix(typography): load the vendored faces and drop the dead --font-fraunces token

globals.css pointed h1-h4 at a --font-fraunces custom property that was never
defined anywhere, so every heading silently fell back to the system sans stack.
Wire the six next/font/local variables into body, put them at the head of the
three font stacks and give the serif face the h1 and pull quote roles only,
since Instrument Serif ships a single 400 weight. global-not-found.tsx gets the
same fontVariables className: it renders its own html and body outside the
[lang] layout, so it would otherwise keep falling back to the system stack."
```

---

### Task 3: Token bloklarını nötr palete geçir

**Files:**
- Modify: `src/app/globals.css:7-49` (`@theme inline`, status renkleri eklenir), `src/app/globals.css:51-89` (`:root`), `src/app/globals.css:91-123` (`.dark`)
- Test: `tests/design-tokens.test.ts`
- Verify (kod değişikliği yok): `src/app/global-not-found.tsx` bu dosyayı kendi import ettiği için (`import "./globals.css"`) `:root`/`.dark` token değişiklikleri buraya da otomatik yansır, ayrı bir düzenleme gerekmez; Task 10'un görsel denetimi 404 sayfasını da kapsamalı.

**Interfaces:**
- Consumes: yok
- Produces:
  - `--status-up`, `--status-down` token'ları ve `@theme inline` üzerinden `--color-status-up`, `--color-status-down` (Faz 5 status widget'ı bunları kullanacak)
  - `--primary` yalnızca emerald taşıyan token; `--accent`, `--secondary`, `--muted`, `--border`, `--input` nötr
  - `--ring` solid (alfa yok)

**Referans değerler** (03-tasarim-ui-ux.md palet tablosu, sRGB hex -> oklch dönüşümü ve WCAG kontrast oranları doğrulandı):

| Rol | Light hex | Light oklch | Dark hex | Dark oklch | Kontrast |
|---|---|---|---|---|---|
| Zemin | `#f9fafb` | `oklch(0.9846 0.0017 247.8)` | `#0a0c0f` | `oklch(0.1535 0.0072 258.4)` | - |
| Yüzey / kart | `#ffffff` | `oklch(1 0 0)` | `#14171b` | `oklch(0.2032 0.0093 255.6)` | - |
| Metin | `#14181c` | `oklch(0.2066 0.0101 248.3)` | `#f1f3f4` | `oklch(0.9629 0.0025 228.8)` | light 17.07, dark 17.59 |
| Muted metin | `#60656b` | `oklch(0.5044 0.0114 252.9)` | `#999fa6` | `oklch(0.6998 0.0123 252.1)` | light 5.63, dark 7.33 |
| İkincil yüzey | `#eceef0` | `oklch(0.9482 0.0034 247.9)` | `#1b1f24` | `oklch(0.2373 0.0113 254.1)` | - |
| Accent yüzey | `#e4e7ea` | `oklch(0.9265 0.0052 247.9)` | `#22262b` | `oklch(0.2667 0.0110 254.0)` | - |
| Çizgi (hairline) | `#e4e7ea` | `oklch(0.9265 0.0052 247.9)` | `#2a2e33` | `oklch(0.2993 0.0107 254.0)` | - |
| Aksan (link/focus/up) | `#007041` | `oklch(0.4794 0.1156 156.3)` | `#4fcc8d` | `oklch(0.7591 0.1444 158.0)` | light 5.92, dark 9.66 |
| Destructive | `#b91c1c` | `oklch(0.5054 0.1905 27.5)` | `#f87171` | `oklch(0.7106 0.1661 22.2)` | light 6.19, dark 7.08 |

- [ ] **Step 1: `@theme inline` bloğuna status eşlemesini ekle**

`src/app/globals.css` içinde `@theme inline { ... }` bloğunda `--color-ring: var(--ring);` satırının hemen altına ekle:

```css
  --color-status-up: var(--status-up);
  --color-status-down: var(--status-down);
```

- [ ] **Step 2: `:root` token bloğunu değiştir**

`src/app/globals.css`'teki `:root` bloğunda, `--radius: 1.25rem;` satırından sonraki TÜM token satırlarını (yani `--background`'dan `--sidebar-ring`'e kadar) şununla değiştir:

```css
  --background: oklch(0.9846 0.0017 247.8);
  --foreground: oklch(0.2066 0.0101 248.3);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2066 0.0101 248.3);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2066 0.0101 248.3);
  /* Emerald survives in exactly three roles: primary, ring and status. */
  --primary: oklch(0.4794 0.1156 156.3);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9482 0.0034 247.9);
  --secondary-foreground: oklch(0.2066 0.0101 248.3);
  --muted: oklch(0.9482 0.0034 247.9);
  --muted-foreground: oklch(0.5044 0.0114 252.9);
  --accent: oklch(0.9265 0.0052 247.9);
  --accent-foreground: oklch(0.2066 0.0101 248.3);
  --destructive: oklch(0.5054 0.1905 27.5);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9265 0.0052 247.9);
  --input: oklch(0.9265 0.0052 247.9);
  --ring: oklch(0.4794 0.1156 156.3);
  --status-up: oklch(0.4794 0.1156 156.3);
  --status-down: oklch(0.5054 0.1905 27.5);
  --chart-1: oklch(0.4794 0.1156 156.3);
  --chart-2: oklch(0.5044 0.0114 252.9);
  --chart-3: oklch(0.6998 0.0123 252.1);
  --chart-4: oklch(0.9265 0.0052 247.9);
  --chart-5: oklch(0.2066 0.0101 248.3);
  --sidebar: oklch(0.9846 0.0017 247.8);
  --sidebar-foreground: oklch(0.2066 0.0101 248.3);
  --sidebar-primary: oklch(0.4794 0.1156 156.3);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.9482 0.0034 247.9);
  --sidebar-accent-foreground: oklch(0.2066 0.0101 248.3);
  --sidebar-border: oklch(0.9265 0.0052 247.9);
  --sidebar-ring: oklch(0.4794 0.1156 156.3);
```

- [ ] **Step 3: `.dark` token bloğunu değiştir**

`src/app/globals.css`'teki `.dark { ... }` bloğunun tüm içeriğini şununla değiştir:

```css
  --background: oklch(0.1535 0.0072 258.4);
  --foreground: oklch(0.9629 0.0025 228.8);
  --card: oklch(0.2032 0.0093 255.6);
  --card-foreground: oklch(0.9629 0.0025 228.8);
  --popover: oklch(0.2032 0.0093 255.6);
  --popover-foreground: oklch(0.9629 0.0025 228.8);
  --primary: oklch(0.7591 0.1444 158.0);
  --primary-foreground: oklch(0.1535 0.0072 258.4);
  --secondary: oklch(0.2373 0.0113 254.1);
  --secondary-foreground: oklch(0.9629 0.0025 228.8);
  --muted: oklch(0.2373 0.0113 254.1);
  --muted-foreground: oklch(0.6998 0.0123 252.1);
  --accent: oklch(0.2667 0.0110 254.0);
  --accent-foreground: oklch(0.9629 0.0025 228.8);
  --destructive: oklch(0.7106 0.1661 22.2);
  --destructive-foreground: oklch(0.1535 0.0072 258.4);
  --border: oklch(0.2993 0.0107 254.0);
  --input: oklch(0.2993 0.0107 254.0);
  --ring: oklch(0.7591 0.1444 158.0);
  --status-up: oklch(0.7591 0.1444 158.0);
  --status-down: oklch(0.7106 0.1661 22.2);
  --chart-1: oklch(0.7591 0.1444 158.0);
  --chart-2: oklch(0.6998 0.0123 252.1);
  --chart-3: oklch(0.5044 0.0114 252.9);
  --chart-4: oklch(0.2993 0.0107 254.0);
  --chart-5: oklch(0.9629 0.0025 228.8);
  --sidebar: oklch(0.1535 0.0072 258.4);
  --sidebar-foreground: oklch(0.9629 0.0025 228.8);
  --sidebar-primary: oklch(0.7591 0.1444 158.0);
  --sidebar-primary-foreground: oklch(0.1535 0.0072 258.4);
  --sidebar-accent: oklch(0.2373 0.0113 254.1);
  --sidebar-accent-foreground: oklch(0.9629 0.0025 228.8);
  --sidebar-border: oklch(0.2993 0.0107 254.0);
  --sidebar-ring: oklch(0.7591 0.1444 158.0);
```

- [ ] **Step 4: Yasaklı değer testini `tests/design-tokens.test.ts`'e ekle**

Dosyanın sonuna ekle:

```ts
const EMERALD_RAMP_HEX = [
  "#ecfdf5",
  "#d1fae5",
  "#a7f3d0",
  "#6ee7b7",
  "#34d399",
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
  "#022c22",
];

describe("colour tokens", () => {
  it("does not ship a single Tailwind emerald ramp hex", () => {
    const lower = css.toLowerCase();
    for (const hex of EMERALD_RAMP_HEX) {
      expect(lower, `globals.css still contains ${hex}`).not.toContain(hex);
    }
  });

  it("dropped the hard coded emerald shadow on surface-panel", () => {
    expect(css.replace(/\s/g, "")).not.toContain("rgba(4,120,87");
  });

  it("no longer reuses the old shared emerald token value", () => {
    expect(css).not.toContain("oklch(0.516 0.114 157.2)");
  });

  it("keeps --primary and --muted-foreground on different values", () => {
    for (const block of ["light", "dark"] as const) {
      const source =
        block === "light"
          ? css.slice(css.indexOf(":root {"), css.indexOf(".dark {"))
          : css.slice(css.indexOf(".dark {"));
      const primary = source.match(/--primary:\s*([^;]+);/)?.[1].trim();
      const muted = source.match(/--muted-foreground:\s*([^;]+);/)?.[1].trim();
      expect(primary).toBeDefined();
      expect(muted).toBeDefined();
      expect(primary, `${block}: primary and muted-foreground collide`).not.toBe(muted);
    }
  });

  it("exposes solid status tokens for the Faz 5 widget", () => {
    expect(css.match(/--status-up:/g)).toHaveLength(2);
    expect(css.match(/--status-down:/g)).toHaveLength(2);
    expect(css).toContain("--color-status-up: var(--status-up);");
  });

  it("uses a solid focus ring colour, no alpha suffix", () => {
    const ringValues = [...css.matchAll(/--ring:\s*([^;]+);/g)].map((m) => m[1]);
    expect(ringValues.length).toBeGreaterThanOrEqual(2);
    for (const value of ringValues) {
      expect(value, `--ring still carries an alpha channel: ${value}`).not.toContain("/");
    }
  });
});
```

- [ ] **Step 5: Testi çalıştır**

Run: `npm test -- tests/design-tokens.test.ts`

Beklenen: `colour tokens > dropped the hard coded emerald shadow on surface-panel` FAIL ("rgba(4,120,87" hâlâ `.surface-panel` içinde), diğer 8 test PASS. Bu bekleniyor: gölge Task 4'te temizlenecek.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/design-tokens.test.ts
git commit -m "feat(theme): move the token blocks to a neutral palette

The previous values were the Tailwind emerald ramp converted to oklch, which
reads as a framework default rather than a brand. Ground, surface, text, muted
and hairline tokens become neutral greys; emerald stays in exactly three roles:
primary, ring and the new status-up token. --primary and --muted-foreground no
longer share a value, which restores the three level text hierarchy, and --ring
loses its alpha channel so the focus ring stays solid."
```

---

### Task 4: Zemin katmanını sadeleştir ve bileşenlerdeki doğrudan renk referanslarını temizle

**Files:**
- Modify: `src/app/globals.css:132-152` (body gradyanı ve grid overlay), `src/app/globals.css:190-196` (`.surface-panel`, `.eyebrow`)
- Modify: `src/components/ui/card.tsx:10` (hard coded rgba gölge)
- Modify: `src/components/ui/button.tsx:13,17,19,21` (primary gölge, inset rgba, accent hover, hover translate)
- Modify: `src/components/ui/input.tsx:11` (inset rgba gölge)
- Modify: `src/components/ui/textarea.tsx:10` (inset rgba gölge)
- Modify: `src/components/layout/header.tsx:31` (inset rgba gölge)
- Modify: `src/components/layout/language-switcher.tsx:18,36` (inset rgba gölge, `bg-accent/70`)
- Modify: `src/components/sections/hero.tsx` (emerald pill, primary blur, `bg-accent/45`)
- Modify: `src/components/sections/contact-form.tsx:126` (emerald success kutusu)
- Modify: `src/components/sections/project-card.tsx:35` (CSS gradyan kapak)
- Modify: `src/components/sections/project-detail.tsx:42` (CSS gradyan kapak, `bg-accent/45`)
- Test: `tests/design-tokens.test.ts`
- Verify (kod değişikliği yok): `src/app/global-not-found.tsx` `.eyebrow` sınıfını kullanıyor ve `globals.css`'i kendi import ediyor, bu yüzden Step 1-3'ün zemin/`.eyebrow` değişiklikleri buraya da otomatik yansır; ayrıca Step 11'in `collectTsxFiles("src")` taraması bu dosyayı zaten kapsıyor, `emerald`/`rgba(`/`radial-gradient` yasağı burada da geçerli olmak zorunda.

**Interfaces:**
- Consumes: Task 3'ün nötr token'ları
- Produces: `src/**/*.tsx` içinde hiçbir `emerald` sınıfı, hiçbir `rgba(` literal'i ve hiçbir `radial-gradient` kapak kalmıyor

Bu görevin sonundaki test `src/` altındaki TÜM `.ts` ve `.tsx` dosyalarını tarar, bu yüzden `rgba(` geçen sekiz noktanın hepsi bu görevde kapanmak zorunda. Tam liste (`grep -rn "rgba(" src/` ile doğrulandı): `globals.css:191`, `card.tsx:10`, `button.tsx:17`, `input.tsx:11`, `textarea.tsx:10`, `header.tsx:31`, `language-switcher.tsx:18` ve `:36`.

- [ ] **Step 1: body zeminini sadeleştir**

`src/app/globals.css`'te `@layer base` içindeki `body { ... }` ve `body::before { ... }` bloklarını şununla değiştir:

```css
  body {
    @apply bg-background text-foreground;
    min-height: 100vh;
    text-rendering: optimizeLegibility;
  }
  /* One very quiet hairline grid, no colour gradients. The editorial direction
     wants the type to carry the page, not the background. */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(to right, color-mix(in oklab, var(--foreground) 4%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 4%, transparent) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: linear-gradient(to bottom, black 0%, transparent 45%);
    opacity: 0.5;
  }
```

`z-index: -1` eklenmesi bilinçli: eski kural `position: fixed` ile içeriğin üstünde duruyordu ve yalnızca `pointer-events: none` sayesinde tıklamayı engellemiyordu.

- [ ] **Step 2: `::selection` kuralını nötrle**

`src/app/globals.css`'teki `::selection` bloğunu şununla değiştir:

```css
  ::selection {
    background: var(--primary);
    color: var(--primary-foreground);
  }
```

- [ ] **Step 3: `.surface-panel` ve `.eyebrow` utility'lerini temizle**

`src/app/globals.css`'te:

```css
  .surface-panel {
    @apply rounded-3xl border border-border/70 bg-card/75 shadow-[0_24px_80px_-40px_rgba(4,120,87,0.30)] backdrop-blur-xl;
  }
```

yerine:

```css
  .surface-panel {
    @apply rounded-3xl border border-border bg-card/80 shadow-[0_24px_80px_-48px_color-mix(in_oklab,var(--foreground)_35%,transparent)] backdrop-blur-xl;
  }
```

ve:

```css
  .eyebrow {
    @apply inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground;
  }
```

yerine (mono, veri katmanı kuralı gereği):

```css
  .eyebrow {
    @apply inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground;
  }
```

- [ ] **Step 4: Card gölgesindeki hard coded rgba'yı kaldır**

`src/components/ui/card.tsx` içinde:

```
"text-card-foreground flex flex-col gap-6 rounded-[1.75rem] border border-border/70 bg-card/80 py-6 shadow-[0_24px_80px_-44px_rgba(28,22,15,0.45)] backdrop-blur-xl",
```

yerine:

```
"text-card-foreground flex flex-col gap-6 rounded-[1.75rem] border border-border bg-card/80 py-6 shadow-[0_24px_80px_-48px_color-mix(in_oklab,var(--foreground)_35%,transparent)] backdrop-blur-xl",
```

- [ ] **Step 5: Button varyantlarını nötr token'lara bağla**

`src/components/ui/button.tsx` içinde `default` varyantını:

```
        default:
          "border border-primary/90 bg-primary text-primary-foreground shadow-[0_14px_40px_-20px_var(--primary)] hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_22px_52px_-24px_var(--primary)]",
```

şununla değiştir:

```
        default:
          "border border-primary bg-primary text-primary-foreground hover:bg-primary/90",
```

`outline` varyantını:

```
        outline:
          "border border-border/80 bg-background/75 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent/55 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
```

şununla değiştir:

```
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
```

`secondary` ve `ghost` varyantlarındaki `hover:-translate-y-0.5` parçalarını da sil:

```
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
```

Gerekçe: `hover:-translate-y-0.5` hareket bütçesinin dışında (03-tasarim-ui-ux.md, hareket kuralı: yalnızca opacity + 2-4px translate, hover'da transform yok) ve `rgba(255,255,255,...)` inset gölge nötr dark zeminde beyaz bir çizgi bırakıyor.

- [ ] **Step 6: Input ve Textarea inset gölgelerini kaldır**

`src/components/ui/input.tsx` içindeki uzun sınıf dizesinde şu parçayı sil (öncesindeki ve sonrasındaki tek boşluk tek boşluk olarak kalsın):

```
shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] 
```

ve `bg-background/70` -> `bg-background` yap.

`src/components/ui/textarea.tsx` içinde aynı `shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ` parçasını sil ve `bg-background/70` -> `bg-background` yap.

Odak sınıfları (`focus-visible:ring-ring/50`, `focus-visible:ring-[3px]`) bu adımda değişmiyor, Task 8'de solid outline'a geçecekler.

- [ ] **Step 7: header.tsx ve language-switcher.tsx inset gölgelerini kaldır**

`src/components/layout/header.tsx:31`'deki marka rozetinde:

```
className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-accent/45 font-display text-lg font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
```

yerine:

```
className="flex size-10 items-center justify-center rounded-2xl border border-border bg-muted font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-foreground"
```

ve içindeki `AC` metnini `DCY` yap. (Task 5 bu dosyayı zaten baştan yazacak, ama Task 4'ün tarama testi bu görevin sonunda çalıştığı için gölge burada kalkmak zorunda.)

`src/components/layout/language-switcher.tsx:18` ve `:36`'daki iki aktif durum sınıfında:

```
"bg-accent/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
```

yerine (her iki satırda da):

```
"bg-muted text-foreground"
```

- [ ] **Step 8: hero.tsx'teki emerald pill'i ve accent referanslarını temizle**

`src/components/sections/hero.tsx` içinde şu bloğu:

```tsx
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t("hero.availableForWork")}
              </span>
```

şununla değiştir:

```tsx
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span className="size-2 rounded-full bg-status-up" />
                {t("hero.availableForWork")}
              </span>
```

Aynı dosyada:
- `<div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/12 blur-3xl" />` satırını tamamen sil (yeşil parıltı katmanı).
- `className="rounded-full border border-border/70 bg-accent/45 px-4 py-2 text-sm text-foreground"` -> `className="rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground"`
- `className="rounded-[1.5rem] border border-border/70 bg-background/55 p-4"` (üç kez geçiyor) -> `className="rounded-[1.5rem] border border-border bg-background p-4"`
- `<p className="font-display text-3xl text-foreground">` (üç kez geçiyor) -> `<p className="font-mono text-3xl text-foreground">` (metrikler veri katmanıdır, serif değil mono)

- [ ] **Step 9: contact-form.tsx'teki emerald success kutusunu temizle**

`src/components/sections/contact-form.tsx` içinde:

```tsx
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
```

yerine:

```tsx
        <p className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
```

- [ ] **Step 10: project-card.tsx ve project-detail.tsx'teki CSS gradyan kapakları kaldır**

`src/components/sections/project-card.tsx` içinde şu satırı tamamen sil:

```tsx
      <div className="h-28 bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_20%,transparent),transparent_55%),linear-gradient(135deg,color-mix(in_oklab,var(--accent)_50%,transparent),transparent)] sm:h-32" />
```

`src/components/sections/project-detail.tsx` içinde şu satırı tamamen sil:

```tsx
          <div className="h-32 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_22%,transparent),transparent_55%),linear-gradient(135deg,color-mix(in_oklab,var(--accent)_42%,transparent),transparent)]" />
```

Aynı dosyada `bg-background/55` geçen beş `div` sınıfında `border-border/70 bg-background/55` -> `border-border bg-background`, ve tag pill'lerindeki `bg-accent/45` -> `bg-muted`, `py-1.5` -> `py-1.5` (28px, 24x24 sınırının üstünde, değişmiyor).

- [ ] **Step 11: Bileşen tarama testini `tests/design-tokens.test.ts`'e ekle**

Önce dosyanın en üstündeki import satırını genişlet:

```ts
import { readdirSync, readFileSync } from "node:fs";
```

Ardından dosyanın sonuna ekle:

```ts
function collectTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsxFiles(full));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const sourceFiles = collectTsxFiles(join(process.cwd(), "src")).map((file) => ({
  file,
  body: readFileSync(file, "utf8"),
}));

describe("component colour hygiene", () => {
  it("has no Tailwind emerald utility left in src", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /\bemerald-/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("has no hard coded rgba() literal left in src", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /rgba\(/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("ships no CSS gradient stand-in for a missing project cover", () => {
    const offenders = sourceFiles
      .filter(({ body }) => /radial-gradient/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 12: Testleri çalıştır**

Run: `npm test -- tests/design-tokens.test.ts`
Beklenen: PASS, 12 test (Task 3'te FAIL veren `rgba(4,120,87` testi dahil).

FAIL alırsan testin bastığı dosya listesi tam olarak hangi dosyanın atlandığını söyler; Step 1-10'daki sekiz `rgba(` noktası ve iki gradyan noktası eksiksiz kapanmış olmalı.

- [ ] **Step 13: Typecheck, lint ve build**

```bash
npm run typecheck && npm run lint && npm run build
```

Beklenen: üçü de exit 0.

- [ ] **Step 14: Commit**

```bash
git add src/app/globals.css src/components tests/design-tokens.test.ts
git commit -m "refactor(theme): strip the leftover emerald and hard coded colours

Half a neutral palette looks worse than the emerald one it replaced, so this
removes the three layer body gradient, the emerald tinted surface-panel shadow,
all eight rgba() literals across card, button, input, textarea, header and the
language switcher, the emerald availability pill in hero, the emerald success
box in the contact form and the radial-gradient stand-in covers on the project
card and the project detail page. Covers are now either a real screenshot or
nothing at all."
```

---

### Task 5: Mobil menü (Radix Dialog) ve footer sayfa linkleri

**Files:**
- Create: `src/lib/nav.ts`
- Create: `src/components/layout/mobile-menu.tsx`
- Modify: `src/components/layout/header.tsx` (tam yeniden yazım)
- Modify: `src/components/layout/footer.tsx` (tam yeniden yazım)
- Modify: `messages/en.json`, `messages/tr.json`
- Modify: `src/app/globals.css` (`.tap-target` utility)

**Interfaces:**
- Consumes: `Link`, `usePathname` (`@/i18n/navigation`), `useTranslations` (`next-intl`), `Button` (`@/components/ui/button`)
- Produces:
  - `src/lib/nav.ts` -> `export const navItems` (`as const`, öğe tipi `{ readonly href: "/" | "/about" | "/projects" | "/contact"; readonly key: "nav.home" | "nav.about" | "nav.projects" | "nav.contact" }`), `export type NavItem = (typeof navItems)[number]`
  - `src/components/layout/mobile-menu.tsx` -> `export function MobileMenu(): JSX.Element`
  - Yeni mesaj anahtarları: `nav.menu`, `nav.openMenu`, `nav.closeMenu`, `footer.navTitle`, `a11y.skipToContent`
  - `.tap-target` utility (min 44x44 CSS px)

- [ ] **Step 1: Ortak navigasyon listesini çıkar**

`src/lib/nav.ts`:

```ts
export const navItems = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/projects", key: "nav.projects" },
  { href: "/contact", key: "nav.contact" },
] as const;

export type NavItem = (typeof navItems)[number];
```

- [ ] **Step 2: Mesaj anahtarlarını ekle**

`messages/en.json` içinde `"nav"` nesnesine ekle:

```json
    "menu": "Menu",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
```

`"footer"` nesnesine ekle:

```json
    "navTitle": "Pages"
```

Kök seviyeye ekle:

```json
  "a11y": {
    "skipToContent": "Skip to content"
  }
```

`messages/tr.json` içinde aynı yerlere:

```json
    "menu": "Menü",
    "openMenu": "Menüyü aç",
    "closeMenu": "Menüyü kapat"
```

```json
    "navTitle": "Sayfalar"
```

```json
  "a11y": {
    "skipToContent": "İçeriğe geç"
  }
```

- [ ] **Step 3: `.tap-target` utility'sini ekle**

`src/app/globals.css`'te `@layer utilities` bloğunun sonuna ekle:

```css
  /* WCAG 2.2 SC 2.5.8 wants 24x24 CSS px minimum. 44px is the comfortable
     target and costs nothing in a single column layout. */
  .tap-target {
    @apply min-h-11 min-w-11;
  }
```

- [ ] **Step 4: Mobil menüyü yaz**

`src/components/layout/mobile-menu.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav";

export function MobileMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="tap-target border border-border bg-background md:hidden"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="size-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-3 top-3 z-50 rounded-3xl border border-border bg-card p-5 outline-none sm:inset-x-4"
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("nav.menu")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="tap-target border border-border bg-background"
                aria-label={t("nav.closeMenu")}
              >
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <ul className="mt-4 flex flex-col">
            {navItems.map(({ href, key }) => (
              <li key={href} className="border-b border-border last:border-b-0">
                <Dialog.Close asChild>
                  <Link
                    href={href}
                    className="tap-target flex items-center py-3 text-lg text-foreground no-underline"
                  >
                    {t(key)}
                  </Link>
                </Dialog.Close>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

`aria-describedby={undefined}` bilinçli: Radix, `Dialog.Description` bulamazsa konsola uyarı basar; menüde açıklayıcı bir paragraf olmadığı için bağlantı açıkça kaldırılıyor.

- [ ] **Step 5: Header'ı yeniden yaz**

`src/components/layout/header.tsx` dosyasının tamamını şununla değiştir:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav
        aria-label={t("nav.menu")}
        className="page-shell surface-panel flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-5"
      >
        <Link href="/" className="group flex min-w-0 items-center gap-3 no-underline">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-border bg-muted font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-foreground">
            DCY
          </span>
          <span className="min-w-0">
            <span className="block truncate font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio
            </span>
            <span className="text-lg text-foreground transition-colors group-hover:text-primary">
              {t("brand")}
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <ul className="hidden items-center gap-1 rounded-full border border-border bg-background p-1 md:flex">
            {navItems.map(({ href, key }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-9 items-center rounded-full px-4 text-sm font-medium no-underline transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">
                {t("nav.contact")}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
```

Aktif sayfa göstergesi artık `layoutId` ile paylaşılan bir motion katmanı değil, düz bir `bg-muted` dolgusu. Gerekçe: Task 6'da yüklenen `domAnimation` özellik paketi layout animasyonlarını içermiyor (onlar `domMax`'ta), ve `domMax` yalnızca bir nav pill'i için 10 KB fazladan bundle demek.

- [ ] **Step 6: Footer'ı yeniden yaz**

`src/components/layout/footer.tsx` dosyasının tamamını şununla değiştir:

```tsx
"use client";

import { Github, Linkedin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav";

const socialLinks = [
  { href: "https://github.com/dogancanyildiz", labelKey: "footer.github", Icon: Github },
  { href: "https://www.linkedin.com/in/dogancanyildiz", labelKey: "footer.linkedin", Icon: Linkedin },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations();
  const email = t("contact.email");

  return (
    <footer className="pb-6 pt-4 sm:pb-8">
      <div className="page-shell">
        <div className="surface-panel grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <span className="eyebrow">{t("footer.availability")}</span>
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl sm:text-4xl">{t("brand")}</h2>
              <p className="section-copy">{t("footer.tagline")}</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              © {year} {t("brand")}. {t("footer.copyright")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <nav aria-label={t("footer.navTitle")} className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="mb-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.navTitle")}
              </p>
              <ul className="flex flex-col">
                {navItems.map(({ href, key }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="tap-target flex items-center text-sm text-foreground no-underline transition-colors hover:text-primary"
                    >
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="mb-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.emailLabel")}
              </p>
              <a
                href={`mailto:${email}`}
                className="tap-target inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" />
                {email}
              </a>
              <p className="mb-3 mt-6 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.elsewhere")}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map(({ href, labelKey, Icon }) => (
                  <a
                    key={labelKey}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={t(labelKey)}
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button asChild variant="outline" size="lg" className="w-full justify-center sm:w-auto">
                <Link href="/contact">{t("footer.contact")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

`alex@example.com` hardcode'u gitti, e-posta artık `contact.email` mesaj anahtarından geliyor (Faz 4 bu anahtarı gerçek adresle dolduracak). Twitter/X linki listeden çıktı, `footer.twitter` anahtarı mesaj dosyalarında kullanılmadan kalabilir; Faz 4 içerik temizliğinde silinir.

- [ ] **Step 7: Typecheck ve lint**

```bash
npm run typecheck && npm run lint
```

Beklenen: exit 0. `t("footer.twitter")` çağrısı kalktığı için next-intl tip kontrolünde kullanılmayan anahtar hatası oluşmaz.

- [ ] **Step 8: Mobil menüyü elle doğrula**

```bash
npm run dev
```

Ayrı bir terminalde:

```bash
curl -s http://localhost:3000/ | grep -c 'aria-label="Open menu"'
curl -s http://localhost:3000/tr | grep -c 'aria-label="Menüyü aç"'
```

Beklenen: her ikisi de `1`.

Tarayıcıda `http://localhost:3000/` adresini aç, pencereyi 390px genişliğe daralt:
- Hamburger butonu görünüyor, masaüstü nav listesi gizli.
- Butona tıklayınca dialog açılıyor, dört link listeleniyor.
- `Tab` ile odak dialog içinde kalıyor (Radix focus trap), `Escape` kapatıyor.
- Bir linke tıklayınca hem gezinme oluyor hem dialog kapanıyor.
- Footer'da "Pages" bloğu dört linki gösteriyor.

`Ctrl+C` ile dev sunucusunu kapat.

- [ ] **Step 9: Commit**

```bash
git add src/lib/nav.ts src/components/layout src/app/globals.css messages/en.json messages/tr.json
git commit -m "feat(nav): add a mobile menu and footer page links

Below the md breakpoint the nav list was hidden with no replacement and the
footer carried no page links, so a phone visitor could not reach anything but
the home page. Add a Radix Dialog menu behind a hamburger button, move the nav
list into a shared src/lib/nav.ts and give the footer its own Pages block. The
header active state drops the shared layout animation because the domAnimation
feature bundle does not ship layout animations."
```

---

### Task 6: Hareket katmanını LazyMotion + m üzerine taşı

**Files:**
- Create: `src/lib/motion.ts`
- Create: `src/components/motion-provider.tsx`
- Modify: `src/app/[lang]/layout.tsx`
- Modify: `src/app/globals.css` (`prefers-reduced-motion` fallback)
- Modify: `src/components/sections/hero.tsx`, `src/components/sections/skills-strip.tsx`, `src/components/sections/featured-projects.tsx`, `src/components/sections/project-detail.tsx`, `src/components/sections/contact-form.tsx`
- Modify: `src/components/layout/theme-toggle.tsx`, `src/components/layout/language-switcher.tsx`
- Test: `tests/motion.test.ts`

**Interfaces:**
- Consumes: `motion@13.1.1` (`motion/react`, `motion/react-m`)
- Produces:
  - `src/lib/motion.ts` -> `export const STAGGER_SECONDS: number`, `export const MAX_STAGGER_ITEMS: number`, `export function staggerDelay(index: number): number`, `export function fadeUp(reduced: boolean): Variants`, `export function staggerContainer(reduced: boolean): Variants`, `export function staggerItem(reduced: boolean): Variants`
  - `src/components/motion-provider.tsx` -> `export function MotionProvider({ children }: { children: React.ReactNode }): JSX.Element`

- [ ] **Step 1: Başarısız testi yaz**

`tests/motion.test.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_STAGGER_ITEMS,
  STAGGER_SECONDS,
  fadeUp,
  staggerContainer,
  staggerDelay,
  staggerItem,
} from "../src/lib/motion";

describe("stagger budget", () => {
  it("uses a 40ms step", () => {
    expect(STAGGER_SECONDS).toBe(0.04);
    expect(MAX_STAGGER_ITEMS).toBe(4);
  });

  it("increases the delay for the first four items only", () => {
    expect(staggerDelay(0)).toBeCloseTo(0);
    expect(staggerDelay(1)).toBeCloseTo(0.04);
    expect(staggerDelay(3)).toBeCloseTo(0.12);
  });

  it("clamps every later item to the fourth item's delay", () => {
    expect(staggerDelay(4)).toBeCloseTo(0.12);
    expect(staggerDelay(25)).toBeCloseTo(0.12);
  });
});

describe("reduced motion variants", () => {
  it("keeps the translate under 4px and the duration under 220ms", () => {
    const variants = fadeUp(false);
    expect(variants.hidden).toEqual({ opacity: 0, y: 4 });
    const show = (variants.show as (index: number) => Record<string, unknown>)(2);
    expect(show.opacity).toBe(1);
    expect(show.y).toBe(0);
    const transition = show.transition as { duration: number; delay: number };
    expect(transition.duration).toBeLessThanOrEqual(0.22);
    expect(transition.delay).toBeCloseTo(0.08);
  });

  it("collapses to a no-op when the user asked for reduced motion", () => {
    const variants = fadeUp(true);
    expect(variants.hidden).toEqual({ opacity: 1, y: 0 });
    const show = (variants.show as (index: number) => Record<string, unknown>)(3);
    const transition = show.transition as { duration: number; delay: number };
    expect(transition.duration).toBe(0);
    expect(transition.delay).toBe(0);
    expect(staggerContainer(true).show).toEqual({ transition: { staggerChildren: 0 } });
    expect(staggerItem(true).hidden).toEqual({ opacity: 1, y: 0 });
  });
});

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = collectSourceFiles(join(process.cwd(), "src")).map((file) => ({
  file,
  body: readFileSync(file, "utf8"),
}));

describe("motion imports", () => {
  it("never imports the eager motion component", () => {
    const offenders = files
      .filter(({ body }) => /import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*"motion\/react"/.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("has no framer-motion import left", () => {
    expect(files.filter(({ body }) => body.includes("framer-motion")).map((f) => f.file)).toEqual([]);
  });

  it("has no scroll triggered reveal left", () => {
    expect(files.filter(({ body }) => body.includes("whileInView")).map((f) => f.file)).toEqual([]);
  });

  it("ships a global prefers-reduced-motion fallback", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
```

- [ ] **Step 2: Testi çalıştır ve kırıldığını gör**

Run: `npm test -- tests/motion.test.ts`
Beklenen: FAIL, "Failed to resolve import \"../src/lib/motion\"".

- [ ] **Step 3: Paylaşılan hareket modülünü yaz**

`src/lib/motion.ts`:

```ts
import type { Variants } from "motion/react";

/** 40ms per item, capped at four items: 03-tasarim-ui-ux.md motion budget. */
export const STAGGER_SECONDS = 0.04;
export const MAX_STAGGER_ITEMS = 4;
const DURATION_SECONDS = 0.18;

export function staggerDelay(index: number): number {
  const clamped = Math.min(Math.max(index, 0), MAX_STAGGER_ITEMS - 1);
  return clamped * STAGGER_SECONDS;
}

/** List variant: pass the item index through the `custom` prop. */
export function fadeUp(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
    show: (index: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0 : DURATION_SECONDS,
        delay: reduced ? 0 : staggerDelay(index),
        ease: "easeOut",
      },
    }),
  };
}

/** Parent variant for a group whose children animate in sequence. */
export function staggerContainer(reduced: boolean): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : STAGGER_SECONDS } },
  };
}

/** Child variant used together with staggerContainer. */
export function staggerItem(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : DURATION_SECONDS, ease: "easeOut" },
    },
  };
}
```

- [ ] **Step 4: MotionProvider'ı yaz**

`src/components/motion-provider.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";

/**
 * domAnimation covers animation, variants, exit and the tap/hover/focus
 * gestures. Layout animations and drag live in domMax and are deliberately not
 * loaded: nothing in this site needs them.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
```

`strict` bilinçli: bir bileşen yanlışlıkla `motion.div` kullanırsa geliştirme sırasında hata fırlatır, sessizce iki katı bundle yüklemez.

- [ ] **Step 5: Provider'ı layout'a bağla**

`src/app/[lang]/layout.tsx` import bloğuna ekle:

```ts
import { MotionProvider } from "@/components/motion-provider";
```

`<ThemeProvider ...>` içindeki çocukları `<MotionProvider>` ile sar:

```tsx
          <MotionProvider>
            <Header />
            <main id="main" className="min-h-[calc(100vh-7rem)]">
              {children}
            </main>
            <Footer />
          </MotionProvider>
```

- [ ] **Step 6: Global CSS fallback'ini ekle**

`src/app/globals.css`'te `@layer base` bloğunun sonuna (kapanış `}` işaretinden hemen önce) ekle:

```css
  /* Covers everything motion does not: CSS transitions, tw-animate-css classes
     and the smooth scroll behaviour on html. */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }
```

- [ ] **Step 7: hero.tsx'i taşı**

`src/components/sections/hero.tsx` içinde import satırını:

```ts
import { motion } from "motion/react";
```

şununla değiştir:

```ts
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { staggerContainer, staggerItem } from "@/lib/motion";
```

Dosyanın tepesindeki `const container = {...}` ve `const item = {...}` sabitlerini tamamen sil.

Bileşenin gövdesinde `const t = useTranslations();` satırının altına ekle:

```ts
  const reduced = useReducedMotion() ?? false;
  const container = staggerContainer(reduced);
  const item = staggerItem(reduced);
```

Dosyadaki tüm `motion.div` -> `m.div`, `motion.aside` -> `m.aside` yap (toplam 5 eleman: dış grid `div`, üç iç `div`, bir `aside`).

- [ ] **Step 8: skills-strip.tsx'i taşı**

`src/components/sections/skills-strip.tsx` import satırını:

```ts
import { motion } from "motion/react";
```

şununla değiştir:

```ts
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { fadeUp } from "@/lib/motion";
```

Bileşen gövdesinin başına ekle:

```ts
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
```

Başlık sarmalayıcısını:

```tsx
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
```

şununla değiştir:

```tsx
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
```

Kategori sarmalayıcısını:

```tsx
            <motion.div
              key={category.labelKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="surface-panel flex flex-col gap-5 p-6"
            >
```

şununla değiştir:

```tsx
            <m.div
              key={category.labelKey}
              variants={variants}
              initial="hidden"
              animate="show"
              custom={catIndex}
              className="surface-panel flex flex-col gap-5 p-6"
            >
```

İç `motion.li` sarmalayıcısını tamamen kaldır, yerine düz `<li key={skill}>` kullan (beceri rozetlerinin tek tek animasyonu hareket bütçesinin dışında). Kapanış etiketlerini `</m.div>` olarak güncelle.

- [ ] **Step 9: featured-projects.tsx'i taşı**

`src/components/sections/featured-projects.tsx` import satırını:

```ts
import { motion } from "motion/react";
```

şununla değiştir:

```ts
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { fadeUp } from "@/lib/motion";
```

Bileşen gövdesinin başına ekle:

```ts
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
```

Başlık sarmalayıcısını:

```tsx
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
```

şununla değiştir:

```tsx
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
```

Kapanışı `</m.div>` yap. Ayrıca `import Link from "next/link";` satırını `import { Link } from "@/i18n/navigation";` ile değiştir.

- [ ] **Step 10: project-detail.tsx'i taşı**

`src/components/sections/project-detail.tsx` import satırını:

```ts
import { motion } from "motion/react";
```

şununla değiştir:

```ts
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { fadeUp } from "@/lib/motion";
```

Bileşen gövdesinin başına ekle:

```ts
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
```

İki `motion.div` sarmalayıcısını sırayla şu hale getir:

```tsx
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
```

```tsx
        <m.div
          variants={variants}
          initial="hidden"
          animate="show"
          custom={1}
          className="surface-panel space-y-8 overflow-hidden p-6 sm:p-8"
        >
```

Kapanışları `</m.div>` yap. `import Link from "next/link";` -> `import { Link } from "@/i18n/navigation";`

- [ ] **Step 11: contact-form.tsx'i taşı**

`src/components/sections/contact-form.tsx` import satırını:

```ts
import { motion } from "motion/react";
```

şununla değiştir:

```ts
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { fadeUp } from "@/lib/motion";
```

Bileşen gövdesinin başına ekle:

```ts
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
```

Form sarmalayıcısını:

```tsx
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="surface-panel relative mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8"
    >
```

şununla değiştir:

```tsx
    <m.form
      variants={variants}
      initial="hidden"
      animate="show"
      custom={0}
      onSubmit={handleSubmit}
      className="surface-panel relative mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8"
    >
```

Kapanışı `</m.form>` yap.

- [ ] **Step 12: theme-toggle.tsx ve language-switcher.tsx'ten hareketi çıkar**

`src/components/layout/theme-toggle.tsx`: `import { motion } from "motion/react";` satırını sil ve `<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>` sarmalayıcısını (ve kapanış `</motion.div>` etiketini) tamamen kaldır; `<Button ...>` doğrudan döndürülür. Butona `className="tap-target border border-border bg-background"` ver.

`src/components/layout/language-switcher.tsx`: `import { motion } from "motion/react";` satırını sil ve iki `<motion.span whileHover={...} whileTap={...}>` sarmalayıcısını kaldır, içlerindeki `EN` / `TR` metinleri doğrudan `<Button>` içinde kalsın. Ölçek animasyonları hareket bütçesinin dışında (yalnızca opacity + 2-4px translate).

- [ ] **Step 13: Testleri çalıştır**

Run: `npm test -- tests/motion.test.ts`
Beklenen: PASS, 9 test.

- [ ] **Step 14: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

Beklenen: üçü de exit 0.

- [ ] **Step 15: Reduced motion davranışını elle doğrula**

```bash
npm run dev
```

Chrome DevTools -> Rendering -> "Emulate CSS media feature prefers-reduced-motion" -> `reduce`. `http://localhost:3000/` yenilendiğinde hero, skills ve featured bloklarında hiçbir kayma veya fade görünmemeli, içerik ilk boyamada tam opaklıkta olmalı. Ardından ayarı `no-preference`'a alıp animasyonların geri geldiğini doğrula. `Ctrl+C`.

- [ ] **Step 16: Commit**

```bash
git add src/lib/motion.ts src/components tests/motion.test.ts src/app/globals.css "src/app/[lang]/layout.tsx"
git commit -m "refactor(motion): move to LazyMotion and a shared 40ms stagger budget

Every animated component pulled in the eager motion component and project cards
staggered at 80ms per item, so on a six item grid the last card appeared 400ms
after it was already on screen. Load domAnimation once through a strict
LazyMotion provider, animate with the m component only, cap the stagger at 40ms
times four items and route every variant through src/lib/motion.ts so the
reduced motion branch is written once. Add the global CSS fallback for
everything motion does not control."
```

---

### Task 7: Proje listesini satır formatına geçir, kart tıklama alanını düzelt

**Files:**
- Create: `src/components/sections/project-row.tsx`
- Modify: `src/components/sections/projects-section.tsx` (tam yeniden yazım)
- Modify: `src/components/sections/project-card.tsx` (tam yeniden yazım)
- Test: `tests/design-tokens.test.ts` (mevcut gradient testi bu değişiklikleri de kapsar)

**Interfaces:**
- Consumes: `Project` (`@/data/projects`), `fadeUp` / `staggerDelay` (`@/lib/motion`), `Link` (`@/i18n/navigation`)
- Produces:
  - `src/components/sections/project-row.tsx` -> `export function ProjectRow({ project, index }: { project: Project; index: number }): JSX.Element`
  - `ProjectCard` artık kartı `Link`'e sarmıyor; başlık link, kart `::after` ile genişletilmiş tıklama alanı alıyor

- [ ] **Step 1: Satır bileşenini yaz**

`src/components/sections/project-row.tsx`:

```tsx
"use client";

import * as m from "motion/react-m";
import { useReducedMotion, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { Project } from "@/data/projects";

interface ProjectRowProps {
  project: Project;
  index: number;
  variants?: Variants;
}

export function ProjectRow({ project, index, variants }: ProjectRowProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const rowVariants = variants ?? fadeUp(reduced);
  const title = t(`projects.items.${project.id}.title`);
  const stack = project.tags.slice(0, 4).join(" · ");

  return (
    <m.li
      variants={rowVariants}
      initial="hidden"
      animate="show"
      custom={index}
      className="group relative border-b border-border last:border-b-0"
    >
      <div className="grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,13rem)]">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {project.year ?? ""}
        </span>
        <span className="min-w-0">
          <Link
            href={`/projects/${project.slug}`}
            className="text-lg text-foreground no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {title}
          </Link>
          {project.role ? (
            <span className="mt-1 block truncate text-sm text-muted-foreground">
              {project.role}
            </span>
          ) : null}
        </span>
        <span className="truncate font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground sm:text-right">
          {stack}
        </span>
      </div>
    </m.li>
  );
}
```

`after:absolute after:inset-0` ile satırın tamamı tıklanabilir olur, ama DOM'da yalnızca tek bir interaktif eleman (`Link`) vardır; ileride satıra repo/canlı link eklendiğinde iç içe interaktif eleman sorunu çıkmaz.

- [ ] **Step 2: projects-section.tsx'i satır listesine çevir**

`src/components/sections/projects-section.tsx` dosyasının tamamını şununla değiştir:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import { ProjectRow } from "./project-row";
import { projects } from "@/data/projects";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";

export function ProjectsSection() {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(
    () => (activeTag ? projects.filter((p) => p.tags.includes(activeTag)) : projects),
    [activeTag]
  );

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <SectionHeading
          eyebrow={t("projects.eyebrow")}
          title={t("projects.title")}
          description={t("projects.subtitle")}
        />

        <div className="space-y-4">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.filtersTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              aria-pressed={activeTag === null}
              className={cn(
                "min-h-9 rounded-full border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                activeTag === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {t("projects.all")}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                aria-pressed={activeTag === tag}
                className={cn(
                  "min-h-9 rounded-full border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                  activeTag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <ul className="border-t border-border">
          {filtered.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              index={index}
              variants={variants}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: project-card.tsx'i yeniden yaz**

`src/components/sections/project-card.tsx` dosyasının tamamını şununla değiştir:

```tsx
"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  variant?: "featured" | "standard" | "compact";
}

export function ProjectCard({ project, index, variant = "standard" }: ProjectCardProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);
  const compact = variant === "compact";
  const featured = variant === "featured";

  const wrapperClassName = featured
    ? "lg:[&_div[data-slot='card']]:min-h-[31rem]"
    : compact
      ? "lg:[&_div[data-slot='card']]:min-h-[14rem]"
      : "";

  return (
    <m.div
      variants={variants}
      initial="hidden"
      animate="show"
      custom={index}
      className={wrapperClassName}
    >
      {/* The whole card is clickable through the title link's ::after overlay,
          so the card itself stays a plain container and can host extra links
          (repo, live site) without nesting interactive elements. */}
      <Card className="group relative h-full overflow-hidden transition-colors hover:border-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                {project.year ?? ""}
              </span>
              {project.highlight ? (
                <span className="text-xs font-medium text-primary">{project.highlight}</span>
              ) : null}
            </div>
            <CardTitle
              className={featured ? "text-3xl sm:text-4xl" : compact ? "text-xl" : "text-2xl"}
            >
              <Link
                href={`/projects/${project.slug}`}
                className="text-foreground no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
              >
                {title}
              </Link>
            </CardTitle>
            {project.summary ? (
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                {project.summary}
              </p>
            ) : null}
          </div>
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </CardHeader>
        <CardContent className={compact ? "space-y-4 pt-0" : "space-y-5 pt-0"}>
          <CardDescription>{description}</CardDescription>
          {project.impact ? (
            <p className="rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
              {project.impact}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
```

Kart üstündeki `h-28`/`h-32` CSS gradyan kapak bloğu Task 4'te silinmişti, bu yeni sürümde de yok (Global Constraints: CSS gradyan kapak yayına çıkmaz). Ok simgesi `aria-hidden` oldu, çünkü artık gerçek link başlıktır. Dış `Link` sarmalayıcısı kalktı, `Card` `relative` oldu ve tıklama alanını başlık linkinin `::after` katmanı taşıyor.

- [ ] **Step 4: Testleri çalıştır**

```bash
npm test
```

Beklenen: tüm dosyalar PASS, toplam 46 test. `component colour hygiene` üçlüsü (emerald, rgba, radial-gradient) Task 4'ten beri yeşildi ve bu yeniden yazımdan sonra da yeşil kalmalı.

- [ ] **Step 5: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

Beklenen: üçü de exit 0.

- [ ] **Step 6: Satır formatını elle doğrula**

```bash
npm run dev
curl -s http://localhost:3000/projects | grep -c 'after:absolute'
```

Beklenen: proje sayısı kadar eşleşme (mevcut şablon veride 6).

Tarayıcıda `/projects` sayfasında:
- Liste kart değil satır: her satırda solda mono yıl, ortada başlık ve rol, sağda mono stack.
- Satırın herhangi bir yerine tıklamak proje detayına götürüyor.
- `Tab` ile gezerken her satırda tek bir odak durağı var.

`Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add src/components/sections tests
git commit -m "feat(projects): switch the project list to editorial rows

A long project list scans faster as year, title, role and stack aligned in mono
columns than as a grid of cards that each need a cover image. The card variant
stays for the featured block but stops wrapping the whole card in a Link: the
title is the link and an ::after overlay carries the click area, so a repo or
live link can be added later without nesting interactive elements. The gradient
placeholder covers are gone."
```

---

### Task 8: Erişilebilirlik (canlı bölgeler, odak halkası, hedef boyutu, skip link)

**Files:**
- Modify: `src/components/sections/contact-form.tsx`
- Modify: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`
- Modify: `src/app/globals.css` (`*` outline kuralı, `:focus-visible`, `.skip-link`)
- Modify: `src/app/[lang]/layout.tsx` (skip link)
- Test: `tests/accessibility.test.ts`

**Interfaces:**
- Consumes: `a11y.skipToContent` mesaj anahtarı (Task 5), `--ring` solid token (Task 3), `.tap-target` utility (Task 5)
- Produces: `.skip-link` utility; contact form durum mesajlarında `role="alert"` / `role="status"`

- [ ] **Step 1: Başarısız testi yaz**

`tests/accessibility.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("contact form live regions", () => {
  const form = read("src/components/sections/contact-form.tsx");

  it("announces the error state assertively", () => {
    expect(form).toContain('role="alert"');
  });

  it("announces the success state politely", () => {
    expect(form).toContain('role="status"');
  });

  it("marks the submit button busy while the request is in flight", () => {
    expect(form).toContain('aria-busy={status === "loading"}');
  });

  it("keeps the honeypot hidden from assistive tech", () => {
    expect(form).toContain('aria-hidden="true"');
    expect(form).toContain("tabIndex={-1}");
  });
});

describe("focus ring", () => {
  const css = read("src/app/globals.css");

  it("uses a solid two pixel ring with a two pixel offset", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ring\)/);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline-offset:\s*2px/);
  });

  it("dropped the translucent default outline on the universal selector", () => {
    expect(css).not.toContain("outline-ring/50");
  });

  it("ships a skip link utility", () => {
    expect(css).toContain(".skip-link");
  });
});

describe("target size", () => {
  it("gives every icon-only control at least 44 CSS px", () => {
    for (const file of [
      "src/components/layout/mobile-menu.tsx",
      "src/components/layout/theme-toggle.tsx",
      "src/components/layout/footer.tsx",
    ]) {
      expect(read(file), `${file} has no tap-target`).toContain("tap-target");
    }
  });

  it("keeps the tap-target utility at 44px", () => {
    expect(read("src/app/globals.css")).toMatch(/\.tap-target\s*\{[^}]*min-h-11[^}]*min-w-11/);
  });
});
```

- [ ] **Step 2: Testi çalıştır ve kırıldığını gör**

Run: `npm test -- tests/accessibility.test.ts`
Beklenen: FAIL, en az `role="alert"`, `role="status"`, `aria-busy`, `:focus-visible` ve `.skip-link` testlerinde.

- [ ] **Step 3: Contact form durum mesajlarını canlı bölgeye çevir**

`src/components/sections/contact-form.tsx` içinde:

```tsx
      {status === "error" && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      {status === "success" && (
        <p className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {t("form.success")}
        </p>
      )}
      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? t("form.sending") : t("form.send")}
      </Button>
```

yerine:

```tsx
      {/* The status paragraphs are conditionally rendered, so the role has to
          sit on the element that appears: role=alert is assertive for the
          failure path, role=status is polite for the success path. */}
      {status === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}
      {status === "success" && (
        <p
          role="status"
          className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          {t("form.success")}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? t("form.sending") : t("form.send")}
      </Button>
```

- [ ] **Step 4: Odak halkasını solid yap**

`src/app/globals.css`'te `@layer base` içindeki:

```css
  * {
    @apply border-border outline-ring/50;
  }
```

yerine:

```css
  * {
    @apply border-border;
  }
  /* Solid accent, 2px offset. The old translucent ring disappeared on the
     neutral ground. */
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    border-radius: inherit;
  }
```

- [ ] **Step 5: Button, Input ve Textarea odak sınıflarını hizala**

`src/components/ui/button.tsx` içindeki temel sınıf dizesinde:

```
outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

yerine:

```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
```

`src/components/ui/input.tsx` ve `src/components/ui/textarea.tsx` içinde `focus-visible:ring-ring/50` ve `focus-visible:ring-[3px]` geçen parçaları aynı şekilde `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` ile değiştir; `focus-visible:border-ring` kalabilir.

- [ ] **Step 6: Skip link'i ekle**

`src/app/globals.css`'te `@layer utilities` bloğunun sonuna ekle:

```css
  .skip-link {
    @apply sr-only rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground;
  }
  .skip-link:focus-visible {
    @apply not-sr-only fixed left-4 top-4 z-50 no-underline;
  }
```

`src/app/[lang]/layout.tsx` içinde `<MotionProvider>` açılışının hemen ardına, `<Header />` satırından önce ekle:

```tsx
            <a href="#main" className="skip-link">
              {t("a11y.skipToContent")}
            </a>
```

Bunun için layout'un üstünde çeviriyi al:

```ts
import { getTranslations, setRequestLocale } from "next-intl/server";
```

ve `setRequestLocale(lang);` satırından sonra:

```ts
  const t = await getTranslations({ locale: lang, namespace: "a11y" });
```

çağırıp JSX içinde `{t("skipToContent")}` kullan.

- [ ] **Step 7: 24x24 hedef boyutu denetimini yap ve kaydet**

Şu komutla interaktif elemanların boyut sınıflarını çıkar:

```bash
grep -rn "size=\"icon\|size=\"xs\|size-7\|size-9\|size-10\|size-11\|min-h-\|h-8\|h-9\|h-11\|h-12" src/components | grep -v "svg" | sort
```

Ölçülen değerler ve WCAG 2.2 SC 2.5.8 (24x24 CSS px) karşılaştırması:

| Eleman | Dosya | Sınıf | Hesaplanan | Sonuç |
|---|---|---|---|---|
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

Bu tablo PR açıklamasına aynen kopyalanır. 24 px altında eleman yok.

- [ ] **Step 8: Testleri çalıştır**

Run: `npm test -- tests/accessibility.test.ts`
Beklenen: PASS, 9 test.

- [ ] **Step 9: Klavye ve ekran okuyucu doğrulaması**

```bash
npm run dev
```

- `http://localhost:3000/` sayfasında `Tab`'a bir kez bas: "Skip to content" linki görünür oluyor, `Enter` ile `<main>`'e atlıyor.
- `/tr` sayfasında aynı link "İçeriğe geç" yazıyor.
- Her odaklanabilir elemanda 2px solid emerald halka ve 2px boşluk görünüyor.
- `/contact` formunda boş e-posta ile gönder: hata paragrafı çıkıyor ve VoiceOver/NVDA metni okuyor (`role="alert"`).

`Ctrl+C`.

- [ ] **Step 10: Commit**

```bash
git add src/components src/app/globals.css "src/app/[lang]/layout.tsx" tests/accessibility.test.ts
git commit -m "feat(a11y): announce form status, solidify the focus ring, add a skip link

The contact form rendered its error and success paragraphs with no role and no
aria-live, so a screen reader user got no feedback after submitting. Add
role=alert and role=status plus aria-busy on the submit button, replace the 55
percent opacity focus ring with a solid two pixel outline at a two pixel offset,
add a skip to content link and put a 44px minimum on every icon only control."
```

---

### Task 9: opengraph-image ve icon route'larını gerçek kimlikle yeniden yaz

**Files:**
- Modify: `src/app/[lang]/opengraph-image.tsx` (tam yeniden yazım; `generateStaticParams`, `generateImageMetadata` ve `OG_IMAGE_*` importları korunur, bkz. Step 1)
- Modify: `src/app/icon.tsx` (tam yeniden yazım)
- Test: `tests/og-image.test.ts`

**Interfaces:**
- Consumes: `public/fonts/og/instrument-serif-latin.woff`, `public/fonts/og/instrument-serif-latin-ext.woff` (Task 1); `src/lib/seo/og-image.ts` (`OG_IMAGE_ID`, `OG_IMAGE_SIZE`, `OG_IMAGE_CONTENT_TYPE`, Faz 2 çıktısı); `src/lib/site-config.ts` (`siteConfig.person`, Faz 2 çıktısı); `messages/{en,tr}.json` `metadata.ogAlt`
- Produces: `/opengraph-image/default` (EN, prefix'siz) ve `/tr/opengraph-image/default` (TR) 1200x630 PNG, `/icon` 32x32 PNG (DCY monogram)

**İçerik kaynağı** (`.local/content/portfolio-content.md`, bölüm 0 ve 1):
- İsim: `Doğan Can Yıldız`
- Unvan: `Full-Stack Web Developer & DevOps Engineer`
- OG alt satırı: `Full-Stack & DevOps · Konya, Türkiye`

- [ ] **Step 1: OG görselini yeniden yaz**

`src/app/[lang]/opengraph-image.tsx` dosyasının tamamını şununla değiştir. `generateStaticParams`, `generateImageMetadata` (boş `params` fallback'i dahil) ve `src/lib/seo/og-image.ts`'ten gelen `OG_IMAGE_*` importları korunuyor; yalnızca render gövdesi şablon metninden gerçek kimliğe geçiyor ve `alt` hâlâ `generateImageMetadata` içinden, çeviriden geliyor, sabit bir `export const alt` OLMUYOR:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_ID,
  OG_IMAGE_SIZE,
} from "@/lib/seo/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

// Palette: 03-tasarim-ui-ux.md dark column.
const GROUND = "#0a0c0f";
const SURFACE = "#14171b";
const TEXT = "#f1f3f4";
const MUTED = "#999fa6";
const ACCENT = "#4fcc8d";
const HAIRLINE = "#2a2e33";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

// Next calls this once with empty params to enumerate the image ids, then once
// per locale while prerendering, so `lang` has to fall back to the default
// locale instead of being handed to next-intl as undefined. This is the same
// fallback Faz 2 already needed for the same reason, do not drop it.
async function resolveLocale(paramsPromise: Promise<{ lang: string }>) {
  const { lang } = await paramsPromise;
  return hasLocale(routing.locales, lang) ? lang : routing.defaultLocale;
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return [{ id: OG_IMAGE_ID, size, contentType, alt: t("ogAlt") }];
}

// satori cannot parse woff2, so these are the woff copies vendored under
// public/, which the standalone build always ships. Two subsets are passed
// because the latin file has no g-breve or dotted capital I.
async function loadDisplayFonts() {
  const base = join(process.cwd(), "public", "fonts", "og");
  const [latin, latinExt] = await Promise.all([
    readFile(join(base, "instrument-serif-latin.woff")),
    readFile(join(base, "instrument-serif-latin-ext.woff")),
  ]);
  return [
    { name: "Instrument Serif", data: latin, weight: 400 as const, style: "normal" as const },
    { name: "Instrument Serif", data: latinExt, weight: 400 as const, style: "normal" as const },
  ];
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  const { person } = siteConfig;
  const fonts = await loadDisplayFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: GROUND,
          fontFamily: "Instrument Serif",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: SURFACE,
              border: `1px solid ${HAIRLINE}`,
              color: TEXT,
              fontSize: "26px",
              letterSpacing: "0.04em",
            }}
          >
            DCY
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                background: ACCENT,
              }}
            />
            <div style={{ fontSize: "22px", color: MUTED, letterSpacing: "0.14em" }}>
              dogancanyildiz.sh
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "86px", color: TEXT, lineHeight: 1.05 }}>
            {person.name}
          </div>
          <div style={{ fontSize: "34px", color: MUTED, lineHeight: 1.3 }}>
            {person.jobTitle[locale]}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: "28px",
            fontSize: "24px",
            color: MUTED,
          }}
        >
          {person.location.city}, Türkiye
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
```

`export const runtime = "edge"` geri eklenmez (Faz 0'da kaldırıldı, Global Constraints: edge runtime kullanılmaz). `size` ve `contentType` `og-image.ts`'teki sabitlerden geliyor ki `buildOpenGraph`'ın işaret ettiği boyut ile burada üretilen görsel hiç ayrışamasın.

- [ ] **Step 2: Favicon'u yeniden yaz**

`src/app/icon.tsx` dosyasının tamamını şununla değiştir:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 03-tasarim-ui-ux.md dark ground and accent.
          background: "#0a0c0f",
          color: "#4fcc8d",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        DCY
      </div>
    ),
    { ...size }
  );
}
```

Monogram ASCII olduğu için varsayılan yüz yeterli, ek font yüklenmiyor.

- [ ] **Step 3: Testi yaz**

`tests/og-image.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("opengraph image", () => {
  const source = read("src/app/[lang]/opengraph-image.tsx");

  it("draws the real identity from site-config, not the template copy", () => {
    expect(source).toContain("siteConfig");
    expect(source).toContain("person.name");
    expect(source).toContain("person.jobTitle[locale]");
    expect(source).not.toContain("Building clean, fast");
    expect(source).not.toContain("Portfolio</p>");
  });

  it("keeps the alt text locale-driven instead of a fixed export", () => {
    expect(source).not.toMatch(/export const alt =/);
    expect(source).toContain('namespace: "metadata"');
    expect(source).toContain('t("ogAlt")');
  });

  it("keeps the per-locale image metadata plumbing", () => {
    expect(source).toContain("generateStaticParams");
    expect(source).toContain("generateImageMetadata");
    expect(source).toContain("hasLocale(routing.locales, lang)");
    expect(source).toContain("routing.defaultLocale");
  });

  it("takes size, contentType and the image id from the shared og-image source", () => {
    expect(source).toContain("OG_IMAGE_SIZE");
    expect(source).toContain("OG_IMAGE_CONTENT_TYPE");
    expect(source).toContain("OG_IMAGE_ID");
    expect(source).toContain("@/lib/seo/og-image");
  });

  it("uses the neutral palette from the design doc", () => {
    expect(source).toContain("#0a0c0f");
    expect(source).toContain("#4fcc8d");
    expect(source).not.toContain("#09090b");
    expect(source).not.toContain("#27272a");
  });

  it("loads both Instrument Serif subsets so Turkish glyphs render", () => {
    expect(source).toContain("instrument-serif-latin.woff");
    expect(source).toContain("instrument-serif-latin-ext.woff");
    expect(source).not.toContain(".woff2");
  });

  it("stays off the edge runtime", () => {
    expect(source).not.toContain('runtime = "edge"');
  });
});

describe("icon", () => {
  const source = read("src/app/icon.tsx");

  it("renders the DCY monogram on the new palette", () => {
    expect(source).toContain("DCY");
    expect(source).toContain("#0a0c0f");
    expect(source).toContain("#4fcc8d");
    expect(source).not.toContain("background: \"black\"");
  });
});
```

- [ ] **Step 4: Testi çalıştır**

Run: `npm test -- tests/og-image.test.ts`
Beklenen: PASS, 8 test.

- [ ] **Step 5: Görselleri gerçekten üret ve gözle kontrol et**

Görsel dosya adına giden yol `id` segmentini taşıyor (`generateImageMetadata`'nın döndürdüğü `OG_IMAGE_ID`, bugün `"default"`), ayrıca route `[lang]` altında olduğu için EN prefix'siz, TR `/tr` altında yayınlanır (Faz 2'de doğrulandı, bkz. `docs/plans/handoffs/faz-2.md`):

```bash
npm run build
npm start &
sleep 4
curl -s -o /tmp/og-en.png -w "%{http_code} %{content_type} %{size_download}\n" http://localhost:3000/opengraph-image/default
curl -s -o /tmp/og-tr.png -w "%{http_code} %{content_type} %{size_download}\n" http://localhost:3000/tr/opengraph-image/default
curl -s -o /tmp/icon.png -w "%{http_code} %{content_type} %{size_download}\n" http://localhost:3000/icon
kill %1
```

Beklenen: üç satır da `200 image/png` ve 1000 byte'tan büyük bir boyut.

`/tmp/og-en.png` dosyasını aç ve doğrula:
- "Doğan Can Yıldız" satırında `ğ` ve `ı` karakterleri gerçekten çiziliyor, kutu (tofu) yok.
- Zemin `#0a0c0f`, başlık serif, alt satır gri, unvan İngilizce.
- Sol üstte DCY rozeti ve yeşil nokta var.

`/tmp/og-tr.png` dosyasında aynı düzen ama unvan TR çevirisiyle (`Full-Stack Web Geliştirici ve DevOps Mühendisi`) çiziliyor, `ğ`/`ı` yine tofu değil.

`/tmp/icon.png` dosyasında DCY üç harfi kırpılmadan görünüyor.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[lang]/opengraph-image.tsx" src/app/icon.tsx tests/og-image.test.ts
git commit -m "feat(og): rebuild the social image and favicon with the real identity

The OG card still shipped the create-next-app copy ('Building clean, fast
experiences for the web') and the favicon was a letter P on black. Both now
carry the real name, title and location on the neutral palette, with the DCY
monogram, sourced from siteConfig.person so the two locales get their own job
title. generateStaticParams, generateImageMetadata and its empty-params
fallback stay as Faz 2 left them; only the render body and the alt copy
changed. The OG card loads the vendored Instrument Serif woff files, both
subsets, because satori cannot read woff2 and the latin subset has no g-breve."
```

---

### Task 10: Görsel doğrulama, faz kapanışı ve PR

**Files:**
- Modify: yok (doğrulama ve teslim)

**Interfaces:**
- Consumes: Task 1-9'un tüm çıktıları
- Produces: `feature/faz-3-tasarim-sistemi` -> `main` PR'ı

- [ ] **Step 1: Tüm kapıları çalıştır**

```bash
npm run typecheck && npm run lint && npm run format && npm test && npm run build
```

Beklenen: beşi de exit 0.

- [ ] **Step 2: Build çıktısında route tiplerinin bozulmadığını doğrula**

```bash
npm run build 2>&1 | grep -E "^\s*[○ƒ]" | sort -u
```

Beklenen: yalnızca `/api/contact` ve `/api/health` satırları `ƒ` (Dynamic), tüm içerik route'ları `○` (Static). Faz 2'nin kazanımı Faz 3'te kaybedilmemiş olmalı.

- [ ] **Step 3: Font isteklerinin tamamının kendi origin'inden geldiğini doğrula**

```bash
npm run build
npm start &
sleep 4
curl -s http://localhost:3000/tr | grep -o 'href="[^"]*\.woff2"' | sort -u
curl -s http://localhost:3000/tr | grep -c "fonts.googleapis.com\|fonts.gstatic.com" || echo "no google font request: OK"
kill %1
```

Beklenen: yalnızca `/_next/static/media/...woff2` yolları listeleniyor (üç adet preload: sans, mono, display latin) ve `no google font request: OK` yazıyor.

- [ ] **Step 4: Görsel doğrulama, ekran görüntüsü kontrol listesi**

```bash
npm run dev
```

Aşağıdaki 14 maddenin her biri için ekran görüntüsü al ve PR açıklamasına ekle. Her satır tek tek işaretlenir:

Masaüstü, 1440px, light tema, `http://localhost:3000/`:
- [ ] h1 serif (Instrument Serif) render ediliyor, sistem serif'ine düşmüyor (harflerin `g` kuyruğu ve `a` formu ile ayırt edilir).
- [ ] Gövde metni Geist Sans, yıl/rozet/metrik metinleri Geist Mono.
- [ ] Zeminde renkli gradyan yok, yalnızca üst kısımda sönen çok soluk bir grid var.
- [ ] Emerald yalnızca birincil butonda, linklerin hover'ında ve "available" noktasında görünüyor.

Masaüstü, 1440px, dark tema (tema anahtarıyla):
- [ ] Zemin `#0a0c0f` tonunda koyu nötr, yeşile çalmıyor.
- [ ] İkincil metin (muted) gövde metninden açıkça daha soluk, marka rengiyle aynı değil.

Mobil, 390px genişlik (DevTools cihaz emülasyonu), `/`:
- [ ] Hamburger butonu görünüyor, masaüstü nav listesi gizli.
- [ ] Dialog açılıyor, dört link listeleniyor, `Escape` kapatıyor.
- [ ] Footer'da "Pages" bloğu dört linki gösteriyor.

`/tr` (390px ve 1440px):
- [ ] "Doğan", "İçeriğe geç", "Menüyü aç" gibi metinlerde `ğ`, `İ`, `ş`, `ı` karakterleri gövde fontuyla aynı yüzde çiziliyor, fallback fonta düşmüyor (harf genişliği ve x-yüksekliği komşu harflerle tutarlı).

`/projects` (1440px):
- [ ] Liste satır formatında: mono yıl, başlık, rol, sağda mono stack.
- [ ] Satırın boş alanına tıklamak detay sayfasına götürüyor.

`/contact`:
- [ ] Boş e-posta ile gönderildiğinde kırmızı hata paragrafı çıkıyor ve odak halkası solid yeşil, 2px offset.

DevTools -> Rendering -> `prefers-reduced-motion: reduce`:
- [ ] Sayfa yenilendiğinde hiçbir fade veya kayma yok, içerik ilk boyamada yerinde.

`Ctrl+C` ile dev sunucusunu kapat.

- [ ] **Step 5: Faz 3 tripwire grep'lerini çalıştır**

```bash
grep -rn "emerald" src/ && echo "FAIL" || echo "no emerald reference: OK"
grep -rn "rgba(" src/ && echo "FAIL" || echo "no rgba literal: OK"
grep -rn "font-fraunces" src/ && echo "FAIL" || echo "no dead font token: OK"
grep -rn "next/font/google\|fonts.googleapis.com" src/ && echo "FAIL" || echo "no google fonts: OK"
grep -rn "framer-motion\|whileInView" src/ && echo "FAIL" || echo "no legacy motion: OK"
grep -c "oklch(0.516 0.114 157.2)" src/app/globals.css || echo "old shared token gone: OK"
```

Beklenen: altı satır da `OK` ile bitiyor.

- [ ] **Step 6: Em dash taraması**

```bash
grep -rn "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" src/ messages/ docs/plans/2026-08-27-faz-3-tasarim-sistemi.md && echo "FAIL" || echo "no em dash or en dash: OK"
```

Beklenen: `no em dash or en dash: OK`.

- [ ] **Step 7: PR'ı aç**

```bash
git push -u origin feature/faz-3-tasarim-sistemi
gh pr create --base main --head feature/faz-3-tasarim-sistemi \
  --title "Faz 3: design system (typography, palette, layout, motion, accessibility)" \
  --body "$(cat <<'EOF'
Implements Faz 3 of docs/10-yol-haritasi.md, following docs/03-tasarim-ui-ux.md.

## What changed
- Geist Sans, Geist Mono and Instrument Serif woff2 subsets vendored into src/fonts and loaded with next/font/local. Each latin and latin-ext subset is a separate loader with its own unicode-range, so Turkish glyphs stay on the real typeface.
- The dead --font-fraunces reference is gone: h1 uses the serif display face, h2 to h4 use Geist Sans.
- Token blocks moved from the Tailwind emerald ramp to a neutral palette. Emerald now lives in --primary, --ring and the new --status-up / --status-down tokens only.
- Body gradient, grid overlay, the emerald tinted surface-panel shadow and every rgba() literal removed. No CSS gradient stands in for a missing project cover any more.
- Radix Dialog mobile menu below md, page links in the footer.
- Motion moved to a strict LazyMotion + domAnimation provider with the m component, a shared 40ms stagger capped at four items, useReducedMotion and a global prefers-reduced-motion CSS fallback.
- Project list is now editorial rows (year, title, role, stack). ProjectCard stops wrapping the card in a Link: the title is the link, an ::after overlay carries the click area.
- Accessibility: role=alert and role=status on the contact form messages, aria-busy on submit, solid 2px focus ring at a 2px offset, skip to content link, 44px minimum on every icon only control.
- OG image and favicon rebuilt with the real name, title and the new palette (DCY monogram).

## Done criteria
See "Bitti sayılma kriteri" in docs/plans/2026-08-27-faz-3-tasarim-sistemi.md. All commands in that section pass on this branch.

## Target size audit (WCAG 2.2 SC 2.5.8)
Paste the table from Task 8 Step 7 here.

## Screenshots
Paste the 14 screenshots from Task 10 Step 4 here.
EOF
)"
```

- [ ] **Step 8: Devir notunu doldur**

Planın sonundaki "Devir notu şablonu" bölümünü doldurup PR'a yorum olarak ekle ve Faz 4 ajanına ilet.

---

## Bitti sayılma kriteri

Aşağıdaki komutların tamamı `feature/faz-3-tasarim-sistemi` dalında, temiz bir çalışma ağacında çalıştırılır ve belirtilen çıktıyı verir.

**1. Kod kapıları**

```bash
npm run typecheck && npm run lint && npm run format && npm test && npm run build
```
Beklenen: beş komut da exit 0. `npm test` çıktısında en az 5 test dosyası ve 45'in üzerinde geçen test.

**2. Hiçbir Google Fonts isteği yok, tüm fontlar yerel**

```bash
npm run build && npm start &
sleep 4
curl -s http://localhost:3000/ | grep -o 'href="[^"]*\.woff2"' | sort -u
curl -s http://localhost:3000/ | grep -c "fonts.googleapis.com\|fonts.gstatic.com" || echo "OK"
kill %1
```
Beklenen: yalnızca `/_next/static/media/*.woff2` yolları, ardından `OK`.

**3. Vendor edilmiş font dosyaları repoda ve gerçek**

```bash
ls -1 src/fonts/*.woff2 | wc -l
ls -1 public/fonts/og/*.woff | wc -l
```
Beklenen: `6` ve `2`.

**4. md altı ekranda mobil menü çalışıyor**

```bash
npm run dev &
sleep 4
curl -s http://localhost:3000/ | grep -c 'aria-label="Open menu"'
curl -s http://localhost:3000/tr | grep -c 'aria-label="Menüyü aç"'
kill %1
```
Beklenen: `1` ve `1`. Ayrıca 390px genişlikte tarayıcıda dialog açılıp About/Projects/Contact linklerine ulaşılıyor (Task 10 Step 4 ekran görüntüleri).

**5. prefers-reduced-motion saygısı**

```bash
grep -c "@media (prefers-reduced-motion: reduce)" src/app/globals.css
grep -rc "useReducedMotion" src/components src/lib | grep -v ":0" | wc -l
```
Beklenen: `1` ve `6`'dan büyük bir sayı (hareket kullanan her bileşen). Görsel doğrulama: DevTools'ta `reduce` açıkken sayfada hiçbir fade veya kayma yok.

**6. Palet artıkları temizlendi**

```bash
grep -rn "emerald" src/ ; echo "exit=$?"
grep -rn "rgba(" src/ ; echo "exit=$?"
grep -c "oklch(0.516 0.114 157.2)" src/app/globals.css ; echo "exit=$?"
```
Beklenen: üç grep de sonuç döndürmüyor, `exit=1` yazıyor.

**7. `--primary` ve `--muted-foreground` ayrı değerlerde**

```bash
grep -A40 "^:root {" src/app/globals.css | grep -E "^\s*--(primary|muted-foreground):"
grep -A40 "^\.dark {" src/app/globals.css | grep -E "^\s*--(primary|muted-foreground):"
```
Beklenen: her blokta iki farklı oklch değeri; light `oklch(0.4794 0.1156 156.3)` ve `oklch(0.5044 0.0114 252.9)`, dark `oklch(0.7591 0.1444 158.0)` ve `oklch(0.6998 0.0123 252.1)`.

**8. Route'lar hâlâ statik (Faz 2 kazanımı korundu)**

```bash
npm run build 2>&1 | grep -E "^\s*ƒ"
```
Beklenen: yalnızca `/api/contact` ve `/api/health`.

**9. OG görseli ve favicon gerçek kimlikle üretiliyor**

```bash
npm run build && npm start &
sleep 4
curl -s -o /tmp/og-en.png -w "%{http_code} %{content_type}\n" http://localhost:3000/opengraph-image/default
curl -s -o /tmp/og-tr.png -w "%{http_code} %{content_type}\n" http://localhost:3000/tr/opengraph-image/default
curl -s -o /tmp/icon.png -w "%{http_code} %{content_type}\n" http://localhost:3000/icon
kill %1
```
Beklenen: üç satır da `200 image/png`. `/tmp/og-en.png` görsel kontrolünde "Doğan Can Yıldız" tofu olmadan çiziliyor.

**10. Üslup kuralı**

```bash
grep -rn "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" src/ messages/ ; echo "exit=$?"
```
Beklenen: sonuç yok, `exit=1`.

---

## Devir notu şablonu

Faz 3 kapandığında aşağıdaki şablon doldurulup Faz 4 ajanına verilir.

```markdown
# Faz 3 devir notu

## Yapıldı
- [ ] Font vendoring: `src/fonts/*.woff2` (6 dosya), `public/fonts/og/*.woff` (2 dosya), `scripts/vendor-fonts.mjs`, `npm run vendor:fonts`
- [ ] `src/fonts/index.ts`: altı `next/font/local` yükleyicisi, subset başına `unicode-range`
- [ ] `globals.css`: nötr `:root` / `.dark` token blokları, `--status-up` / `--status-down`, sade body zemini, solid focus ring, `prefers-reduced-motion` fallback, `.tap-target`, `.skip-link`, `.pull-quote`
- [ ] `src/lib/nav.ts`, `src/components/layout/mobile-menu.tsx`, yeniden yazılan `header.tsx` ve `footer.tsx`
- [ ] `src/lib/motion.ts`, `src/components/motion-provider.tsx`, tüm bileşenlerde `m` + `LazyMotion`
- [ ] `src/components/sections/project-row.tsx`, satır tabanlı `projects-section.tsx`, `::after` tıklama alanlı `project-card.tsx`
- [ ] `role="alert"` / `role="status"` + `aria-busy`, skip link, 24x24 denetim tablosu
- [ ] `opengraph-image.tsx` ve `icon.tsx` gerçek isim, unvan ve DCY monogramıyla

## Doğrulandı
- [ ] `npm run typecheck && npm run lint && npm run format && npm test && npm run build` exit 0
- [ ] Ağ sekmesinde hiçbir Google Fonts isteği yok, `/_next/static/media/*.woff2` 6 dosya
- [ ] `/tr` sayfalarında `ğ İ ş ı` gövde fontuyla çiziliyor
- [ ] 390px'te mobil menü açılıyor, `Escape` kapatıyor, dört link çalışıyor
- [ ] `prefers-reduced-motion: reduce` açıkken hiçbir animasyon çalışmıyor
- [ ] `grep -rn "emerald\|rgba(\|font-fraunces" src/` sonuç vermiyor
- [ ] Build çıktısında yalnızca `/api/*` dynamic
- [ ] `/opengraph-image/default`, `/tr/opengraph-image/default` ve `/icon` 200 image/png, tofu yok
- [ ] 14 maddelik ekran görüntüsü kontrol listesi PR'a eklendi

## Açık kaldı (Faz 4'e devrediliyor)
- [ ] `messages/*.json` içindeki `footer.twitter` anahtarı artık kullanılmıyor, içerik temizliğinde silinecek
- [ ] `t("contact.email")` hâlâ şablon adresi döndürüyor, gerçek adresle değiştirilecek
- [ ] `footer.tsx` sosyal linkleri (`github.com/dogancanyildiz`, `linkedin.com/in/dogancanyildiz`) doğrulanmadı, gerçek profil URL'leriyle teyit edilecek
- [ ] `hero.tsx` metrik kutuları (`5+`, `12`, `UI + FE`) hâlâ şablon değer
- [ ] Proje kapak alanı bilinçli olarak boş: gerçek ekran görüntüleri `next/image` ile eklenecek, gradyan placeholder geri gelmeyecek
- [ ] Blog listesi ve yazı sayfası için satır formatı `project-row.tsx` deseninden türetilecek
- [ ] Ana sayfadaki "systems" bölümü Faz 5'te `--status-up` / `--status-down` token'larını kullanacak

## Üretilen arayüzler (Faz 4 ve Faz 5 bunları tüketir)

| Arayüz | İmza |
|---|---|
| `@/fonts` | `fontVariables: string`, `geistSans`, `geistSansExt`, `geistMono`, `geistMonoExt`, `instrumentSerif`, `instrumentSerifExt` |
| CSS değişkenleri | `--font-sans-latin`, `--font-sans-ext`, `--font-mono-latin`, `--font-mono-ext`, `--font-display-latin`, `--font-display-ext`, `--font-sans-stack`, `--font-mono-stack`, `--font-display-stack` |
| Renk token'ları | `--status-up`, `--status-down` ve Tailwind karşılıkları `bg-status-up`, `text-status-up`, `bg-status-down`, `text-status-down` |
| Utility sınıfları | `.tap-target`, `.skip-link`, `.pull-quote`, `.eyebrow` (mono), `.surface-panel` (nötr gölge) |
| `@/lib/nav` | `navItems: readonly { href: string; key: string }[]`, `type NavItem` |
| `@/lib/motion` | `STAGGER_SECONDS: number`, `MAX_STAGGER_ITEMS: number`, `staggerDelay(index: number): number`, `fadeUp(reduced: boolean): Variants`, `staggerContainer(reduced: boolean): Variants`, `staggerItem(reduced: boolean): Variants` |
| `@/components/motion-provider` | `MotionProvider({ children }: { children: ReactNode }): JSX.Element` |
| `@/components/layout/mobile-menu` | `MobileMenu(): JSX.Element` |
| `@/components/sections/project-row` | `ProjectRow({ project, index, variants }: { project: Project; index: number; variants?: Variants }): JSX.Element` |
| Mesaj anahtarları | `nav.menu`, `nav.openMenu`, `nav.closeMenu`, `footer.navTitle`, `a11y.skipToContent` |
| Test dosyaları | `tests/fonts.test.ts`, `tests/design-tokens.test.ts`, `tests/motion.test.ts`, `tests/accessibility.test.ts`, `tests/og-image.test.ts` |
```
