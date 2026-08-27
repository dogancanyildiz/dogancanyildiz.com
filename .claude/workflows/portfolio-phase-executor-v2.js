export const meta = {
  name: 'portfolio-phase-executor-v2',
  description: 'Bir fazı task bazlı alt ajanlarla yürüt: haiku plan ayrıştırır ve model atar, her task için uygulayıcı + opus inceleme + düzeltme, Fable entegrasyon ve devir notu, iki bağımsız doğrulayıcı',
  phases: [
    { title: 'Parse', detail: 'planı task listesine çevir, model ata (haiku)' },
    { title: 'Tasks', detail: 'task başına uygula (model task türüne göre) → opus inceleme → düzeltme' },
    { title: 'Integrate', detail: 'kapılar, bitti kriteri, devir notu (fable)' },
    { title: 'Verify', detail: 'kapsam doğrulayıcı + adversarial inceleme (opus)' },
    { title: 'Fix', detail: 'bloklayan bulgular için tek düzeltme turu' },
  ],
}

// args: { phase: number, planPath: string, branch: string, baseRef: string, handoffPath: string|null, reportNotes: string }
const REPO = '/Users/dogancanyildiz/Dev/DCYLDZ/portfolio'
const HANDOFF_DIR = REPO + '/docs/plans/handoffs'
const { phase: N, planPath, branch, baseRef, handoffPath, reportNotes } = args

const RULES = `
KURALLAR (ihlal edilemez):
- Repo: ${REPO}. Çalışma dalı: ${branch}. Asla main'e commit etme, asla push etme, asla PR açma; bunları ana oturum yapar.
- Commit mesajları Conventional Commits, İngilizce, AI atfı veya Co-Authored-By satırı YOK.
- Kod yorumu, site metni ve commit mesajında em dash / en dash yok.
- .local/ okunabilir ama commit edilmez, Docker image'a girmez. Sırlar dosyaya yazılmaz.
- Plan adımı gerçekte uygulanamıyorsa (API değişmiş, araç yok, docker daemon yok) durup gerekçeyi raporla, uydurma.
- Sahibinin panel adımları (Coolify, Cloudflare, Traefik, Resend, DNS) kodla yapılamaz: checklist olarak yaz, "uygulandı" deme.
- Skill aracıyla code-review / security-review gibi fork tabanlı skill çağırma. Agent aracı bu oturumda alt ajanlara kapalı; işi kendin yap.
`

const TASKS_SCHEMA = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'number' },
          title: { type: 'string' },
          startLine: { type: 'number' },
          endLine: { type: 'number' },
          model: { type: 'string', enum: ['haiku', 'sonnet', 'opus'] },
          kind: { type: 'string', description: 'mechanical | code | architecture | checklist' },
          why: { type: 'string' },
        },
        required: ['n', 'title', 'startLine', 'endLine', 'model', 'kind', 'why'],
      },
    },
    doneCriteriaStartLine: { type: 'number' },
    globalConstraintsStartLine: { type: 'number' },
    totalLines: { type: 'number' },
  },
  required: ['tasks', 'doneCriteriaStartLine', 'globalConstraintsStartLine', 'totalLines'],
}

phase('Parse')
log(`Faz ${N}: plan ayrıştırılıyor`)
const parsed = await agent(`Plan dosyasını oku: ${planPath} (tamamını, gerekirse parça parça; \`wc -l\` ile toplam satırı al ve \`grep -n "^## Task\\|^### Task\\|Bitti sayılma kriteri\\|## Global Constraints" ${planPath}\` ile başlıkları bul).
Her "Task N:" başlığı için: n, title, başlangıç satırı (başlık satırı), bitiş satırı (bir sonraki task başlığından bir önceki satır; son task için Bitti kriteri başlığından önce), ve model ataması:
- haiku: mekanik işler (bağımlılık yükseltme, dosya silme/taşıma, config/JSON/YAML yazma, checklist dokümanı yazma, README, script ekleme) ve tek dosyalık basit değişiklikler.
- sonnet: yeni kod + test yazımı, bileşen/route uygulama, orta karmaşıklık.
- opus: mimari değişiklik (klasör yapısı, i18n routing, içerik pipeline kurulumu), güvenlik kritik kod, çok dosyalı refactor, karmaşık hata ayıklama riski olan task'lar.
Emin değilsen bir üst modeli seç. Ayrıca Global Constraints ve Bitti sayılma kriteri başlıklarının satır numaralarını döndür.`,
  { label: `parse:faz-${N}`, phase: 'Parse', schema: TASKS_SCHEMA, model: 'haiku' })

