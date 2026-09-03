# Changelog

Bu projedeki kayda değer değişiklikler bu dosyada durur.

Biçim [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) üzerine kurulu,
sürümleme [Semantic Versioning](https://semver.org/spec/v2.0.0.html) izler.
`[Unreleased]` altındaki her girdi `scripts/release-version.mjs` tarafından
`main`'e ulaşan Conventional Commits'ten üretilir; gruplar Features, Fixes
ve Other (sürüm otomasyonu bu İngilizce başlıkları arar).

## [Unreleased]

## [0.9.1] - 2026-09-03

### Fixes

- `4d6917b` denetim 4. tur kod maddeleri, .sh ve preview kapsam dışı (#75)

### Other

- `0a98258` **release**: sync version v0.9.0 (#73)

**Tam değişiklik listesi**: [v0.9.0...v0.9.1](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.9.0...v0.9.1)

## [0.9.0] - 2026-09-03

### Features

- `2209761` **systems**: sürüm hücresi GitHub'daki son sürümü okur (#70)

### Other

- `73bae7c` **release**: sync version v0.8.0 (#69)

**Tam değişiklik listesi**: [v0.8.0...v0.9.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.8.0...v0.9.0)

## [0.8.0] - 2026-09-03

### Features

- `670ae81` **systems**: commit hücresi sürüm oldu, yayın saati İstanbul dilimine geçti (#67)

### Other

- `050c7b9` **release**: sync version v0.7.0 (#64)

**Tam değişiklik listesi**: [v0.7.0...v0.8.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.7.0...v0.8.0)

## [0.7.0] - 2026-09-03

### Features

- `b045434` **systems**: canlı durum widget'ı ve commit için SOURCE_COMMIT geri dönüşü (#62)

### Other

- `816fef6` faz 1 arama görünürlüğü metin rötuşları (#60)
- `f4ac45e` **release**: sync version v0.6.0 (#61)

**Tam değişiklik listesi**: [v0.6.0...v0.7.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.6.0...v0.7.0)

## [0.6.0] - 2026-09-03

### Features

- `bab8e6b` **docker**: fall back to SOURCE_COMMIT and build time for build info (#56)

### Other

- `cb62642` yürütülmüş planları arşive al, karar dokümanlarını birleştir ve güncel duruma çek (#57)
- `b5809bf` **release**: sync version v0.5.0 (#55)

**Tam değişiklik listesi**: [v0.5.0...v0.6.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.5.0...v0.6.0)

## [0.5.0] - 2026-09-03

### Features

- `db9da07` **analytics**: load umami without consent and add custom events (#53)

### Other

- `e147ee7` **deploy**: apex yönlendirmesi Coolify'da, healthcheck host düzeltmesi (#52)
- `3ff1f63` **release**: sync version v0.4.0 (#50)
- `00f2ff4` depo adı dogancanyildiz.com oldu, lisans ayrımı ve README rozetleri (#49)

**Tam değişiklik listesi**: [v0.4.0...v0.5.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.4.0...v0.5.0)

## [0.4.0] - 2026-09-02

### Features

- `9402f39` marka paketi, sertifika rozetleri, Türkçe yollar ve www kanonik host (#45)
- `8570f6a` **copy**: site metni tek teslim vaadi etrafında yeniden yazıldı (#43)
- `54fe007` **copy**: rewrite the site copy around a single delivery promise (#42)
- `3ccc2c5` **i18n**: make Turkish the default locale with localized URLs (#36)
- `13a97da` identity, consent, contact topic and WhatsApp (#35)
- `5b212b1` **infra**: add Gatus status widget, Umami stack, and analytics CSP

### Fixes

- `06c0b35` **deps**: restore npm audit fix after lockfile rebase regression (#32) (#47)
- `c0156c0` denetim takip turu, consent geri alma, erişilebilirlik hedefleri ve backend sertleştirmesi (#44)
- `bd17329` **deploy**: NEXT_PUBLIC_STATUS_URL build zincirine bağlanır, bayat Resend/Gatus uçları süpürülür (#39)
- `98ae97f` **ui**: use brand-icon components after lucide 1.34 brand removal
- `085e3dd` replace lucide brand icons removed in lucide-react 1.0 with simple-icons

### Other

- `8e6561b` record the ultrareview closure and dependency bumps in the living documents (#41)
- `ddd5d1f` **deps**: bump the npm-minor-patch group across 1 directory with 4 updates (#40)
- `829ff70` Gözlemlenebilirlik panele, e-posta Mailcow'a; dil değiştirici blocker'ı ve doküman tazeleme (#37)
- `d12bf84` Denetim kapanışı: 28 Ağustos bulgularının kod tarafı, strict TS, tipli ESLint, render testleri (#34)
- `5677397` **release**: sync version v0.3.1 (#33)
- `b3101fd` **deps**: restore npm audit fix dropped during Faz 5 rebase
- `e332a3f` **deps**: ignore eslint majors in dependabot until eslint-config-next supports ESLint 10
- `a04616b` **deps**: bump simple-icons from 15.22.0 to 16.28.0
- `901b6c6` **deps**: npm audit fix for transitive dev dependencies
- `4dc7d12` **deps**: align @types/node and engines with Node 24, ignore majors dependabot cannot land
- `9db69a8` **deps**: bump lucide-react from 0.575.0 to 1.34.0
- `28fbfbc` **deps-dev**: bump shadcn from 3.8.5 to 4.19.0
- `55f0256` **deps**: bump the npm-minor-patch group with 7 updates
- `8303d0f` give workflows, jobs and steps readable names
- `1f11f00` **security**: dependabot, codeql, security policy and license for public repo
- `fee02e7` **release**: sync version v0.3.0

**Tam değişiklik listesi**: [v0.3.1...v0.4.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.1...v0.4.0)

## [0.3.1] - 2026-08-28

### Fixes

- `ef1c054` **deps**: restore npm audit fix after lockfile rebase regression (#32)

### Other

- `e393dee` Faz 5: altyapı vitrini, UI kapanışı ve dev hattı güncellemeleri (#31)

**Tam değişiklik listesi**: [v0.3.0...v0.3.1](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.0...v0.3.1)

## [0.3.0] - 2026-08-27

### Features

- `4cda37d` strengthen trust signals and refresh the editorial UI

### Fixes

- `fa89e6a` replace em dashes in content-panel comments
- `014b98a` satisfy eslint for footer health link and unused imports

### Other

- `4195d8f` record the repository settings behind the release flow
- `0351a76` **release**: sync version v0.2.0

**Tam değişiklik listesi**: [v0.2.0...v0.3.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.2.0...v0.3.0)

## [0.2.0] - 2026-08-27

### Features

- `4ea6ad1` **release**: tag and publish a release on every merge to main
- `6b9a31c` **domain**: make dogancanyildiz.com the primary origin

### Fixes

- `a0235be` **docs**: correct the reversed redirect direction in two decision docs
- `f7b3f46` **domain**: update sitemap test regex missed by the .sh to .com sweep

### Other

- `8b76bbc` align the decision records with the .com domain and release flow
- `444d92b` describe the branching and release flow
- `068dad1` run the quality gate on dev and main
- `62eb3bf` **domain**: record the primary domain change

**Tam değişiklik listesi**: [v0.1.0...v0.2.0](https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.1.0...v0.2.0)

## [0.1.0] - 2026-08-27

Yeniden kurulan portfolyonun tabanı: `docs/10-yol-haritasi.md`'deki Faz 0–4,
faz başına bir pull request ile merge edildi.

### Features

- **güvenlik ve hijyen** ([#2]): `next.config.ts`'te güvenlik başlıkları ve
  Content Security Policy, `output: "standalone"`, `/api/health` rotası,
  rate limit ve honeypot alanıyla sertleştirilmiş `/api/contact`, kalite
  kapısının çalıştırdığı `typecheck`, `test` ve `format` betikleri.
- **dağıtım hattı** ([#3]): root olmayan koşucuyla çok aşamalı `Dockerfile`,
  `.dockerignore`, yerel doğrulama için `docker-compose.yml`, GitHub
  Actions kalite kapısı, `docs/deploy/` altında Coolify, Cloudflare, Traefik
  ve Resend kurulum checklist'leri.
- **uluslararasılaştırma** ([#4]): next-intl yönlendirme (o tarihte İngilizce
  kökte, Türkçe `/tr` altında), `[lang]` segmenti, locale duyarlı proxy,
  `messages/en.json` ve `messages/tr.json` katalogları.
- **tasarım sistemi** ([#5]): tasarım token katmanı, tipografi ölçeği,
  hareket primitifleri, yerleşim kabuğu, Radix mobil menülü gezinme, tema
  değişimi ve birim testlerin kilitlediği erişilebilirlik güvenceleri.
- **içerik ve yayın** ([#6]): proje ve yazı şemalarıyla Velite içerik hattı,
  iki dilde vaka çalışmaları ve blog yazıları, proje ve blog rotaları, dil
  başına RSS, hreflang alternatifli sitemap, JSON-LD ve gerçek profil metni.

### Other

- Depo belgelendirmesi: `docs/` altında mimari karar kayıtları,
  `docs/plans/` altında yürütülebilir faz planları, onlara eşlik eden devir
  notları ve elle checklist'ler.

[#2]: https://github.com/dogancanyildiz/dogancanyildiz.com/pull/2
[#3]: https://github.com/dogancanyildiz/dogancanyildiz.com/pull/3
[#4]: https://github.com/dogancanyildiz/dogancanyildiz.com/pull/4
[#5]: https://github.com/dogancanyildiz/dogancanyildiz.com/pull/5
[#6]: https://github.com/dogancanyildiz/dogancanyildiz.com/pull/6
[Unreleased]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.9.1...HEAD
[0.9.1]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/commits/main
