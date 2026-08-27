export const meta = {
  name: 'portfolio-phase-executor',
  description: 'Tek bir fazı yürüt: ultracode faz lideri (alt ajanlarıyla) planı uygular, iki bağımsız doğrulayıcı denetler, gerekirse düzeltme turu, devir notu üretilir',
  phases: [
    { title: 'Execute', detail: 'faz lideri planı task task uygular, alt ajanlarını kendi seçer' },
    { title: 'Verify', detail: 'bitti kriteri yeniden koşulur + adversarial kod incelemesi' },
    { title: 'Fix', detail: 'bloklayan bulgular varsa tek düzeltme turu ve yeniden doğrulama' },
    { title: 'Handoff', detail: 'sonraki faz için devir notu' },
  ],
}

// args: { phase: number, planPath: string, branch: string, baseRef: string, handoffPath: string|null, reportNotes: string }
const REPO = '/Users/dogancanyildiz/Dev/DCYLDZ/portfolio'
const HANDOFF_DIR = REPO + '/docs/plans/handoffs'
const { phase: N, planPath, branch, baseRef, handoffPath, reportNotes } = args

const RULES = `
KURALLAR (ihlal edilemez):
- Repo: ${REPO}. Çalışma dalı: ${branch}; yoksa \`git checkout -b ${branch} ${baseRef}\` ile ${baseRef} üzerinden oluştur. Asla main'e doğrudan commit etme, asla push etme, asla PR açma; bunları ana oturum yapar.
- Agent aracı bu oturumda MEVCUTTUR (ToolSearch'e gerek yok, doğrudan Agent çağır). Task'ları alt ajanlarla uygula; kendin yalnızca koordinasyon, entegrasyon ve kapı komutlarını çalıştır.
- Skill aracıyla code-review, security-review veya başka fork tabanlı skill ÇAĞIRMA: fork senin bağlamını miras alıp senin adına StructuredOutput üretebiliyor ve ana iş akışı onu senin nihai çıktın sanıyor (Faz 0'da oldu). İnceleme için Agent aracıyla opus modelinde alt ajan aç ve incelenecek diff aralığını ver.
- Dönmeden önce: git status temiz olmalı, devir notu ve manuel kontrol listesi commit'li olmalı, tüm kapılar (typecheck, lint, test, format, build) HEAD'de yeşil olmalı. StructuredOutput'u yalnızca bunlar sağlandıktan sonra, tek kez ver.
- Commit mesajları Conventional Commits, İngilizce, AI atfı veya Co-Authored-By satırı YOK.
- Metinlerde (kod yorumu, site metni, commit) em dash / en dash yok.
- .local/ içeriği okunabilir ama asla commit edilmez, Docker image'a girmez.
- Sırlar (RESEND_API_KEY vb.) asla dosyaya yazılmaz; .env.example yalnızca anahtar adı içerir.
- Bir plan adımı gerçekte uygulanamıyorsa (API değişmiş, paket yok) durup gerekçeyi devir notuna yaz, uydurma.
- Site sahibinin manuel yapması gereken adımlar (Coolify UI, Cloudflare panel, DNS, Resend domain doğrulama) KOD ile yapılamaz: bunları docs/plans/handoffs/faz-${N}-manual-checklist.md dosyasına adım adım yaz, "uygulandı" deme.
`

const LEAD_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    commits: { type: 'array', items: { type: 'string' } },
    tasksDone: { type: 'array', items: { type: 'string' } },
    tasksSkipped: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, reason: { type: 'string' } }, required: ['task', 'reason'] } },
    doneCriteria: { type: 'array', items: { type: 'object', properties: { check: { type: 'string' }, command: { type: 'string' }, result: { type: 'string' }, passed: { type: 'boolean' } }, required: ['check', 'command', 'result', 'passed'] } },
    manualSteps: { type: 'array', items: { type: 'string' } },
    subagentsUsed: { type: 'array', items: { type: 'string' }, description: 'model:görev listesi' },
    handoffPath: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['branch', 'commits', 'tasksDone', 'tasksSkipped', 'doneCriteria', 'manualSteps', 'subagentsUsed', 'handoffPath', 'notes'],
}

