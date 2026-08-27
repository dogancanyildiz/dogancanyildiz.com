# Faz 0 devir notu: Güvenlik ve hijyen

Tarih: 2026-08-27 · Dal: `feature/faz-0-guvenlik-ve-hijyen` (main `e239564` üzerinden) · Plan: `docs/plans/2026-08-27-faz-0-guvenlik-ve-hijyen.md`

Durum: kod tarafı tamam; 10 task commit'i, 2 inceleme düzeltme commit'i (`58bc79e`, `4a987eb`) ve 2 devir notu commit'i yerel dalda (toplam 14). Push ve PR site sahibine bırakıldı (bkz. Manuel adımlar). Süreç notu (şeffaflık için): faz lideri oturum başındaki ToolSearch sonucunu yanlış yorumlayıp Agent aracının bulunmadığına kanaat getirdi ve Task 1-10'u alt ajan açmadan, plan brief'leri, rapor dosyaları ve kapılarla doğrudan uyguladı. Son incelemede `code-review` skill'i (fork) 10 bulgu üretti; bulgular istendiğinde yeniden başlatılan fork, düzeltmeleri kendisi commit'ledi (`58bc79e`), devir notunu commit'ledi (`b398dd5`) ve SDD çalışma alanını sildi. Bunun ardından Agent aracının mevcut olduğu fark edildi: kalan düzeltme sonnet alt ajanına verildi (`4a987eb`), düzeltme aralığı opus alt ajanı tarafından yeniden incelendi (bkz. Son inceleme). Güvenlik incelemesi faz lideri tarafından doğrudan yapıldı.

## Yapılanlar

Commit'ler (main..HEAD, sırayla):

