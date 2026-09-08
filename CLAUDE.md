@AGENTS.md

# dogancanyildiz.com

Kişisel site ve portfolyo: Next.js 16 App Router, React 19, next-intl (TR kökte,
EN `/en` altında), Tailwind 4, shadcn/ui, velite MDX, vitest. Coolify üzerinde
Docker ile `main` dalından yayınlanır, Cloudflare önünde durur. Tek geliştirici.

Bu dosya bulut ve yerel ajanların ortak başlangıç noktasıdır. Ayrıntı için
`docs/README.md` ve oradan `docs/00-ozet-ve-karar.md` okunur; panel adımları
`docs/deploy/`, açık işler `docs/11-acik-isler.md`.

## Çalışma kuralları

- Dil: Türkçe, doğal ve doğrudan. Uzun çizgi (em dash) hiçbir yerde kullanılmaz;
  virgül, iki nokta, parantez veya kısa çizgi kullanılır. Kalıp giriş ve
  kapanış cümleleri, gereksiz emoji ve başlık yığını yok.
- Commit ve PR'lar repo sahibi adına yazılır: `Co-Authored-By`, "Generated with"
  veya başka bir yapay zeka imzası eklenmez.
- Commit mesajları Conventional Commits (`feat`, `fix`, `chore`, `docs`,
  `content` ...); sürüm ve CHANGELOG bunlardan üretilir (`scripts/release-version.mjs`).
- Dallanma: `feature/*` → `dev` (squash) → `main` (merge commit). `main`'e
  doğrudan push yok; `release.yml` etiket ve GitHub Release üretir, ardından
  `chore(release): sync version` PR'ı dev'e döner.
- Sürüm çıkarma yalnızca sahibinin "devi maine çıkar" demesiyle yapılır.

## Kalite kapıları

Her PR'dan önce sırayla:

```bash
npx velite --clean --strict   # tsc ve testler #site/content'i buradan okur
npm run typecheck
npm run lint
npm run test
npm run format                # prettier --check .
npm run verify:docs
```

Üretim build'i `NEXT_PUBLIC_SITE_URL=https://www.dogancanyildiz.com npm run build`
ister; `output: standalone`. Sitemap, JSON-LD ve başlıklar için `next start`
ile çıktıyı curl ile doğrulamak alışkanlıktır.

## Sabit kararlar

- Kanonik host `www.dogancanyildiz.com`; apex 301 ile www'ya gider
  (Cloudflare kuralı). Varsayılan dil Türkçe, yollar yerelleştirilmiş
  (`/hakkimda`, `/en/about`); eski yollar `src/i18n/legacy-paths.ts` ile 308.
- Sunucu IP'si, parolalar ve SMTP bilgileri hiçbir dosyaya yazılmaz;
  dokümanlarda `<ORIGIN_IPV4>` gibi yer tutucular kullanılır.
- Umami izinsiz yüklenir (çerezsiz), özel olaylar `src/lib/analytics-events.ts`.
- CV iki dilde `public/cv/`, profil fotoğrafı `public/images/profile.webp`;
  ikisi de dizine açık ve sitemap'te.
- `audit/` ve `.local/` yerel çalışma notlarıdır, git dışındadır; bulut
  ortamında yoktur ve gerekmez.