if (!parsed || !parsed.tasks.length) throw new Error('Plan ayrıştırılamadı')
log(`${parsed.tasks.length} task: ` + parsed.tasks.map(t => `${t.n}:${t.model}`).join(' '))

const IMPL_SCHEMA = {
  type: 'object',
  properties: {
    commits: { type: 'array', items: { type: 'string' } },
    filesChanged: { type: 'array', items: { type: 'string' } },
    gates: { type: 'array', items: { type: 'object', properties: { command: { type: 'string' }, passed: { type: 'boolean' }, output: { type: 'string' } }, required: ['command', 'passed', 'output'] } },
    deviations: { type: 'array', items: { type: 'string' } },
    blocked: { type: 'boolean' },
    blockedReason: { type: 'string' },
    notesForNext: { type: 'string' },
  },
  required: ['commits', 'filesChanged', 'gates', 'deviations', 'blocked', 'blockedReason', 'notesForNext'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean' },
    blocking: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } }, required: ['title', 'evidence', 'fix'] } },
    nonBlocking: { type: 'array', items: { type: 'string' } },
  },
  required: ['passed', 'blocking', 'nonBlocking'],
}

const commonCtx = (t) => `
${RULES}
Faz ${N}, Task ${t.n}: ${t.title}
Plan dosyası: ${planPath}. Bu task'ın metni satır ${t.startLine}-${t.endLine} arasında (Read ile offset=${t.startLine}, limit=${t.endLine - t.startLine + 1}). Global Constraints satır ${parsed.globalConstraintsStartLine} civarında; onu da oku.
Önceki fazın devir notu: ${handoffPath || 'yok'} (varsa "Sonraki faza uyarılar" ve "Üretilen arayüzler" bölümlerini oku).
Ek notlar: ${reportNotes || 'yok'}
`

