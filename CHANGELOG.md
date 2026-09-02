# Changelog

Bu projedeki kayda değer değişiklikler bu dosyada durur.

Biçim [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) üzerine kurulu,
sürümleme [Semantic Versioning](https://semver.org/spec/v2.0.0.html) izler.
`[Unreleased]` altındaki her girdi `scripts/release-version.mjs` tarafından
`main`'e ulaşan Conventional Commits'ten üretilir; gruplar Features, Fixes
ve Other (sürüm otomasyonu bu İngilizce başlıkları arar).

## [Unreleased]

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
[Unreleased]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dogancanyildiz/dogancanyildiz.com/commits/main