| Commit | Task | Özet |
| --- | --- | --- |
| `730747c` | 1 | `.nvmrc` (24), `engines.node >=20.9`, `typecheck` / `test` / `format` / `format:write` script'leri, prettier 3.9.6 ve vitest 4.1.11, `vitest.config.mts`, `src/lib/utils.test.ts`, tüm repo tek prettier geçişiyle normalize edildi, `package-lock.json` npm 11.16.0 ile yeniden üretildi |
| `b74925c` | 2 | `next` ve `eslint-config-next` 16.3.3, `framer-motion` kaldırıldı, `motion` 13.1.1 (exact), 11 import `motion/react`'e taşındı |
| `498a806` | 3 | `next.config.ts`: `output: "standalone"`, `poweredByHeader: false`, 4 güvenlik başlığı + CSP; `opengraph-image.tsx` edge runtime satırı silindi |
| `daabc06` | 4 | `src/lib/env.ts` (+ 9 test), `robots.ts` / `sitemap.ts` `example.com` fallback'i kaldırıldı, `.env.example` Coolify katmanlarıyla yeniden yazıldı |
| `b3654e8` | 5 | `src/lib/client-ip.ts` (+ 9 test) |
| `7c6fcb7` | 6 | `src/lib/rate-limit.ts` (+ 10 test) |
| `799db3b` | 7 | `src/lib/contact-validation.ts` (+ 14 test) |
| `e2b40f8` | 8 | `src/app/api/contact/route.ts` sertleştirildi (Content-Length 413, IP başına rate limit 429 + Retry-After, sunucu tarafı honeypot, jenerik hata metinleri, prod'da eksik CONTACT_EMAIL / FROM_EMAIL için 503) |
| `41f83e5` | 9 | `src/app/api/health/route.ts` (force-dynamic, `Cache-Control: no-store`) |
| `b5e87bb` | 10 | `public/` altındaki 5 create-next-app SVG'si silindi, `public/.gitkeep`, README yeniden yazıldı, `renovate.json` eklendi |
| `58bc79e` | inceleme (fork) | Son inceleme bulgularının düzeltmesi: `src/lib/request-body.ts` (chunked gövde için byte sınırlı stream okuyucu, 6 test), rate limiter'da en az aktif anahtar tahliyesi, `node:net` `isIP`, `NEXT_PUBLIC_SITE_URL` için mutlak http(s) origin doğrulaması, `layout.tsx`'te `metadataBase`, CF-Connecting-IP güven koşulunun yorum / `.env.example` / README'de düzeltilmesi |
| `4a987eb` | inceleme (sonnet) | X-Forwarded-For fallback'i istemcinin yazdığı ilk girdi yerine Traefik'in eklediği son hop'u kullanıyor (sahtelenemez, CF bayrağı açılana kadar edge adresi düzeyinde kaba), `.env.example` metni, 2 yeni test |

Plandan sapmalar (hepsi bilinçli, gerekçesiyle):

- Task 1 Step 2 (docs commit'i) atlandı: `docs/` zaten main'de (`e239564`) commit'liydi.
- `vitest.config.ts` yerine `vitest.config.mts`: `.ts` uzantısıyla vitest 4.1.11 her koşuda "ESM syntax in a file loaded as CommonJS" uyarısı basıyor; içerik plandakiyle birebir aynı.
- `.prettierignore`'a `.superpowers` satırı eklendi: SDD çalışma alanı repo kökünde yaşıyor, `prettier --check .` onu da tarıyordu; sonraki fazlar aynı skill'i kullanacak.
- `.env.example`'da `RESEND_API_KEY=` boş bırakıldı (planda `re_xxxxxxxxxxxx` vardı): sahibinin kuralı gereği sırlar yalnızca anahtar adıyla belgelenir. Diğer örnek değerler (site URL, e-posta adresleri, boolean) plandaki gibi.
- Task 3 Step 5 tarayıcı kontrolü: Chrome uzantısı bağlı olmadığı için headless Chrome + DevTools Protocol ile yapıldı (aşağıda).
- Task 10'un ilk commit'i (`55fa2e8`) `git rm` boş kalan `public/` dizinini de sildiği için `.gitkeep`, README ve `renovate.json`'ı kaçırdı; yerel ve push edilmemiş commit amend edilerek `b5e87bb` oldu (task başına tek commit korunuyor).
- Task 11 Step 4-5 (push + PR) uygulanmadı: site sahibinin kararı.
- `git pull --ff-only` çalıştırılmadı: bu oturum remote'a dokunmuyor; main `e239564`'te.

## Doğrulananlar (komut + çıktı)

Tümü `feature/faz-0-guvenlik-ve-hijyen` dalında, temiz `npm ci` sonrası (Node v24.18.0, npm 11.16.0):

```
$ rm -rf node_modules .next && npm ci
added 735 packages, and audited 736 packages in 5s          rc=0
$ npm run typecheck                                            rc=0 (çıktısız)
$ npm run lint                                                 rc=0 (çıktısız)
$ npm test
 Test Files  5 passed (5)
      Tests  45 passed (45)                                    rc=0   (58bc79e sonrası 58 test; 4a987eb sonrası 6 dosya, 60 test)
$ npm run format
All matched files use Prettier code style!                     rc=0
$ npm run build
✓ Compiled successfully in 3.1s                                rc=0
$ ls .next/standalone/server.js
.next/standalone/server.js
$ cat .nvmrc                              -> 24
$ node -e "...engines.node"               -> >=20.9
$ npm ls next motion eslint-config-next --depth=0
├── eslint-config-next@16.3.3
├── motion@13.1.1
└── next@16.3.3
$ grep -rn "framer-motion" src package.json; echo "exit=$?"     -> exit=1
$ grep -rn 'runtime = "edge"' src; echo "exit=$?"               -> exit=1
```

Çalışma zamanı (`npm run start -- -p 3123`, üretim build'i):

```
$ curl -sI http://localhost:3123/ | grep -iE "x-powered-by|x-content-type-options|referrer-policy|permissions-policy|content-security-policy"
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
$ curl -sI http://localhost:3123/ | grep -ci x-powered-by        -> 0
$ curl -s http://localhost:3123/ | grep -c __next_f              -> 1
health   -> 200   ({"status":"ok","uptime":1,"timestamp":"2026-08-27T02:04:22.465Z"}, cache-control: no-store)
home     -> 200
honeypot -> 400   ({"error":"Invalid request. A name, a valid email address and a message are required."}, sunucu logu: "[contact] honeypot triggered")
bad email -> 400
long message (5001 karakter) -> 400
oversized body (20000 karakter) -> 413
rate limit (temiz sunucu, RESEND_API_KEY boş): request 1..5 -> 503, request 6 -> 429, retry-after: 600
RESEND_API_KEY=re_invalid_key_for_testing + e-postalar: {"error":"Message could not be sent. Please try again later."} HTTP 500; sunucu logunda "[contact] resend rejected the message { statusCode: 401, name: 'validation_error', message: 'API key is invalid' }"
prod'da CONTACT_EMAIL yok: HTTP 503 jenerik mesaj; logda "[contact] email configuration error Error: CONTACT_EMAIL is not set ..."
$ curl -s http://localhost:3123/robots.txt   -> "Sitemap: https://dogancanyildiz.sh/sitemap.xml"
$ curl -s http://localhost:3123/sitemap.xml  -> <loc>https://dogancanyildiz.sh</loc> ... (example.com yok)
```

Env sertleştirmesi:

```
$ mv .env.local .env.local.bak && npm run build; echo "exit=$?"; mv .env.local.bak .env.local
Error occurred prerendering page "/robots.txt"
Error: NEXT_PUBLIC_SITE_URL is not set. It is a required build time variable, set it in .env.local for local builds and as a Build variable in Coolify.
exit=1
```

Repo hijyeni:

```
$ ls public/ | wc -l                                  -> 0  (yalnızca .gitkeep)
$ grep -rn "Deploy on Vercel" README.md; echo $?      -> exit=1
$ node -e "JSON.parse(...renovate.json)"              -> renovate OK
$ git log --oneline main..HEAD | wc -l                -> 10
$ git log main..HEAD --format=%B | grep -c <uzun/orta cizgi>  -> 0
   (AI atıf / co-author satırı yok; "regenerated with npm" satırı grep'te yanlış pozitif)
$ git diff --name-only e239564..HEAD | grep -E '^(\.env\.local|\.local/|\.nodeterm/|node_modules/|\.next/)'  -> (boş)
```

Tarayıcı CSP kontrolü (headless Chrome, DevTools Protocol, `http://localhost:3123/`): `Log.entryAdded`, `Runtime.exceptionThrown` ve konsol error/warning listeleri boş (CSP ihlali yok); hydration tamam (tema düğmesi etkin, 8 script kaynağı yüklendi); tema düğmesi iki tıklamada `html` class'ı `dark -> dark -> light`, `localStorage.theme` `dark -> light`.

İnceleme düzeltmesi (58bc79e) sonrası problar (`RESEND_API_KEY= npm run start -- -p 3123`):

```
chunked 195 KB gövde (Content-Length yok)   -> 413   (düzeltme öncesi 400, gövde tamamen okunuyordu)
Content-Length 195 KB                       -> 413
chunked küçük geçerli gövde                  -> 503   (gövde okunuyor, anahtar yok)
og:image                                     -> https://dogancanyildiz.sh/opengraph-image?...   (öncesi http://localhost:PORT/...)
honeypot -> 400; 6. istek -> 429
kapılar: typecheck, lint, test 58/58 (6 dosya), format, build, çizgi kontrolü -> hepsi rc 0
```

İkinci düzeltme (4a987eb) sonrası problar (sonnet alt ajanı, `npm run start -- -p 3123`, RESEND_API_KEY yok):

```
og:image                                      -> https://dogancanyildiz.sh/opengraph-image?8a00cf2af784c582
195 KB gövde, Transfer-Encoding: chunked      -> 413
195 KB gövde, Content-Length                  -> 413
honeypot / geçersiz e-posta / bozuk JSON      -> 400 / 400 / 400
X-Forwarded-For "203.0.113.5, 203.0.113.4" x6 -> 503 x5, sonra 429 (Retry-After: 588)
X-Forwarded-For "203.0.113.9, 203.0.113.4"    -> 429 (aynı son hop, aynı kova)
X-Forwarded-For "203.0.113.4, 203.0.113.7"    -> 503 (farklı son hop, yeni kova)
/api/health                                   -> 200
kapılar: typecheck, lint, test 60/60 (6 dosya), format, build, çizgi kontrolü -> hepsi rc 0
```

Geliştirme modu CSP (`npm run dev -- -p 3125`): `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws:; ...`, `/` 200, X-Powered-By yok; yani `isProduction` ayrımı iki tarafta da doğru başlığı üretiyor.

Ek (Faz 1 girdisi): `PORT=3124 HOSTNAME=127.0.0.1 node .next/standalone/server.js` -> `/api/health` 200, `/` 200, CSP başlığı var. Standalone sunucu `public/` ve `.next/static` kopyalanmadan da ayağa kalkıyor; statik varlıklar için Dockerfile'da kopyalama gerekiyor.

Kriter 7 ("example.com" grep'i) düzeltme turunda yeniden yazıldı. Eskisi "repoda `example.com` string'i hiç geçmiyor" diyordu, ama aynı planın kapsam bölümü ve `10-yol-haritasi.md`'nin Faz 0 madde listesi yalnızca `robots.ts` / `sitemap.ts` fallback'ini Faz 0'a veriyordu: kriter kendi planıyla çelişiyordu. Kriter artık `src/app`, `public`, `README.md` ve `.env.example` kapsamını ölçüyor ve bu kapsam temiz. `src/components/layout/footer.tsx`, `src/lib/i18n/translations.ts` ve `src/data/projects.ts` içindeki Alex Chen şablon metinleri (alex@example.com, you@example.com, proje `liveUrl`'leri) Faz 4'ün launch kapısında ölçülüyor. Neden Faz 0'da silinmediler: gerçek içeriğin kaynağı `.local/content/portfolio-content.md` ve o içerik Faz 4'ün işi, ayrıca Faz 2 planı bu değerleri `messages/*.json`'a birebir taşımayı şart koşuyor, Faz 0'da silinirlerse sonraki fazın planı bozulur. Değişiklik `docs/10-yol-haritasi.md` ve Faz 0 planında commit edildi.

## Açık kalanlar

- CSP `script-src 'self' 'unsafe-inline'` taşıyor. Nonce tabanlı CSP tüm route'ları dinamik render'a zorluyor, Faz 2'nin "yalnızca /api/* dynamic" kriteriyle çelişiyor. Faz 5'te Umami eklenirken CSP yeniden ele alınacak.
- `TRUST_CF_CONNECTING_IP` varsayılan `false`. Traefik `forwardedHeaders.trustedIPs` tek başına `CF-Connecting-IP`'yi korumaz (yalnızca X-Forwarded-* ailesini yönetir); bayrak ancak origin yalnızca Cloudflare'dan erişilebilir olduktan (Traefik `ipAllowList` veya sunucu güvenlik duvarı, spec 09-guvenlik.md madde 6) ve trustedIPs set edildikten SONRA `true` yapılmalı. Önce açılırsa herhangi bir peer sahte bir başlıkla istek başına yeni rate-limit kovası açabilir.
- Bayrak kapalıyken uygulama içi rate limit kaba çalışır: `getClientIp` X-Forwarded-For'un en sağdaki girdisini, yani önde duran güvenilir proxy'nin (Traefik) eklediği hop'u okur (`4a987eb`). Traefik önde olduğu sürece bu değer istemci tarafından yazılamaz; Cloudflare proxied modda Cloudflare edge adresidir, dolayısıyla aynı edge'den gelen ziyaretçiler aynı kovayı paylaşır (bir contact formu için kabul edilebilir). Ziyaretçi bazında hassasiyet `TRUST_CF_CONNECTING_IP=true` ile gelir; o da yalnızca origin Cloudflare dışına kapatıldıktan sonra açılmalı.
- Renovate GitHub App kurulu değil; `renovate.json` hazır bekliyor, automerge ancak Faz 1'deki GitHub Actions kapısından sonra anlamlı. Not: `vulnerabilityAlerts.minimumReleaseAge: null` güvenlik PR'larını bekletmeden birleştirir; tedarik zinciri açısından bilinçli bir hız/risk tercihi, sahibi isterse 1-3 güne çekilebilir.
- `npm audit`: 17 transitif bulgu (2 low, 4 moderate, 11 high), tamamı `fixAvailable: true`. Kaynaklar: `shadcn@3.8.5` -> `@modelcontextprotocol/sdk` -> hono / @hono/node-server / express / express-rate-limit / body-parser zinciri (yalnızca dev CLI) ve `resend@6.9.2` -> `svix` -> `uuid` (moderate). Plan kapsamı dışında bırakıldı; `npm audit fix --dry-run` (uygulanmadı) yalnızca semver içi değişiklikler öneriyor: `resend` 6.9.2 -> 6.24.0 (svix ve uuid ağaçtan çıkıyor), `hono` 4.12.1 -> 4.13.5, `@hono/node-server` 1.19.9 -> 1.19.17, `path-to-regexp` 8.3.0 -> 8.4.2, `qs`, `js-yaml`, `ip-address`, `flatted`, `fast-uri`, `minimatch`, `brace-expansion`, `picomatch` ve `@babel/*` patch/minor sürümleri. Force gerektiren madde yok. Ayrı bir PR'da `npm audit fix` koşup kapıları (typecheck, lint, test, build) doğrulamak yeterli görünüyor; `shadcn` major yükseltmesi zaten Faz 0 sonrası ayrı PR maddesi.
- `lucide-react`, `shadcn`, `typescript` major yükseltmeleri yapılmadı (plan gereği ayrı PR).
- İncelemede park edilen iki bulgu: (a) `renovate.json` automerge kuralları CI kapısı ve branch protection olmadan boşta kalır (Renovate varsayılanı `ignoreTests: false`), `velite` kuralı paket eklenmeden önce ölü config; plan gereği ön hazırlık, Renovate App zaten Faz 1 CI'dan sonra kurulacak. (b) `translations.ts`'teki prettier tarafından yeniden sarılan iki satır mevcut şablon metnindeki uzun çizgiyi taşıyor; Faz 2 dosyayı siliyor.
- Rate limit state'i container yeniden başlayınca sıfırlanıyor (kabul edilen risk, Cloudflare Rate Limiting kuralı Faz 1'de dış katman olarak eklenecek).
- `src/data/projects.ts` şablon projeleri içeriyor, `sitemap.ts` bunları indexliyor; Faz 4'te Velite çıktısıyla değişecek.
- `next start` çıktısında "next start does not work with output: standalone, use node .next/standalone/server.js" uyarısı var; yerel doğrulama için sorun değil, üretimde standalone `server.js` kullanılacak (Faz 1).
- `metadataBase` set edilmediği için build/start `metadataBase property in metadata export is not set` uyarısı basıyor; Faz 2'de `generateMetadata` ile birlikte çözülecek.
- `theme-toggle.tsx` `resolvedTheme` yerine `theme` okuyor; sistem temasından ilk tıklama görsel olarak boş geçiyor (system -> dark). Faz 3 maddesi.

## Üretilen arayüzler

Dosyalar:

| Yol | Rol |
| --- | --- |
| `src/lib/env.ts` | Tüm env okuma tek kapıdan (build: `NEXT_PUBLIC_SITE_URL`; runtime: `CONTACT_EMAIL`, `FROM_EMAIL`, `TRUST_CF_CONNECTING_IP`) |
| `src/lib/client-ip.ts` | Ziyaretçi IP çözümlemesi |
| `src/lib/rate-limit.ts` | Süreç içi sliding window limiter |
| `src/lib/contact-validation.ts` | Contact gövde doğrulaması |
| `src/lib/request-body.ts` | Byte sınırlı gövde okuyucu (`readBodyWithLimit`, `BodyTooLargeError`, `parseJsonBody`) |
| `src/app/api/health/route.ts` | Liveness endpoint'i |
| `vitest.config.mts` | Test sözleşmesi: node env, `src/**/*.test.ts`, `@` alias, globals kapalı |
| `.prettierrc.json`, `.prettierignore` | Biçim sözleşmesi |
| `renovate.json` | Bakım otomasyonu yapılandırması |
| `.nvmrc` | Node 24 |
| `public/.gitkeep` | Dockerfile `COPY public` için dizin garantisi |

İmzalar:

```ts
// src/lib/env.ts
export const DEV_FALLBACK_EMAIL: "onboarding@resend.dev";
export function resolveSiteUrl(value: string | undefined): string; // http(s) origin zorunlu, path/query/fragment reddedilir, sondaki / kırpılır
export function resolveRequiredEmail(name: "CONTACT_EMAIL" | "FROM_EMAIL", value: string | undefined, isProduction: boolean): string;
export function resolveTrustCloudflare(value: string | undefined): boolean;
export function siteUrl(): string;
export function contactEmail(): string;
export function fromEmail(): string;
export function trustsCloudflareHeaders(): boolean;

// src/lib/client-ip.ts
export const UNKNOWN_IP: "unknown";
export function isIpAddress(value: string): boolean;
export type ClientIpOptions = { trustCloudflare: boolean };
export function getClientIp(headers: Headers, options: ClientIpOptions): string;

// src/lib/rate-limit.ts
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };
export type RateLimiterOptions = { limit: number; windowMs: number; maxKeys?: number };
export type RateLimiter = { check(key: string, now?: number): RateLimitResult; reset(): void };
export function createRateLimiter(options: RateLimiterOptions): RateLimiter;
export const CONTACT_RATE_LIMIT: { readonly limit: 5; readonly windowMs: 600000 };
export const contactRateLimiter: RateLimiter;

// src/lib/contact-validation.ts
export const MAX_NAME_LENGTH: 100;
export const MAX_EMAIL_LENGTH: 200;
export const MAX_SUBJECT_LENGTH: 200;
export const MAX_MESSAGE_LENGTH: 5000;
export const MAX_BODY_BYTES: 16384;
export type ContactPayload = { name: string; email: string; subject?: string; message: string };
export type ValidationResult = { ok: true; data: ContactPayload } | { ok: false; reason: "invalid" | "honeypot" };
export function validateBody(body: unknown): ValidationResult;

// src/lib/request-body.ts
export class BodyTooLargeError extends Error;
export function readBodyWithLimit(request: Request, maxBytes: number): Promise<string>; // sınır aşılınca stream iptal edilir ve BodyTooLargeError fırlatılır
export function parseJsonBody(text: string): unknown; // bozuk JSON için null
```

npm script'leri: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`, `format:write`.

Env değişkenleri: `NEXT_PUBLIC_SITE_URL` (Build, zorunlu, build patlar), `RESEND_API_KEY` (Runtime), `CONTACT_EMAIL` (Runtime, prod'da zorunlu), `FROM_EMAIL` (Runtime, prod'da zorunlu), `TRUST_CF_CONNECTING_IP` (Runtime, varsayılan `false`).

HTTP sözleşmeleri:

| Yol | Metot | Yanıtlar |
| --- | --- | --- |
| `/api/health` | GET | `200 { status: "ok", uptime, timestamp }`, `Cache-Control: no-store`, dynamic |
| `/api/contact` | POST | `200 { ok: true }`; `400` geçersiz gövde veya dolu honeypot; `413` gövde > 16384 byte (Content-Length erken çıkış + okuma sırasında gerçek sınır, chunked dahil); `429` + `Retry-After` (10 dakikada 5 istek, IP başına); `503` e-posta yapılandırması eksik; `500` Resend hatası; hata yanıtlarının tümü `{ error: string }` ve jenerik metin |

Her yanıtta: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy` (yukarıdaki değer). `X-Powered-By` yok. HSTS uygulama katmanında yok (Traefik'in işi).

## Sonraki faza uyarılar

- Dockerfile `node .next/standalone/server.js` çalıştırmalı; `public/` ve `.next/static` dizinlerini standalone çıktısının yanına kopyalamalı (standalone tek başına statik chunk'ları servis etmiyor). `HOSTNAME=0.0.0.0` ve `PORT` env'leri standalone sunucu tarafından okunuyor.
- Coolify health check `/api/health`'e bağlanmalı; yanıt 200 ve `no-store`. coollabsio/coolify#7500 (HEALTHCHECK + Node) riski staging'de doğrulanmalı.
- Coolify env ayrımı: `NEXT_PUBLIC_SITE_URL` Build, diğer dördü Runtime. Ters işaretlenirse ya client bundle'da URL undefined kalır ya da RESEND_API_KEY image katmanına sızar. `.env.example`'daki "Coolify layer" yorumları kaynak.
- Traefik `forwardedHeaders.trustedIPs` Cloudflare aralıklarıyla set edildikten VE origin yalnızca Cloudflare'den erişilir hale getirildikten (Traefik ipAllowList veya host firewall, Faz 1) sonra `TRUST_CF_CONNECTING_IP=true` yapılmalı; `trustedIPs` tek başına CF-Connecting-IP'yi korumaz, o başlığı origin'e ulaşan herkes yazabilir. Bayrak kapalıyken `getClientIp` X-Forwarded-For'un son hop'unu (Traefik'in eklediği) anahtar olarak kullanır: sahtelenemez ama Cloudflare edge adresi düzeyinde kaba.
- Cloudflare Rate Limiting kuralı (`/api/contact`) Faz 1'de dış katman olarak tanımlanmalı; uygulama içi limit tek process'e bağlı.
- `.dockerignore`'a `.local/`, `.nodeterm/`, `.env*`, `.superpowers/`, `.claude/`, `docs/` girmeli (build context'e sızmasın).
- ESLint 9 flat config nokta dizinleri yok saymıyor: `.superpowers/` gibi araç dizinlerine JS dosyası konursa `npm run lint` onları da lint'ler. Bu fazda geçici script'ler oturum scratchpad'ine taşındı; kalıcı çözüm gerekirse `eslint.config.mjs`'e `globalIgnores([".superpowers/**"])` eklenir.
- Prettier `docs/` ve `public/`'ı kapsam dışı tutuyor; README dahil kök markdown dosyaları prettier'a tabi (tablolar hizalanır).
- Faz 2 i18n restructure `src/lib/i18n/translations.ts`'i silecek; oradaki uzun çizgili ve `example.com`'lu şablon metinler o zaman kendiliğinden gider. Yeni metin yazarken uzun çizgi kullanılmıyor.
- Next 16.3.3'te `next dev` repo köküne `AGENTS.md` ve `CLAUDE.md` (`@AGENTS.md` içeren tek satır) üretiyor ve her dev başlangıcında yeniden yazıyor (log: "Generated AGENTS.md and CLAUDE.md for AI agents. Set `agentRules: false` in next.config to disable"). Bu oturumda dev sunucusu yalnızca CSP doğrulaması için çalıştırıldı ve üretilen iki dosya silindi; commit'lenmedi. Karar site sahibinin: dosyaları commit etmek, `.gitignore`'a almak veya `next.config.ts`'e `agentRules: false` eklemek (seçenek 16.3.3 config şemasında mevcut). Üretilen metin uzun çizgi içeriyor, sahibinin üslup kuralıyla çelişiyor.
- `npm outdated` (2026-08-27): lockfile `tailwindcss` ve `@tailwindcss/postcss`'i 4.2.0'da tutuyor, semver içinde 4.3.3 mevcut (global kısıt 4.3.x diyor; Faz 3 tasarım sistemi fazında `npm update tailwindcss @tailwindcss/postcss` ile alınmalı). `resend` 6.9.2, wanted 6.24.0 (semver içi; svix -> uuid advisory'sini büyük olasılıkla kapatır). `radix-ui` 1.4.3 -> 1.6.7, `tailwind-merge` 3.5.0 -> 3.6.0 semver içi. Major bekleyenler: `lucide-react` 1.x, `shadcn` 4.x, `typescript` 7.x, `eslint` 10.x, `@types/node` 26.x (bilinçli olarak ayrı PR).
- `tsconfig.json` `include` alanı `.next/types/**` ve `.next/dev/types/**` içeriyor; route dosyaları silinip yeniden adlandırılırsa `.next` temizlenmeden `typecheck` eski validator tiplerine takılabilir (`rm -rf .next` çözer).

## Manuel adımlar

Kodla yapılamayan, site sahibinin uygulaması gereken adımlar `docs/plans/handoffs/faz-0-manual-checklist.md` dosyasında adım adım listelendi. Özet: (1) dalı push edip PR açmak, (2) Coolify'da env katmanlarını ve health check yolunu ayarlamak (Faz 1 ile birlikte), (3) Resend'de `dogancanyildiz.sh` domain doğrulaması ve `FROM_EMAIL`, (4) Cloudflare proxied + Full (strict) + Redirect Rule + `/api/contact` rate limiting, (5) Traefik trustedIPs sonrasında `TRUST_CF_CONNECTING_IP=true`, (6) Renovate GitHub App kurulumu (Faz 5), (7) `npm audit` bulguları için karar, (8) `next dev`'in ürettiği `AGENTS.md` / `CLAUDE.md` için karar, (9) CSP nonce sorusu (Faz 5).

## Son inceleme

- Güvenlik incelemesi (`security-review` skill'inin kriterleriyle, alt görev yerine doğrudan okuma): HIGH veya MEDIUM bulgu yok. İncelenip elenen maddeler: contact gövdesi (tip, uzunluk, e-posta deseni; düz metin e-posta, HTML sink yok), cross-site POST (kimliksiz public endpoint, kurban durumu yok), hata loglama (API anahtarı loglanmıyor), IP başlıkları (yalnızca rate-limit anahtarı, CF başlığı env bayrağına bağlı), health payload'ı (topoloji yok), CSP `'unsafe-inline'` (sertleştirme eksiği, somut açık değil), `.env.example` (sır yok), Renovate automerge (süreç tercihi, yukarıda not edildi).
- Kod incelemesi (`code-review` skill, main..HEAD, high; alt ajan bulunmadığı için tek geçişli, 3 bulgusu curl ile doğrulanmış): 10 bulgu. Düzeltme dalgaları `58bc79e` (fork) ve `4a987eb` (sonnet alt ajanı) ile 8'i kapatıldı: (1) chunked gövdenin 413 sınırını atlaması -> `request-body.ts`; (2) CF-Connecting-IP güven koşulunun yanlış anlatılması -> yorum, `.env.example`, README; (3) X-Forwarded-For en sol girdisinin taklit edilebilirliği -> `4a987eb` ile anahtar Traefik'in eklediği son hop oldu (sahtelenemez, CF bayrağına kadar kaba); (4) `maxKeys`'in gerçek bir sınır olmaması -> en az aktif anahtar tahliyesi; (5) `metadataBase` eksikliği, og:image'in localhost'a çözülmesi -> `layout.tsx`; (6) elle yazılmış IP regex'leri -> `node:net` `isIP`; (7) `NEXT_PUBLIC_SITE_URL`'in şemasız/path'li değerleri kabul etmesi -> origin doğrulaması; (8) CSP yorumundaki gerekçenin bugünkü build'de geçersiz olması -> yorum düzeltildi, nonce plan gereği alınmadı. Park edilenler: (9) Renovate automerge/velite kuralı, (10) `translations.ts` uzun çizgileri (Açık kalanlar'da). Düzeltme sonrası yeniden inceleme (`b5e87bb..4a987eb`, düzeltme turunda diff'in doğrudan okunmasıyla): sekiz düzeltmenin her biri diff'te doğrulandı, yeni kırılma görülmedi. `readBodyWithLimit` sınırı aşan chunked gövdede stream'i iptal edip `BodyTooLargeError` ile 413'e düşüyor; rate limiter'da `hits.delete` + yeniden ekleme Map insertion order'ını en az aktif sırasına çeviriyor ve tahliye döngüsü `maxKeys`'i gerçek tavan yapıyor; `getClientIp` son hop'u okuyor ve iki yeni test bunu assert ediyor; `resolveSiteUrl` yalnızca http(s) origin kabul ediyor. Kapılar düzeltme turunda yeniden koşuldu: typecheck, lint, test 60/60 (6 dosya), format, build -> hepsi rc 0.

## Düzeltme turu

Bağımsız doğrulayıcıların iki bloklayan bulgusu, düzeltme turunda kapatıldı. İkisi de kod davranışı değil, plan metni ile diskteki durumun uyuşmamasıydı; bu turda `src/` altında tek satır kod değişmedi.

| Commit | Bulgu | Ne yapıldı |
|---|---|---|
| `a75c6c9` | Dal commit'li değil: çalışma ağacında commit edilmemiş değişiklik vardı ve devir notu kodun tersini anlatıyordu | Kod tarafı zaten `4a987eb` ile commit edilmişti; ağaçta kalan devir notu ve manuel kontrol listesi düzenlemeleri commit edildi, içlerindeki çözülmemiş yer tutucu (`REREVIEW_PLACEHOLDER`) yeniden inceleme sonucuyla dolduruldu, `getClientIp` anlatımı koda göre düzeltildi. `git status --porcelain` artık boş |
| `d42008b` | Bitti kriteri 7 karşılanmıyor: `example.com` hâlâ `src/` içinde 7 yerde | Kriter metni düzeltildi (aşağıdaki gerekçe). `docs/10-yol-haritasi.md` Faz 0 kriteri, Faz 0 planının Task 11 Step 2 grep'i ve Bitti kriteri 7 artık `src/app`, `public`, `README.md`, `.env.example` kapsamını ölçüyor; şablon persona kalıntıları Faz 4'ün launch kapısına bırakıldı, planın envanter grep'iyle görünür tutuldu |

Kriter neden daraltıldı, persona neden silinmedi (seçenek b, gerekçe):

- Kriterin eski hali kendi planıyla çelişiyordu. Hem `10-yol-haritasi.md`'nin Faz 0 madde listesi hem de Faz 0 planının "kapsam dışında" bölümü yalnızca `robots.ts` / `sitemap.ts` fallback'ini Faz 0'a veriyor, gerçek içeriği açıkça Faz 4'e bırakıyor. Tek satırlık bitiş cümlesi ise tüm repoyu istiyordu.
- Persona'yı Faz 0'da silmek gerçek içerik yazmayı gerektirirdi; gerçek içeriğin kaynağı `.local/content/portfolio-content.md` ve o iş Faz 4'ün kapsamı. Uydurma isim/e-posta yazmak plan kurallarına aykırı.
- Faz 2 planı (`docs/plans/2026-08-27-faz-2-i18n-app-lang.md`, satır 48 ve 291-650) bu değerlerin `messages/en.json` ve `messages/tr.json`'a **birebir** taşınmasını şart koşuyor. Faz 0'da silinirlerse sonraki fazın plan metni diskteki koda uymaz.
- Tam temizlik kaybolmadı: `10-yol-haritasi.md`'deki Faz 4 launch kapısı `grep -ri "alex chen\|techcorp\|startupxyz\|example.com"` sıfır sonuç istiyor ve o kriter olduğu gibi duruyor.

Bu bir kapsam kararıdır, site sahibi aksini isterse persona temizliği Faz 0'a çekilebilir; o durumda Faz 2 planının 48. satırı ve mesaj dosyası örnekleri de birlikte güncellenmelidir.

Düzeltme turu kapıları (repo kökü, `4a987eb..d42008b` sonrası):

```
$ npm run typecheck                                  rc=0
$ npm run lint                                       rc=0
$ npm test        Test Files 6 passed, Tests 60 passed (60)   rc=0
$ npm run format  All matched files use Prettier code style!  rc=0
$ NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build  rc=0
$ grep -rn "example\.com" src/app public README.md .env.example next.config.ts package.json renovate.json
exit=1   (çıktı yok)
$ git status --porcelain
(boş)
```

Kapsam dışı bırakılan: bu turda push, PR ve main'e commit yapılmadı; hepsi site sahibinin kararı.