phase('Tasks')
const taskResults = []
let stopped = null
for (const t of parsed.tasks) {
  const prev = taskResults.length ? `Önceki task'ların notları: ${taskResults.map(r => `Task ${r.n}: ${r.impl.notesForNext}`).join(' | ')}` : ''
  log(`Task ${t.n} (${t.model}): ${t.title}`)
  const impl = await agent(`${commonCtx(t)}
${prev}
GÖREV: Bu task'ı planındaki adımlarla birebir uygula. Önce \`git status --porcelain\` boş olduğunu ve dalın ${branch} olduğunu doğrula (dal yoksa \`git checkout -b ${branch} ${baseRef}\`). Adımlar: testi yaz, başarısız olduğunu gör, kodu yaz, testi ve lint'i çalıştır, commit at (plandaki mesajla). Plandaki kod gerçek API ile uyuşmuyorsa düzelt ve "deviations" alanına yaz. Task bittiğinde \`npm run typecheck && npm run lint && npm test\` çalıştır ve sonuçları gates'e yaz. Uygulanamıyorsa blocked=true ve gerekçe.`,
    { label: `impl:t${t.n}`, phase: 'Tasks', schema: IMPL_SCHEMA, model: t.model, effort: t.model === 'opus' ? 'high' : undefined })
  if (!impl) { stopped = `Task ${t.n} uygulayıcı sonuç döndürmedi`; break }
  if (impl.blocked) { taskResults.push({ n: t.n, title: t.title, model: t.model, impl, review: null, fix: null }); stopped = `Task ${t.n} bloklandı: ${impl.blockedReason}`; break }

  const review = await agent(`${commonCtx(t)}
İNCELEME: Bu task'ın commit'leri: ${JSON.stringify(impl.commits)}. \`git show\` veya \`git diff ${baseRef}...HEAD -- <dosyalar>\` ile değişiklikleri oku (${JSON.stringify(impl.filesChanged)}). Plan metnindeki her adımın (dosyalar, arayüz imzaları, testler, commit) gerçekten yapıldığını, yer tutucu kalmadığını, testlerin anlamlı olduğunu, kuralların (çizgi yasağı, atıf yasağı, sır yok) korunduğunu ve kodun gerçek API'lerle (Next 16, next-intl 4, velite 0.4, motion 13) uyuştuğunu denetle. Testleri kendin de çalıştır. Gerçekten kırık olanı blocking, kalanını nonBlocking yaz; kanıtsız iddia yok.`,
    { label: `review:t${t.n}`, phase: 'Tasks', schema: REVIEW_SCHEMA, model: 'opus' })

  let fix = null
  if (review && review.blocking.length) {
    log(`Task ${t.n}: ${review.blocking.length} bloklayan bulgu, düzeltiliyor`)
    const fixModel = t.model === 'haiku' ? 'sonnet' : t.model
    fix = await agent(`${commonCtx(t)}
DÜZELTME: Şu bloklayan bulguları düzelt: ${JSON.stringify(review.blocking, null, 1)}. Her düzeltme için test ekle/güncelle, kapıları (typecheck, lint, test) çalıştır, "fix: ..." ile commit at.`,
      { label: `fix:t${t.n}`, phase: 'Tasks', schema: IMPL_SCHEMA, model: fixModel })
  }
  taskResults.push({ n: t.n, title: t.title, model: t.model, impl, review, fix })
}

phase('Integrate')
log('Entegrasyon: kapılar, bitti kriteri, devir notu')
const INTEG_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    head: { type: 'string' },
    commits: { type: 'array', items: { type: 'string' } },
    doneCriteria: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, command: { type: 'string' }, result: { type: 'string' }, passed: { type: 'boolean' } }, required: ['check', 'command', 'result', 'passed'] } },
    manualSteps: { type: 'array', items: { type: 'string' } },
    handoffPath: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['branch', 'head', 'commits', 'doneCriteria', 'manualSteps', 'handoffPath', 'notes'],
}
const integ = await agent(`${RULES}
Sen Faz ${N} entegrasyon liderisin. Plan: ${planPath} (Bitti sayılma kriteri satır ${parsed.doneCriteriaStartLine}'dan itibaren; Devir notu şablonu bölümü de orada). Önceki devir notu: ${handoffPath || 'yok'}.
Task sonuçları: ${JSON.stringify(taskResults.map(r => ({ n: r.n, title: r.title, model: r.model, commits: r.impl.commits, deviations: r.impl.deviations, reviewBlocking: r.review ? r.review.blocking.map(b => b.title) : [], reviewNonBlocking: r.review ? r.review.nonBlocking : [], fixCommits: r.fix ? r.fix.commits : [] })), null, 1)}
${stopped ? 'DİKKAT, iş akışı durdu: ' + stopped : ''}
GÖREV: (1) Dal ${branch} üzerinde git status temiz mi, tüm task commit'leri var mı kontrol et. (2) Tüm kapıları çalıştır: npm run typecheck, lint, test, format, build (NEXT_PUBLIC_SITE_URL gerekiyorsa .env.local'dan). (3) Planın "Bitti sayılma kriteri" komutlarının her birini çalıştır ve sonucu kaydet; başarısız olan varsa ve küçükse düzelt ve commit at, büyükse raporla. (4) ${HANDOFF_DIR}/faz-${N}.md devir notunu yaz (Yapılanlar tablosu commit'lerle, Doğrulananlar komut+çıktı, Açık kalanlar, Üretilen arayüzler, Sonraki faza uyarılar, Manuel adımlar, Task başına kullanılan model ve inceleme özeti) ve ${HANDOFF_DIR}/faz-${N}-manual-checklist.md manuel adımları yaz; ikisini commit et. (5) Dönmeden önce git status temiz olmalı.`,
  { label: `integrate:faz-${N}`, phase: 'Integrate', schema: INTEG_SCHEMA, model: 'fable', effort: 'max' })

