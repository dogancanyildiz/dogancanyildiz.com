export const meta = {
  name: 'portfolio-phase-verify',
  description: 'Bitmiş bir faz dalını bağımsız doğrula: kapsam doğrulayıcı + adversarial inceleme (opus), bloklayan bulgu varsa tek düzeltme turu ve yeniden doğrulama',
  phases: [
    { title: 'Verify', detail: 'kapsam + adversarial, paralel (opus)' },
    { title: 'Fix', detail: 'bloklayanlar için tek düzeltme turu (opus)' },
  ],
}

// args: { phase: number, planPath: string, branch: string, baseRef: string, handoffPath: string }
const REPO = '/Users/dogancanyildiz/Dev/DCYLDZ/portfolio'
const { phase: N, planPath, branch, baseRef, handoffPath } = args

const RULES = `
KURALLAR: Repo ${REPO}, dal ${branch}. Asla push/PR/main commit yok. Commit mesajları Conventional Commits, İngilizce, AI atfı yok. Em dash / en dash yok. .local/ commit edilmez. .claude/workflows/ altındaki değişiklikler ana oturuma ait, dokunma ve commit etme; git status kontrolünde hariç tut. Fork tabanlı skill (code-review, security-review) çağırma. Docker probları için 3000 yerine boş port kullan ve container'ları temizle.
`

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    blocking: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['title', 'evidence', 'fix'] } },
    nonBlocking: { type: 'array', items: { type: 'string' } },
    rerun: { type: 'array', items: { type: 'object', properties: { command: { type: 'string' }, passed: { type: 'boolean' }, output: { type: 'string' } }, required: ['command', 'passed', 'output'] } },
  },
  required: ['passed', 'blocking', 'nonBlocking', 'rerun'],
}

phase('Verify')
log(`Faz ${N} doğrulama: ${branch} vs ${baseRef}`)
const verifiers = await parallel([
  () => agent(`${RULES}
Bağımsız kapsam doğrulayıcısısın; devir notuna güvenme, kendin bak. Planı oku: ${planPath}. Devir notu: ${handoffPath}. \`git log --oneline ${baseRef}..${branch}\` ile commit'leri al. Planın her task'ı için dosyaları okuyarak gerçekten uygulanıp uygulanmadığını denetle; npm run lint, typecheck, test, format, build ve planın "Bitti sayılma kriteri" komutlarını KENDİN yeniden çalıştır (docker gerekiyorsa boş portla). Eksik, yarım, yer tutucu, "yapıldı" denip yapılmamış her şeyi blocking yaz ve kanıtla (dosya:satır / komut çıktısı). Sahibinin panel adımlarını (checklist) blocking sayma; ama checklist'te yanlış/uydurma komut veya URL varsa blocking.`,
    { label: `verify:coverage-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
  () => agent(`${RULES}
Adversarial incelemecisin. \`git diff ${baseRef}...${branch}\` ile tüm değişikliği oku. Lensler: güvenlik (sır sızıntısı, injection, rate limit bypass, .local/.env sızıntısı, CSP, Dockerfile non-root ve HEALTHCHECK, CI'da secret kullanımı), doğruluk (Next 16 / next-intl 4 / velite 0.4 / motion 13 gerçek API; Coolify/Cloudflare/Traefik iddiaları; şüphede context7 veya web ile doğrula), i18n kuralları (fallback sayfa yok, hreflang self-reference), üslup (em dash yok; \`git log ${baseRef}..${branch} --format=%B\` içinde AI atfı yok). Gerçekten kırılanı blocking, kalanı nonBlocking; kanıtsız iddia yok.`,
    { label: `verify:adversarial-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
])
const vs = verifiers.filter(Boolean)
let blocking = vs.flatMap(v => v.blocking)
log(`Doğrulama: ${blocking.length} bloklayan bulgu`)

let fixResult = null, reverify = null
if (blocking.length) {
  phase('Fix')
  fixResult = await agent(`${RULES}
Düzeltme turu. Bloklayan bulgular: ${JSON.stringify(blocking, null, 1)}
Her bulguyu düzelt (test ekle/güncelle), kapıları çalıştır (typecheck, lint, test, format, build), ayrı "fix: ..." commit'leri at; devir notuna (${handoffPath}) "Düzeltme turu" bölümü ekleyip commit et; düzeltemediğini gerekçesiyle unfixed'e yaz. git status (executor dosyaları hariç) temiz kalsın.`,
    { label: `fix:faz-${N}`, phase: 'Fix', schema: { type: 'object', properties: { fixed: { type: 'array', items: { type: 'string' } }, unfixed: { type: 'array', items: { type: 'string' } }, commits: { type: 'array', items: { type: 'string' } } }, required: ['fixed', 'unfixed', 'commits'] }, model: 'opus', effort: 'high' })
  reverify = await agent(`${RULES}
Yeniden doğrulama. Şu bulguların kapandığını dosya ve komutla doğrula: ${JSON.stringify(blocking.map(b => b.title))}. npm run lint, typecheck, test, format, build koş. Hâlâ açık olanları blocking döndür.`,
    { label: `reverify:faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus' })
  blocking = reverify ? reverify.blocking : blocking
}

return { phase: N, verifiers: vs, fixResult, reverify, finalBlocking: blocking, nonBlocking: vs.flatMap(v => v.nonBlocking), ready: blocking.length === 0 }