phase('Execute')
log(`Faz ${N} lideri başlıyor: ${planPath}`)
const lead = await agent(`Sen Faz ${N} liderisin. Ultracode modundasın: doğruluk ve eksiksizlik hızdan önemli.
${RULES}
Önce oku: ${planPath} (uygulanacak plan, tamamı), ${handoffPath ? handoffPath + ' (önceki fazın devir notu, açık kalanları devral)' : '(önceki faz yok)'}, ${REPO}/docs/00-ozet-ve-karar.md, ${REPO}/CLAUDE.md varsa ve /Users/dogancanyildiz/.claude/CLAUDE.md (üslup ve atıf kuralları).
Ek notlar: ${reportNotes || 'yok'}

YÖNTEM: superpowers:subagent-driven-development skill'ini Skill aracıyla yükle ve uygula: planın her task'ı için taze bir alt ajan (Agent aracı) aç, iki aşamalı inceleme yap. Model seçimi (zorunlu): mekanik işler (dosya taşıma, grep, format, bağımlılık yükseltme) haiku; uygulama ve test yazımı sonnet; mimari/karmaşık hata ayıklama/güvenlik incelemesi opus. Her alt ajana ilgili task metnini, dosya yollarını ve kuralları tam ver; alt ajan bittiğinde testi ve lint'i kendin de çalıştır.
Sıra: dalı ${baseRef} üzerinden aç (varsa checkout), task'ları plan sırasıyla uygula, her task sonunda commit. Her task için alt ajanı Agent aracıyla aç (model kuralı yukarıda), alt ajan bittiğinde diff'i oku, testi ve lint'i kendin çalıştır, sonra opus modelinde ayrı bir inceleme alt ajanı ile o task'ın diff'ini incelet, bulguları kapat, sonra bir sonraki task'a geç. Tüm task'lar bitince planın "Bitti sayılma kriteri" komutlarını çalıştır ve sonuçları kaydet. Sonra devir notunu yaz: ${HANDOFF_DIR}/faz-${N}.md (bölümler: Yapılanlar, Doğrulananlar (komut + çıktı), Açık kalanlar, Üretilen arayüzler (dosya/fonksiyon/env/script adları), Sonraki faza uyarılar, Manuel adımlar). Manuel adımları ayrıca ${HANDOFF_DIR}/faz-${N}-manual-checklist.md dosyasına yaz.
Dön: şemadaki alanlar. Uygulanamayanı tasksSkipped'a gerekçesiyle koy, uydurma.`,
  { label: `lead:faz-${N}`, phase: 'Execute', schema: LEAD_SCHEMA, model: 'fable', effort: 'max', agentType: 'general-purpose' })

if (!lead) throw new Error(`Faz ${N} lideri sonuç döndürmedi`)
log(`Faz ${N}: ${lead.tasksDone.length} task bitti, ${lead.tasksSkipped.length} atlandı, ${lead.commits.length} commit`)

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
  () => agent(`Bağımsız doğrulayıcısın, lidere güvenme. Repo ${REPO}, dal ${lead.branch}. Planı oku: ${planPath}. Devir notunu oku: ${lead.handoffPath}. Planın her task'ının gerçekten uygulandığını dosyaları okuyarak ve şu komutları kendin çalıştırarak doğrula: npm run lint, npm run typecheck, npm test (varsa), npm run build, planın "Bitti sayılma kriteri" komutları. Liderin "passed" dediği her kriteri yeniden koş. Eksik, yarım veya yer tutucu bırakılmış (TODO, mock veri, "Alex Chen" bu fazda silinmesi gerekiyorsa) her şeyi blocking olarak raporla. Kanıt: dosya:satır veya komut çıktısı.`,
    { label: `verify:coverage-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
  () => agent(`Adversarial kod incelemecisisin. Repo ${REPO}, dal ${lead.branch}; \`git diff main...${lead.branch}\` ile değişiklikleri al ve oku. Lensler: güvenlik (sır sızıntısı, header injection, rate limit bypass, .local sızıntısı, CSP kırığı), doğruluk (Next 16 / next-intl 4 / velite 0.4 / motion 13 API'lerinin gerçek kullanımı; şüphede context7 ile doğrula), i18n kuralları (fallback sayfa yok, hreflang self-reference), üslup kuralları (em dash yok, commit'lerde AI atfı yok: \`git log main..${lead.branch} --format=%B\` kontrol et). Gerçekten kırılan şeyleri blocking, kalanları nonBlocking olarak raporla; kanıtsız iddia yazma.`,
    { label: `verify:adversarial-faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus', effort: 'high' }),
])
const vs = verifiers.filter(Boolean)
let blocking = vs.flatMap(v => v.blocking)
log(`Doğrulama: ${blocking.length} bloklayan bulgu`)

let fixResult = null
let reverify = null
if (blocking.length) {
  phase('Fix')
  fixResult = await agent(`Düzeltme turu. Repo ${REPO}, dal ${lead.branch}. ${RULES}
Bloklayan bulgular: ${JSON.stringify(blocking, null, 1)}
Her bulguyu düzelt (gerekirse alt ajan aç: sonnet uygulama, opus zor olanlar), testleri ve build'i çalıştır, her düzeltmeyi ayrı commit yap (fix: ...). Devir notunu (${lead.handoffPath}) "Düzeltme turu" bölümüyle güncelle. Dön: düzeltilen ve düzeltilemeyen bulgular.`,
    { label: `fix:faz-${N}`, phase: 'Fix', schema: { type: 'object', properties: { fixed: { type: 'array', items: { type: 'string' } }, unfixed: { type: 'array', items: { type: 'string' } }, commits: { type: 'array', items: { type: 'string' } } }, required: ['fixed', 'unfixed', 'commits'] }, model: 'opus', effort: 'high', agentType: 'general-purpose' })
  reverify = await agent(`Yeniden doğrulama. Repo ${REPO}, dal ${lead.branch}. Şu bulguların gerçekten kapandığını dosya ve komutla doğrula: ${JSON.stringify(blocking.map(b => b.title))}. Ayrıca npm run lint, typecheck, test, build koş. Hâlâ açık olanları blocking olarak döndür.`,
    { label: `reverify:faz-${N}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'opus' })
  blocking = reverify ? reverify.blocking : blocking
}

phase('Handoff')
return {
  phase: N,
  lead,
  verifiers: vs,
  fixResult,
  reverify,
  finalBlocking: blocking,
  nonBlocking: vs.flatMap(v => v.nonBlocking),
  handoffPath: lead.handoffPath,
  ready: blocking.length === 0,
}