if (!integ) throw new Error('Entegrasyon sonuç döndürmedi')

phase('Verify')
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
const verifiers = await parallel([
  () => agent(`Bağımsız doğrulayıcısın. Repo ${REPO}, dal ${integ.branch} (HEAD ${integ.head}). Planı oku: ${planPath}. Devir notu: ${integ.handoffPath}. Her task'ın gerçekten uygulandığını dosyaları okuyarak doğrula; npm run lint, typecheck, test, format, build ve planın Bitti kriteri komutlarını KENDİN yeniden çalıştır. Eksik, yarım, yer tutucu veya "yapıldı" denip yapılmamış her şeyi blocking yaz, kanıtla (dosya:satır / komut çıktısı). Salt dokümantasyon veya panel adımlarını (checklist) blocking sayma.`,
    { label: `verify:coverage-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
  () => agent(`Adversarial incelemecisin. Repo ${REPO}. \`git diff ${baseRef}...${integ.branch}\` ile tüm değişikliği oku. Lensler: güvenlik (sır sızıntısı, injection, rate limit bypass, .local sızıntısı, CSP), doğruluk (Next 16 / next-intl 4 / velite 0.4 / motion 13 gerçek API; şüphede context7 ile doğrula), i18n kuralları (fallback sayfa yok, hreflang self-reference), üslup (em dash yok, commit'lerde AI atfı yok: \`git log ${baseRef}..${integ.branch} --format=%B\`). Gerçekten kırılanı blocking, kalanı nonBlocking; kanıtsız iddia yok.`,
    { label: `verify:adversarial-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
])
const vs = verifiers.filter(Boolean)
let blocking = vs.flatMap(v => v.blocking)
log(`Doğrulama: ${blocking.length} bloklayan bulgu`)

let fixResult = null, reverify = null
if (blocking.length) {
  phase('Fix')
  fixResult = await agent(`${RULES}
Düzeltme turu, dal ${integ.branch}. Bloklayan bulgular: ${JSON.stringify(blocking, null, 1)}
Her bulguyu düzelt, test ekle, kapıları çalıştır, ayrı "fix: ..." commit'leri at; devir notuna (${integ.handoffPath}) "Düzeltme turu" bölümü ekleyip commit et. git status temiz bırak.`,
    { label: `fix:faz-${N}`, phase: 'Fix', schema: { type: 'object', properties: { fixed: { type: 'array', items: { type: 'string' } }, unfixed: { type: 'array', items: { type: 'string' } }, commits: { type: 'array', items: { type: 'string' } } }, required: ['fixed', 'unfixed', 'commits'] }, model: 'opus', effort: 'high' })
  reverify = await agent(`Yeniden doğrulama, dal ${integ.branch}. Şu bulguların kapandığını dosya ve komutla doğrula: ${JSON.stringify(blocking.map(b => b.title))}. npm run lint, typecheck, test, build koş. Hâlâ açık olanları blocking döndür.`,
    { label: `reverify:faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus' })
  blocking = reverify ? reverify.blocking : blocking
}

return {
  phase: N,
  parsed: parsed.tasks.map(t => ({ n: t.n, title: t.title, model: t.model, kind: t.kind })),
  taskResults: taskResults.map(r => ({ n: r.n, model: r.model, commits: r.impl.commits, deviations: r.impl.deviations, reviewBlocking: r.review ? r.review.blocking.length : null, reviewNonBlocking: r.review ? r.review.nonBlocking : [], fixCommits: r.fix ? r.fix.commits : [] })),
  stopped,
  integ,
  verifiers: vs,
  fixResult,
  reverify,
  finalBlocking: blocking,
  ready: !stopped && blocking.length === 0,
}
