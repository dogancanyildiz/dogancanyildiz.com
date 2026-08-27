# Faz 4 görev brief'i: İçerik pipeline, gerçek içerik, blog ve yayın hazırlığı

Tarih: 2026-08-27 · Hazırlayan: kontrol oturumu (portfolio-1e) · Yürütücü: bu brief'i okuyan ayrı Claude Code oturumu

## Rolün

Sen Faz 4'ün lideri ve tek yazarısın. Bu oturum Fable modeli ve ultracode effort ile çalışmalı (değilse ilk iş olarak site sahibine `/model` ve `/effort ultracode` ayarlaması gerektiğini söyle). Kontrol oturumu (portfolio-1e) senin transkriptini bağlantılı bağlam üzerinden okur; bittiğinde devir notunu yazman yeterli, ayrıca rapor yazma.

## Önce oku (sırayla)

1. `/Users/dogancanyildiz/.claude/CLAUDE.md` (üslup: em dash yasak, AI atfı yasak) ve varsa repo `CLAUDE.md`.
2. `docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md` (uygulanacak plan, 15 task; tamamını oku).
3. `docs/plans/handoffs/faz-3.md` ("Sonraki faza uyarılar" ve "Üretilen arayüzler") ve `docs/plans/handoffs/faz-2.md` (i18n arayüzleri: `src/i18n/routing.ts`, `messages/*.json`, `src/lib/seo/locale-url.ts`, `buildAlternates`, `buildOpenGraph`).
4. `docs/00-ozet-ve-karar.md`, `docs/05-backend-icerik-ve-servisler.md`, `docs/08-icerik-stratejisi.md`, `docs/11-acik-sorular.md` (kararlar ve sahibinin cevapları).
5. `.local/content/portfolio-content.md` (gerçek içerik, gitignored; koda kopyalanacak tek kaynak).

## Girdiler ve durumları

- CV PDF: `.local/content/dogancanyildiz.pdf` mevcut. Faz 4'te `public/cv/dogancanyildiz-cv.pdf` olarak kopyalanır ve commit edilir; Download CV butonu bu yola bağlanır.
- Sertifika doğrulama linkleri: HENÜZ YOK, sahibi sonra verecek. Şemada `verifyUrl` opsiyonel; link yoksa sertifika linksiz listelenir, yer tutucu URL yazma.
- Proje ekran görüntüleri: HENÜZ YOK, sahibi sonra verecek. `cover` opsiyonel; görseli olmayan proje kapaksız yayınlanır, CSS gradyan veya stok görsel yok.
- E-posta: `me@dogancanyildiz.com`. GitHub `github.com/dogancanyildiz`, LinkedIn `linkedin.com/in/dogancanyildiz`. Logo monogramı DCY.
- Speaking: About içinde medyasız kompakt blok (etkinlik · konu · tarih); içerik dosyasında etkinlik adı ve tarih için köşeli parantezli yer tutucular varsa sahibine sor, uydurma; cevap gelene kadar bloğu render etme.
- Harp Okulu satırı nötr (not completed ifadesi yok), İngilizce CEFR kırılımı siteye girmez.
- Blog dil politikası: TR-first; ilk 3-4 yazı Türkçe, seçili 1 tanesi İngilizce. Çevirisi olmayan yazı diğer dilin sitemap ve hreflang alternates'ine girmez (fallback sayfa yok).

## Faz 3'ten devredilen küçük işler (bu fazda kapat)

- `/favicon.ico` 404 dönüyor (statik dosya icon route ile değiştirildi); ya `public/favicon.ico` ekle ya da yönlendir.
- `src/proxy.ts` matcher'ı `icon` ile BAŞLAYAN her yolu dışlıyor; yalnızca `/icon` dışlanmalı.
- `messages/*.json` içindeki `metadata.ogAlt` hâlâ "Portfolio"; gerçek kimlikle yeniden yazılır (zaten tüm metinler yeniden yazılıyor).

## Çalışma kuralları

- Dal: `feature/faz-4-icerik-ve-yayin`, `main` üzerinden (Faz 0-3 PR'ları #2-#5 merge edildi). Tek dal, tek PR.
- Alt ajanlar: her task için Agent aracıyla taze bir alt ajan (mekanik işler haiku, kod ve test sonnet, mimari/güvenlik/karmaşık opus), task bitince opus modelinde ayrı bir inceleme alt ajanı. `subagent_type: "fork"` KULLANMA. Aynı anda tek uygulayıcı; tek yazar sensin, commit'leri sen atarsın. `git add -A` kullanma, dosya seçerek ekle.
- Her task: test önce (vitest), uygulama, `npm run typecheck && npm run lint && npm test && npm run format`, commit (Conventional Commits, İngilizce, AI atfı / Co-Authored-By YOK). Build ve `npm run verify:routes` her büyük adımdan sonra; tüm içerik route'ları statik kalmalı, yalnızca `/api/*` dynamic.
- Metinlerde (EN ve TR site metni, kod yorumu, commit, doküman) em dash (U+2014) ve en dash (U+2013) YOK.
- `.local/` içeriği okunur ama commit edilmez; Docker build context'ine girmez (`.dockerignore` zaten hariç tutuyor). Sırlar dosyaya yazılmaz.
- Şablon persona temizliği bu fazın launch kapısı: `grep -ri "alex chen\|techcorp\|startupxyz\|example.com" src messages content` sıfır sonuç vermeli (`.env.example` ve testlerdeki bilinçli negatif örnekler hariç).
- Docker/next problarında port 3000 yerine 3171 ve üzeri kullan, container'ları temizle.
- Plandaki bir adım gerçek API ile uyuşmuyorsa (velite 0.4, next 16.3, next-intl 4.13) context7 ile doğrula, düzelt ve sapmayı devir notuna yaz; uydurma.
- Bittiğinde: `docs/plans/handoffs/faz-4.md` devir notu (Yapılanlar commit tablosu, Doğrulananlar komut+çıktı, Plandan sapmalar, Açık kalanlar, Üretilen arayüzler, Faz 5'e uyarılar, Manuel adımlar) ve `docs/plans/handoffs/faz-4-manual-checklist.md`; ikisini commit et. Sonra dalı push et ve `gh pr create --base main` ile PR aç (gövde: ne değişti, doğrulama, sapmalar, açık kalanlar; AI atfı yok). PR'ı MERGE ETME; kontrol oturumu ve sahibi karar verir.
- Yayın öncesi kontrol listesi (plan sonundaki "Bitti sayılma kriteri"): Lighthouse, hreflang testi, contact formu uçtan uca; tarayıcın yoksa yapamadıklarını manuel checklist'e yaz, "yapıldı" deme.

## Bitti sayılma özeti

Velite 0.4.0 exact pin ile `content/projects/{en,tr}` ve `content/blog/{en,tr}`; `src/data/projects.ts` silindi; 4-5 gerçek case study (Cargo Pilot ve Bilet Satın Alma öncelikli); Hero/About/Contact gerçek metin EN+TR; sertifikalar `verifyUrl` opsiyonel; CV butonu `public/cv/dogancanyildiz-cv.pdf`; blog listesi, yazı sayfası, BlogPosting JSON-LD, RSS; sitemap yalnızca var olan çeviriler; Alex Chen / example.com sıfır; tüm kapılar yeşil; devir notu ve PR açık.
