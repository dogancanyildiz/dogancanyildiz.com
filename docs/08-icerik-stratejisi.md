# İçerik Stratejisi ve Sektör Araştırması
Durum: Uygulandı (Faz 4, PR #6, merged; Faz 5 ile iki EN çeviri daha; içerik şeması 2026-08-28'de `updated`, `coverAlt`, `draft`, `https://` kısıtı ile genişledi; sertifika doğrulama linkleri ve rozet görselleri 2026-09-02'de teslim alındı ve uygulandı; aynı gün her sertifika satırına verenin kendi beceri etiketlerinden anahtar kelime satırı eklendi), sahibinin kalan teslimatı (proje görselleri, Konuşmalar verisi) ve metin onayı bekleniyor · Karar: 2026-08-27 · Güncelleme: 2026-09-02 · Kapsam: dogancanyildiz.com

## Özet

Site artık gerçek içerik taşıyor; bu doküman şablonun yerine ne konacağına ve hangi formatta konacağına karar veriyor, kod/i18n/SEO tarafındaki uygulama detayları için ilgili dokümanlara link veriyor. 2025-2026 sektör araştırması, işe alımcıların düz proje listesi yerine derin case study ve canlı demo aradığını, sertifikaları doğrulama linkiyle görmek istediğini ve Türkiye'de online varlığın işe alım kararını etkilediğini gösteriyor; buna karşılık Blind/Reddit tartışmaları portfolyonun ilk elemeyi tek başına geçirmediğini, asıl işlevinin mülakat sonrası güven inşa etmek olduğunu hatırlatıyor. Dört yön (sade CV, case study ağırlıklı, blog ağırlıklı, homelab vitrini) karşılaştırıldığında karma bir yapı çıkıyor: omurga case study (4-5 proje, Cargo Pilot ve Bilet Satın Alma öncelikli), üstüne düşük hacimli bir blog ve zaten context'te istenen homelab/status vitrini eklenir. İçerik kararları placeholder'ı tamamen reddediyor: görseli olmayan proje kapaksız yayınlanır, gerçek CV PDF'i geldiğinde Download CV butonu kalır, Speaking içeriği (etkinlik, konu, tarih) About içinde kompakt bir blok olarak gösterilir (2026-08-27, site sahibinin cevapları: [11-acik-sorular.md](./11-acik-sorular.md)).

## Kararlar

1. İçerik omurgası karma: case study ağırlıklı (4-5 proje) + ince bir homelab/status vitrini + düşük hacimli blog (açılış 3-4 yazı, sonrası ayda 1). Sade CV formatı tek başına kullanılmaz.
2. Tüm Divizyon projeleri (Cargo Pilot, Wikonya, Sportlink, Hubit) public gösterilebilir ve canlı/repo linkleri mevcut (site sahibinin 2026-08-27 cevabı); proje sayısı yine 6 sahte kayıttan 4-5 gerçek case study'ye düşer, Cargo Pilot ve Bilet Satın Alma öncelikli. Ekran görüntüleri sonradan eklenecek; Velite şemasında her projede `liveUrl`/`repoUrl` alanı bulunur. Her case study'de üstte 4 hücreli mono künye (Rol / Stack / Yıl / Sonuç) ve en az 1 gerçek ekran görüntüsü bulunur; görsel gelene kadar proje kapaksız yayınlanır, CSS gradyan veya stok görsel placeholder olarak kullanılmaz (bu kural aynen geçerli).
3. Blog açılışta 3-4 yazıyla başlar, sonrasında ayda 1 yazı hedeflenir.
4. Speaking, ayrı bir sayfa değil, About içinde kompakt bir "Konuşmalar" bloğu olarak gösterilir (etkinlik adı · konu · tarih); slayt/video linki henüz yok, medya alanı eklenmez. GDG Konya ve GDG Cloud Konya rolleri de About içinde kalır. Önceki "Speaking bölümü tamamen çıkar" kararı, sahibinin etkinlik/konu/tarih bilgisi verebilmesi üzerine bu şekilde revize edildi (2026-08-27).
5. Sertifikalar About içinde ayrı bir blokta listelenir; doğrulama linki alanı (`verifyUrl`) her sertifika kaydında modellenir. **Uygulandı (2026-09-02):** linkler teslim alındı, on üç kaydın on ikisi verenin kendi doğrulama sayfasına bağlanıyor (on bir Credly rozet kaydı, bir Hackviser `verify` sayfası). Kayıtlar artık verene göre gruplanıyor (Hackviser, Cisco Networking Academy, IBM SkillsBuild, Global AI Hub), her satır rozet görseli, veriliş tarihi ve varsa sertifika kimliğiyle çiziliyor; sunum kararı [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md) "sertifika rozetleri" bölümünde. Eski tek satırlık "CCNA tam hattı" kaydı, o üç kursun gerçekten verdiği üç ayrı rozete bölündü. Doğrulama linki olmayan tek kayıt (Global AI Hub) listede kalıyor, alanı boş; satır kaldırılmıyor ve eksiklik için sitede metin yazılmıyor. **Anahtar kelimeler (2026-09-02):** her kayıt iki dilde en çok altı anahtar kelime taşıyor ve bunlar adın altında tek bir muted satırda, orta nokta ayırıcıyla yazılıyor. Kaynak verenin kendi beceri etiketleri: Credly rozet sayfalarındaki resmi etiketler ve Hackviser sertifikasının kendi metni. Kelimeler yeniden yazılmadı, seçildi; kurs adı kendi hattının dışındaki okura hiçbir şey anlatmadığı için bu satır iddianın değil kanıtın parçası. Global AI Hub kaydı da dahil, doğrulama linki olmayan satır da anahtar kelimesini alıyor. Sunum kararı ve iki sütunlu düzen [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md) "sertifika önizlemesi ve okul amblemleri" bölümünde.
6. Harp Okulu satırı "(not completed)" ifadesi olmadan, yalnızca yıl aralığı ve program adıyla nötr yazılır (sahibi tarafından 2026-08-27'de onaylandı).
7. İngilizce CEFR kırılımı (B1/A2) siteden çıkar (sahibi tarafından 2026-08-27'de onaylandı).
8. Gerçek bir CV PDF'i var (site sahibinin 2026-08-27 cevabı); Download CV butonu **kalır**. Dosya `public/cv/dogancanyildiz-cv.pdf` yoluna konur; sahibi teslim edene kadar `.local/` altında tutulur, Faz 4'te `public/`'e taşınır. hero.tsx:73 ve about/page.tsx:140'taki `/cv.pdf` linki bu yola güncellenir.
9. Logo monogramı DCY olur; public/ altındaki kullanılmayan create-next-app SVG'leri (file.svg, globe.svg, next.svg, vercel.svg, window.svg) silinir.
10. Blog dili TR-first: yazılar öncelikle Türkçe yazılır, uluslararası ilgi görecek olanlar (ör. Coolify self-host yazısı, pentest -> fix döngüsü) sonradan EN'e çevrilir. Çekirdek sayfalar (Home, About, Projects case study'leri, Contact) EN ve TR ikisinde de eksiksiz kalır. Tek dilli blog yazısı serbesttir ve diğer dilin sitemap/hreflang'ına hiç girmez (mevcut fallback-yok politikasıyla tutarlı). Detay: [04-i18n.md](./04-i18n.md).

## Gerekçe

### Sektör bulguları

- **Portfolyo, mükemmel CV'den daha önemli görülüyor.** Stack Overflow Developer Survey 2024'e göre işe alımcıların %73'ü güçlü bir portfolyoyu mükemmel bir CV'den üstün buluyor, %70'i mülakat öncesi portfolyoya bakıyor (hakia.com).
- **Canlı demo şart.** İşverenlerin %84'ü yalnızca repo değil, çalışan bir demo görmek istiyor (hakia.com). Mümkün olduğu yerde canlı link korunmalı: Cargo Pilot (cargopilot.divizyon.org), Wikonya (wikonya.vercel.app), GPA (dogancanyildiz.github.io/gpa).
- **Case study, listeden daha ikna edici.** dev.to, slategit.com ve proxify.io kaynaklarının ortak önerisi: 3-6 proje, her biri "ne yaptım, neden, ne öğrendim" formatında derin case study; "tutorial takip" projeleri değil gerçek sorun çözen özgün projeler tercih ediliyor.
- **Blind karşıt görüşü, dengeleyici bir uyarı.** teamblind.com'daki tartışmalar işe alımcıların CV'yi ilk 20 saniyede eleyip kişisel siteye çoğu zaman bakmadığını, portfolyonun asıl değerinin mülakat sonrası teknik derinlik göstermekte olduğunu belirtiyor. Bu, case study derinliğinin gerekçesini değiştirmiyor: portfolyo "kapıyı açan" değil "kapıdan geçtikten sonra güven inşa eden" araç, dolayısıyla derinlik yine önemli ama site tek başına başvuru hunisi değil, aktif başvuru ve LinkedIn/GitHub ile birlikte çalışması gereken bir kanıt katmanı.
- **Sertifikalar doğrulama linkiyle kanıt değeri kazanıyor.** Rozetleri düz metin listelemek yerine Credly/ilgili platformun doğrulama URL'sine link vermek önerilen pratik (dev.to/abpanic, support.credly.com). Araştırma yazıldığında portfolio-content.md bölüm 7'deki yedi sertifika linksiz düz metindi; 2026-09-02'de bu bölüm rozet görseli + doğrulama linki düzenine geçti, sertifikalar aynı zamanda Person JSON-LD'sinde `hasCredential` olarak yayımlanıyor.
- **Türkiye'de online varlık işe alım kararını etkiliyor.** Cross-Tab araştırmasına göre işe alım yöneticilerinin yarısından fazlası adayın online varlığının kararı etkilediğini söylüyor, büyük şirketlerde teknik ekip mülakat öncesi GitHub ve portfolyoyu inceliyor (patika.dev, yenibiris.com). Bu, Türkçe içeriğin gerçek bir yerel karşılığı olduğunu gösteriyor; ancak mevcut cookie tabanlı i18n (bkz. 04-i18n.md, 07-seo-ve-metadata.md) Türkçe sayfaları Google'a ayrı indekslemediği için bu değer şu an SEO üzerinden gerçekleşmiyor, URL tabanlı i18n (Faz 2) devreye girene kadar blog'un TR ayağı yalnızca doğrudan URL ile gelen ziyaretçiye ulaşıyor.
- **Ham metrikler somut örneğe bağlanmalı.** portfolio-content.md bölüm 4'teki "5 production applications", "10+ custom WordPress theme" gibi rakamlar tek başına iddia düzeyinde kalıyor; case study'ler (özellikle Cargo Pilot ve Bilet Satın Alma) bu rakamlardan en az birini somut örnekle destekleyen kanıt görevi görüyor. Experience bölümünün metni değişmez, Projects bölümü ona referans/gerekçe olur.
- **Freelance tarafında testimonial/case study güven inşa ediyor.** Testimonial içeren portfolyolar %45 daha fazla lead üretiyor (wethos.co); şu an sitede testimonial yok, bu doküman kapsamında yeni bir karar alınmıyor ama case study formatı proje bazında benzer bir güven mekanizması sağlıyor.

### Dört yön karşılaştırması

| Yön | fitScore | Güçlü yanı | Zayıf yanı |
|---|---|---|---|
| Sade CV sitesi | 3 | Hızlı üretilir, bakım yükü düşük | Canlı demo/derin anlatım beklentisini karşılamaz, DevOps+security farkını düz liste olarak gömer |
| Case study ağırlıklı | 8 | 2025-2026 kaynaklarının tutarlı önerisi, Cargo Pilot ve Bilet Satın Alma zaten hikaye barındırıyor | Görsel/yazım emeği yüksek, şu an gerçek proje görseli yok |
| Blog ağırlıklı | 6 | GDG Konya/GDG Cloud Konya geçmişiyle örtüşüyor, Türkçe içerik boşluğu dolduruyor | Speaking bölümünün hâlâ boş şablon olması sürdürülebilirlik riskini gösteriyor, tek başına kısa vadeli dönüşüm sağlamıyor |
| Homelab/infra vitrini | 7 | Sitenin kendisi zaten Coolify/Docker/Traefik üstünde self-hosted, meta-kanıt oluşturuyor | Tek başına yeterli değil, dikkatsiz tasarlanırsa port/servis bilgisi sızdırma riski taşıyor |

Homelab satırının gerekçesi, altyapıyı bizzat barındırmayı deneyen geliştiricilerin (Medium: "Hosting My First Portfolio Website in My Homelab") ve "her geliştirici self-host denemeli" tarzı içeriklerin (noted.lol, beingdevops.com) altyapıyı yalnızca metinle anlatmak yerine canlı gösterimin daha güçlü bir sinyal olduğunu ortaya koymasına dayanıyor; site zaten Coolify üstünde self-hosted olacağı için bu ek bir iddia değil, mevcut kurulumun doğal bir uzantısı.

Karma karar: omurga case study (4-5 proje, Cargo Pilot ve Bilet Satın Alma öncelikli), üstüne homelab/status vitrini (context'te zaten istenen widget, uygulama detayı 05-backend-icerik-ve-servisler.md'de) ve düşük hacimli blog eklenir. Sade CV bu profil için tek başına yetersiz kalıyor, blog tek başına omurga olamıyor.

## Reddedilen alternatifler

- **Sade CV sitesi (tek yön olarak):** Doğan'ın farkı (network + security + DevOps üstüne kurulu full-stack) tam olarak derinlemesine anlatımla ortaya çıkan bir farklılaşma; düz CV formatı bunu resmeder ama kanıtlamaz.
- **Blog ağırlıklı thought leadership (tek yön olarak):** GDG geçmişiyle örtüşüyor ama sürdürülebilirlik riski yüksek, Speaking bölümünün hâlâ placeholder olması düzenli içerik üretiminin bugüne kadar önceliklendirilmediğinin sinyali; kısa vadeli iş/freelance dönüşümüne katkısı diğer yönlere göre daha yavaş.
- **6 projenin tamamını korumak:** kalite miktardan önemli, 4-5 derin case study düz proje listesinden daha ikna edici; zayıf hikayeli projeleri de zorla case study formatına sokmak formatı sulandırır.
- **Temsili/örnek ekran görüntüsü üretmek:** dürüstlük problemi taşıyor ve fark edilmesi an meselesi; bu yüzden görseli olmayan proje kapaksız yayınlanıyor, placeholder görsel üretilmiyor.
- **Speaking bölümünü placeholder ile yayınlamak:** köşeli parantez placeholder metni ("[Etkinlik adı], [Konu], [Tarih]") production'a sızarsa şablon izlenimini güçlendirir; translations.ts'teki "Alex Chen" kalıntısı bu riskin zaten somut örneği.
- **CEFR seviyesini olduğu gibi bırakmak:** uluslararası/uzaktan roller genelde B2/C1 arıyor, A2 çoğu işveren için yetersiz görülüyor (preply.com, globalenglishtest.com); seviyeyi öne çıkarmak öz-elemeyi artırıyor, İngilizce dokümantasyon/repo/blog yazılarının kendisi zaten kanıt.
- **Harp Okulu satırını gizlemek:** referans kontrolünde ortaya çıkma riski taşır, dürüstlükten ödün vermeden nötr çerçeveleme (yıl aralığı + program adı, "not completed" ifadesi olmadan) tercih edildi (resumonk.com, zety.com).

## Uygulama durumu (2026-08-27)

Bu dokümandaki kararlar `feature/faz-4-icerik-ve-yayin` dalında (PR #6, main'e merge 2026-08-27) uygulandı. **Ek (2026-08-28):** Faz 5 (PR #31) `capt-sinavina-hazirlik` ve `ccna-dan-web-guvenligine` yazılarının EN çevirilerini ekledi (EN blog 3 yazı); denetim kapanışı içerik şemasına opsiyonel `updated` (sitemap `lastmod` ve BlogPosting `dateModified`), `coverAlt` (kapak alt metni, kapak gelince zorunlu), projeler için `draft` ekledi; `links.live`/`links.repo` yalnızca `https://`; `self-hosting-with-coolify` TR özetindeki Vercel atfı EN ile aynı bilgi seviyesine çekildi; ana sayfa `featured` projeleri (yoksa ilk üç) gösteriyor; `ProjectMeta`/`Screenshot` MDX kısayolları kaldırıldı. Kanıt: `docs/plans/handoffs/faz-4.md`, repodaki içerik ve kod dosyaları.

- **5 case study yayında** (karar 2), `content/projects/{en,tr}/` altında 10 MDX dosyası: `cargo-pilot.mdx` (Rol "DevOps Chapter Lead", `year: 2025`, live `cargopilot.divizyon.org`, order 1), `ticket-purchasing-system.mdx` (Bilet Satın Alma, Rol "Cybersecurity project, Siber Vatan program", `year: 2025`, repo `github.com/dogancanyildiz/bilet-satin-alma`, order 2), `wikonya.mdx` (`year: 2025`, live `wikonya.vercel.app` + repo, order 3), `hubit.mdx` (`year: 2025`, Three.js, canlı/repo linki yok, order 4), `gpa-calculator.mdx` (`year: 2025`, live + repo, order 5). Her dosyada mono künye alanları (`role`, `stack`, `year`, `outcome`) ve opsiyonel `links.live`/`links.repo` var; `cover` alanı hiçbirinde dolu değil (`covers=0`, `content/images/` boş), karar 2'nin "görsel yoksa kapaksız yayın" kuralı fiilen uygulanıyor.
  **Ek (2026-09-02):** Yukarıdaki sayım ve "kapak yok" tespiti 2026-08-27 durumunu anlatıyor. O tarihten sonra altıncı case study eklendi: `koklu-hukuk.mdx` (Köklü Hukuk ve Danışmanlık, Rol "Tasarım, geliştirme ve yayına alma" / "Design, development and deployment", `year: 2026`, live `www.kokluhukuk.com`, `featured: true`, order 1). Sitedeki ilk müşteri işi ve ilk kapaklı proje: `content/images/koklu-hukuk-cover.jpg` (2880x1620 JPEG, 245 KB, canlı ana sayfanın çerez bandı kapatılmış ekran görüntüsü), iki dilde `cover` + `coverAlt` dolu. Kalan beş dosyanın order değerleri birer arttı (cargo-pilot 2, ticket-purchasing-system 3, wikonya 4, hubit 5, gpa-calculator 6) ve hâlâ kapaksız, yani karar 2'nin "görsel yoksa kapaksız yayın" kuralı onlar için geçerli olmaya devam ediyor. `tests/content-layer.test.ts` artık `cover` alanını da TR/EN paritesine dahil ediyor ve kapağı olan her projeden `coverAlt` istiyor.
  **Karar değişikliği:** Aşağıdaki "Proje adayları" tablosu Sportlink'i 3. öneri olarak listeliyordu; uygulamada Sportlink dahil edilmedi, yerine GPA girdi. Gerekçe (`docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md:4741`): "Sportlink yerine GPA seçildi çünkü GPA'nın public linki ve deposu var, Sportlink'in ise canlı linki yok." Cargo Pilot ve Bilet Satın Alma'nın 1-2. sırada sabit kalması kararı aynen uygulandı.
- **4 blog yazısı yayında** (karar 3), `content/blog/`: TR `self-hosting-with-coolify.mdx` (2026-08-20), `capt-sinavina-hazirlik.mdx` (2026-07-15), `ccna-dan-web-guvenligine.mdx` (2026-06-10); EN yalnızca `self-hosting-with-coolify.mdx` çevirisi. "İlk blog yazısı fikirleri" listesindeki 4. fikir ("Cargo Pilot'ta DevOps Chapter Lead olmak") henüz yazılmadı.
- **Profil verisi gerçek, placeholder yok** (karar 4-7): `src/content/profile.ts`. `speaking` dizileri (`en: []`, `tr: []`) bilinçli boş bırakıldı, About sayfası "Konuşmalar" bloğunu bu diziler boşken hiç render etmiyor (kod yorumu: "The About page never renders the Talks block while these arrays are empty. A bracketed placeholder line is NEVER written here."). `certificates` içindeki 7 kayıtta `verifyUrl` alanı tanımlı ama hiçbirinde değer yok, satırlar listede kalıyor (karar 5 aynen). `education` içindeki Harp Okulu satırı "National Defence University, Turkish Military Academy" / "Milli Savunma Üniversitesi, Kara Harp Okulu", `10/2017 - 06/2021`, "(not completed)" ifadesi yok (karar 6). CEFR/B1/A2 hiçbir yerde geçmiyor; `messages/en.json` ve `tr.json`'daki `about.languages` anahtarı tek nötr cümle ("Turkish is my native language. I work in written English every day…" / "Ana dilim Türkçe. Yazılı İngilizceyi her gün kullanıyorum…") (karar 7).
- **CV teslim edildi, buton kalıcı** (karar 8): `public/cv/dogancanyildiz-cv.pdf` commit'li (68 KB). `src/lib/site.ts` `CV_PATH = "/cv/dogancanyildiz-cv.pdf"`, `src/lib/cv.ts` `hasCv()` (server-only, build zamanında dosya varlığını kontrol ediyor) butonu koşullu render ediyor.
- **Hero/header/footer gerçek metin**: `messages/en.json` ve `tr.json`'daki `brand`, `hero`, `contact`, `footer`, `metadata` namespace'leri gerçek içerikle dolduruldu. 2026-08-27 UI yenilemesi: minimal editorial layout, kategorize yetkinlikler (`src/content/profile.ts` `order` + `id`, `SkillCategoryList`), güven planı (contact gizlilik metni, Person JSON-LD genişletme, `npm run verify:links`, footer build SHA/tarih). Eski Liklidi-inspired scroll landing ve `src/content/home.ts` kaldırıldı.
- **Kalıntı testi**: `tests/no-template-residue.test.ts` (112 satır), `FORBIDDEN_SUBSTRINGS` listesinde "alex chen", "alex@example.com", "example.com", "techcorp", "startupxyz", "your name here"; `git ls-files` ile taranan `src`, `content`, `messages`, `public`, `.env.example` üzerinde çalışıyor. Faz 4 devir notunun doğrulama tablosuna göre grep taraması (`alex chen|techcorp|startupxyz|example\.com|alex@`) sıfır sonuç veriyor.
- **İçerik olgu düzeltmeleri** (kod incelemesinden çıkan düzeltme, commit `0d418af`): plan taslağındaki yıllar uydurmaydı, gerçek yıllar herkese açık repolarla doğrulanıp `2025`'e çekildi (repo commit tarihleri: gpa 2025-12, wikonya 2025-11, ticket 2025-10, hubit 2025-05); GPA stack'i "HTML / CSS / JavaScript / TypeScript / React / Next.js" olarak düzeltildi; ticket rolü "Cybersecurity project, Siber Vatan program" oldu ve repo linki eklendi; kaynağın desteklemediği "önce şöyleydi" iddiaları (elle yayın, darboğaz vb.) hedef/olgu cümlesine çevrildi. 2026-08-27: tüm proje MDX `stack` frontmatter'ları web/DevOps mantık sırasına çekildi.
- **Yayın öncesi içerik kontrol listesi**: Faz 4 devir notunun "Bitti sayılma kriterleri" tablosunda maddeler 1-7 yerelde geçti (32 dosya / 458 test, template kalıntısı 0, statik route'lar, içerik hacmi, uçtan uca HTTP, hreflang, JSON-LD); madde 8 (tarayıcı ve herkese açık URL isteyen manuel kontroller) henüz koşulmadı.
- **Teslimat listesi ve metin onayı, hâlâ açık** (`docs/plans/handoffs/faz-4.md` "Açık kalanlar"): Konuşmalar verisi (etkinlik/konu/tarih), sertifika `verifyUrl` değerleri, proje kapak görselleri; beş case study ve dört blog yazısının birinci şahıs cümleleri olgu bakımından doğrulandı ama sahibinin metin onayını bekliyor; Wikonya'nın canlı site adı değişmiş ("Konya Genç"), ticket-purchasing-system'in repo linki istenmezse kaldırılacak; CV PDF içeriği (telefon/adres) sahibinin onayında.

### Haritalama tablosu, gerçek dosyalarla

"portfolio-content.md -> site haritalama" tablosundaki "Site hedefi" sütunu doğru kaldı; gerçek dosya karşılıkları şöyle: Hero -> `src/components/sections/hero.tsx` + `messages.hero`; About -> `src/app/[lang]/about/page.tsx`; Skills -> `src/content/profile.ts` (`skills`, `order`/`id` ile kategorize) + `src/components/sections/skills-strip.tsx` + `src/components/sections/skill-group-grid.tsx` (`SkillCategoryList`, `simple-icons`); Experience -> `src/content/profile.ts` (`experience`); Projects -> `src/app/[lang]/projects/page.tsx` + `src/app/[lang]/projects/[slug]/page.tsx` + `content/projects/{en,tr}/*.mdx`; Community & Speaking -> `src/content/profile.ts` (`community`, `speaking`) render edildiği `about/page.tsx`; Certificates -> `src/content/profile.ts` (`certificates`); Education -> `src/content/profile.ts` (`education`); Languages -> `messages.about.languages`; Contact -> `src/app/[lang]/contact/page.tsx` + `src/app/api/contact/route.ts`. Stack sırası frontmatter'da web mantığına göre (HTML → CSS → JS → framework); bakım listesi `docs/trust-maintenance-checklist.md`.

## Riskler ve tripwire'lar

- **Görsel izni artık açık soru değil, teslimat konusu.** Tüm Divizyon projeleri (Cargo Pilot, Wikonya, Sportlink, Hubit) public gösterilebilir, izin sorunu yok (2026-08-27 cevabı); ekran görüntüleri yalnızca sonradan teslim edilecek. Tripwire: görsel gelene kadar proje kapaksız yayınlanır, asla placeholder görselle değil. Detay: 11-acik-sorular.md soru 4.
- **4-5 proje seçimi henüz kesinleşmedi.** Cargo Pilot ve Bilet Satın Alma öncelik olarak sabit; geri kalan 2-3 proje seçimi artık izin değil yalnızca hikaye derinliğine bağlı (aşağıdaki tabloya bakın, tüm adaylar zaten public gösterilebilir). Tripwire: seçim netleşmeden Faz 4 içerik yazımı başlamamalı.
- **Blog sürdürülebilirliği kanıtlanmamış.** Speaking bölümünün bugüne kadar boş şablon kalması, düzenli içerik üretiminin önceliklendirilmediğinin sinyali. Tripwire: açılış 3-4 yazıdan sonra 2 ay üst üste yeni yazı gelmezse blog'un ayda 1 hedefi gözden geçirilmeli, homepage'de blog linkinin görünürlüğü küçültülebilir.
- **Sertifika doğrulama linki teslim edildi (2026-09-02).** CAPT (Hackviser), üç CCNA kursu, CyberOps ve kalan Cisco/IBM SkillsBuild rozetleri kendi doğrulama sayfalarına bağlı; rozet görselleri repoda. Kural yeni kayıtlar için geçerliliğini koruyor: doğrulama linki olmayan sertifika listede kalır, `verifyUrl` boş bırakılır, satır silinmez. Global AI Hub kaydı bu durumda.
- **Harp Okulu ve İngilizce çerçevelemesi onaylandı.** Nötr yeniden yazım (yıl aralığı + program adı, "not completed" yok) ve CEFR kırılımının kaldırılması sahibi tarafından 2026-08-27'de onaylandı; nihai metin bu doküman kapsamında yazılır. Detay: 11-acik-sorular.md soru 10.
- **Blog dil politikası netleşti: TR-first.** Yazılar önce Türkçe yazılır, uluslararası ilgi görecek olanlar sonradan EN'e çevrilir; çekirdek sayfalar EN+TR eksiksiz kalır. Tek dilli blog yazısı diğer dilin sitemap ve hreflang alternates'ine hiç girmez (11-acik-sorular.md soru 9, 04-i18n.md).
- **Homelab/status vitrini içerik sınırı.** Widget'ta yalnızca takma ad, up/down durumu, 24 saatlik uptime yüzdesi, son deploy zamanı, commit SHA ve stack satırı gösterilir; hostname, port ve iç servis topolojisi asla gösterilmez (uygulama detayı 05-backend-icerik-ve-servisler.md).

## Uygulama notları

### Case study yazım formatı

Araştırma kaynaklarının (dev.to, slategit.com, proxify.io) ortak önerdiği "ne yaptım, neden, ne öğrendim" yapısı, karar 2'deki mono künye ile birleşince her proje sayfası için şu iskeleti veriyor:

1. **Mono künye (üst blok, 4 hücre):** Rol / Stack / Yıl / Sonuç. Tek satırda taranabilir olmalı, uzun cümle içermez (örnek: Rol "DevOps Chapter Lead", Sonuç "3 haftalık deploy döngüsü tek günlük CI/CD hattına indirildi" gibi ölçülebilir bir ifade, ölçüm yoksa somut kapsam cümlesi).
2. **Gövde metin sırası:** Ne yaptım (görev ve kapsam) -> Neden (problem/karar bağlamı) -> Ne öğrendim veya sonuç (varsa metrik, yoksa gözlemlenebilir çıktı). Bilet Satın Alma için bu sıra doğal: pentest bulguları -> hangi güvenlik açığı neden önemliydi -> hangi hardening adımı uygulandı.
3. **Görsel kuralı:** en az 1, ideal 2-3 gerçek ekran görüntüsü (genel görünüm + öne çıkan bir özellik/ekran). Stok görsel, mockup şablonu veya CSS gradyan kapak kullanılmaz; görsel yoksa proje kapaksız yayınlanır (karar 2). Görsel optimizasyonu ve `next/image` kullanımı için 03-tasarim-ui-ux.md.
4. **Canlı link:** varsa üstte, mono künyenin hemen altında; yoksa alan boş bırakılır, "coming soon" gibi ifadeler kullanılmaz.
5. **Ton:** ilk şahıs, somut fiil ve mümkünse ölçülebilir sonuç ("optimize ettim" yerine "deploy döngüsünü 3 haftadan 1 güne indirdim" gibi); pazarlama dilinden ve abartılı sıfatlardan kaçınılır. portfolio-content.md bölüm 5'teki mevcut ton (Cargo Pilot, Bilet Satın Alma metinleri) referans alınır, sadece görsel ve künye eklenir.

### Proje adayları ve case study hazırlığı

| Proje | Hikaye derinliği | Canlı link / görsel durumu | Öncelik |
|---|---|---|---|
| Cargo Pilot | Yüksek: DevOps Chapter Lead + optimizasyon algoritması | cargopilot.divizyon.org var, ekran görüntüsü izni teyit gerekiyor | 1 (sabit) |
| Bilet Satın Alma | Yüksek: pentest, fix, hardened deploy döngüsü | Canlı link yok, görsel kendi ortamından alınabilir (izin sorunu yok) | 1 (sabit) |
| Wikonya | Orta: açık kaynak, öğrenci topluluk platformu | wikonya.vercel.app + GitHub repo public, görsel almak kolay | 2 (öneri) |
| Sportlink | Orta: QA süreç sahipliği, sprint bazlı test | Canlı link yok, Divizyon izni gerekiyor | 3 (öneri, izne bağlı) |
| Hubit | Orta: Three.js ile 3D render | Canlı link yok, Divizyon izni gerekiyor | 3 (öneri, izne bağlı) |
| GPA | Düşük: basit araç, gerçek kullanıcı | dogancanyildiz.github.io/gpa public, görsel almak kolay | 4 (öneri, doldurucu) |

Cargo Pilot ve Bilet Satın Alma dışındaki 2-3 slot için Wikonya (public link, düşük efor) ilk sıra öneri; Sportlink ve Hubit görsel izni gelirse eklenir, gelmezse GPA doldurucu olarak kalır. Nihai liste, sahibin onayı ve görsel izni netleştikten sonra 10-yol-haritasi.md'deki Faz 4 görevine bağlanır.

### İlk blog yazısı fikirleri

Açılışta 3-4 yazı, sonrasında ayda 1 hedefi:

1. **Coolify ve Traefik ile kendi sunucusunda self-host etmek**: sitenin kendi deploy hattını anlatan meta-yazı, homelab vitrinini destekler.
2. **CAPT sınavına hazırlık**: Hackviser pentest sertifikasyon sürecinin pratik anlatımı, sertifika bölümüne derinlik katar.
3. **Cargo Pilot'ta DevOps Chapter Lead olmak**: altyapı kararları, CI/CD kurulumu ve ekip koordinasyonu; ilgili case study'nin uzun formatlı versiyonu.
4. **CCNA'dan web güvenliğine**: network temelinin full-stack geliştirmeye kattığı bakış açısı, Bilet Satın Alma pentest yazısına köprü.

### portfolio-content.md -> site haritalama

| Bölüm (portfolio-content.md) | Site hedefi | Not |
|---|---|---|
| 0. Meta/SEO | generateMetadata (her sayfa), Person JSON-LD, OG image route | Uygulama: 07-seo-ve-metadata.md |
| 1. Hero | Home hero bileşeni | Download CV butonu **kalır**, link `public/cv/dogancanyildiz-cv.pdf`'e güncellenir (karar 8) |
| 2. About | About sayfası ana metin + "Şu anda" / "Konum" satırları | Değişiklik yok, doğrudan taşınır |
| 3. Skills | About sayfası skill grupları | Mevcut kategori yapısı korunur |
| 4. Experience | About sayfası deneyim zaman çizelgesi | Değişiklik yok, doğrudan taşınır |
| 5. Projects | Projects sayfası + proje detay case study'leri (content/projects/{en,tr}) | 6 projeden 4-5'i seçilir (tüm Divizyon projeleri public, linkli), karar 2 |
| 6. Community & Speaking | GDG satırları About içinde kalır; Speaking, About içinde medyasız kompakt bir "Konuşmalar" bloğu olur | Karar 4 |
| 7. Certificates | About içinde ayrı blok, `verifyUrl` alanıyla (link gelene kadar boş) | Karar 5 |
| 8. Education | About sayfası eğitim satırları | Harp Okulu satırı nötr yeniden yazılır, karar 6 (onaylandı) |
| 9. Languages | Ayrı bölüm olarak gösterilmez veya CEFR'siz tek satır ("working proficiency in written English" gibi) | Karar 7 (onaylandı) |
| 10. Contact | Contact sayfası + footer | E-posta `me@dogancanyildiz.com` kesinleşti; domain (dogancanyildiz.com ana, .sh 301) sahibinin 2026-08-27 kararıyla cevaplandı, 11-acik-sorular.md soru 5 |
| 11. Notlar | Bu doküman + 06-devops-ve-deploy.md (Cloudflare Redirect Rules, e-posta domain doğrulaması) | Telefon numarası yok kararı zaten uygulanıyor |

### Yayın öncesi içerik kontrol listesi

Bu doküman kapsamındaki kararların uygulandığını doğrulamak için, 10-yol-haritasi.md'deki Faz 4 teknik kontrol listesine (Lighthouse, hreflang, Search Console) ek olarak:

- Site genelinde "Alex Chen" ve "alex@example.com" kalıntısı kalmamalı (grep ile doğrula: translations.ts, footer, meta title).
- Yayınlanan her case study'de en az 1 gerçek görsel var; placeholder, stok görsel veya CSS gradyan kapak yok.
- About içindeki "Konuşmalar" bloğu gerçek etkinlik/konu/tarih içeriyor; köşeli parantez placeholder metin sitede geçmiyor.
- Sertifika satırlarında `verifyUrl` varsa link çalışıyor (`npm run verify:links` canlı kontrol eder), link henüz gelmediyse satırın kendisi kaldırılmadı.
- Her sertifika rozeti `public/images/badges/` altında gerçekten var ve veri katmanındaki boyut dosyanın kendi boyutuyla aynı (`tests/profile.test.ts` PNG/JPEG başlığından okuyor).
- Her sertifika kaydında iki dilde eşit sayıda, en çok altı, boş olmayan anahtar kelime var ve kelimeler verenin yayımladığı etiketlerden geliyor (uydurulmuş beceri yok); `withCheckedCertificates` build'i, `tests/profile.test.ts` testi düşürür.
- Her okul amblemi `public/images/schools/` altında var, boyutu veri katmanındakiyle (SVG'de `viewBox` oranıyla) aynı, ve kaynağı ile lisansı aynı klasördeki `README.md`'de kayıtlı.
- Download CV linki yalnızca gerçek dosya `public/cv/dogancanyildiz-cv.pdf`'e konduysa mevcut; dosya gelmeden buton yayına çıkmıyor.
- CEFR ifadesi (B1/A2 gibi) ve Harp Okulu satırında "(not completed)" metni sitede geçmiyor.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [04-i18n.md](./04-i18n.md) (URL tabanlı i18n, çeviri kapsamı)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) (Velite içerik pipeline'ı, status widget veri kaynağı)
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) (Resend domain doğrulaması, e-posta kararı)
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md) (Person JSON-LD, hreflang, sitemap)
- [10-yol-haritasi.md](./10-yol-haritasi.md) (Faz 4: içerik ve yayın)
- [11-acik-sorular.md](./11-acik-sorular.md) (görsel izni, sertifika doğrulama linkleri, Harp Okulu/İngilizce çerçevelemesi, e-posta adresi, blog dil kapsamı)

## Kaynaklar

- https://hakia.com/skills/building-portfolio/
- https://slategit.com/blog/how-many-projects-to-feature-on-a-developer-portfolio
- https://proxify.io/knowledge-base/developer-types/how-do-developer-portfolios-differ-from-case-studies
- https://dev.to/_d7eb1c1703182e3ce1782/best-developer-portfolio-examples-2026-2d8m
- https://www.teamblind.com/post/do-portfolio-projects-actually-help-developers-get-jobs-yvtvuwcq
- https://www.wethos.co/blog/elements-to-include-in-your-freelance-portfolio-to-attract-clients
- https://fueler.io/blog/best-portfolio-websites-for-freelancers
- https://dev.to/abpanic/how-to-add-a-credly-badge-page-to-your-site-cbo
- https://support.credly.com/hc/en-us/articles/5079101828891-Credly-FAQ-s
- https://www.patika.dev/blog/tecrubeniz-yoksa-yazilimci-portfolyosu-var-peki-nasil-olacak
- https://www.yenibiris.com/blog/portfolyo-nedir-etkili-portfolyo-nasil-hazirlanir/
- https://www.resumonk.com/articles/unfinished-degree-on-resume
- https://zety.com/blog/unfinished-college-on-resume
- https://preply.com/en/blog/b2b-level-of-english-required-to-work-in-an-international-company/
- https://globalenglishtest.com/english-skills-for-remote-work-success/
- https://noted.lol/every-developer-should-try-self-hosting/
- https://www.beingdevops.com/blog/homelab-why-how-must-have-services-beingdevops/
- https://jddemonteverde.medium.com/hosting-my-first-portfolio-website-in-my-homelab-6fa42148e78a
