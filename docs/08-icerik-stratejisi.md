# İçerik Stratejisi

Durum: Uygulandı (Faz 4 #6; sertifika doğrulama linkleri, rozetler ve anahtar kelimeler #45) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Site içeriği `.local/content/portfolio-content.md` dosyasından türetiliyor; o
dosya gitignore'lu ve tek gerçek kaynak. Bu doküman şablonun yerine ne
konacağına ve hangi formatta konacağına karar veriyor.

## Kararlar

1. **Omurga case study.** Karma yapı: derin case study'ler + ince bir
   homelab/status vitrini + düşük hacimli blog. Sade CV formatı tek başına
   kullanılmaz.
2. **Placeholder yok.** Görseli olmayan proje kapaksız yayınlanır; CSS
   gradyan, stok görsel veya mockup şablonu kullanılmaz. Aynı kural metin
   için de geçerli: köşeli parantezli yer tutucu ("[Etkinlik adı]") hiçbir
   yerde yayına çıkmaz.
3. **Blog TR-first.** Yazılar önce Türkçe yazılır, uluslararası ilgi görecek
   olanlar sonradan çevrilir. Çekirdek sayfalar (Ana sayfa, Hakkımda, proje
   case study'leri, İletişim) iki dilde de eksiksiz kalır. Tek dilli yazı
   serbest ve diğer dilin sitemap/hreflang'ına hiç girmez.
4. **Konuşmalar** ayrı bir sayfa değil, Hakkımda içinde medyasız kompakt bir
   blok (etkinlik · konu · tarih). Veri boşken blok hiç render edilmiyor.
5. **Sertifikalar** Hakkımda içinde, verene göre gruplu; her kayıtta rozet
   görseli, veriliş tarihi, varsa sertifika kimliği ve `verifyUrl`. Doğrulama
   linki olmayan kayıt listede kalır, alanı boş bırakılır ve eksiklik için
   sitede özür niteliğinde metin yazılmaz.
6. **Anahtar kelimeler verenden alınır.** Her sertifika kaydı iki dilde en çok
   altı anahtar kelime taşır; kaynak Credly rozet sayfalarındaki resmi
   etiketler ve Hackviser sertifikasının kendi metni. Kelimeler yeniden
   yazılmaz, seçilir: kurs adı kendi hattının dışındaki okura bir şey
   anlatmıyor, bu satır iddianın değil kanıtın parçası.
7. **Eğitim ve dil çerçevelemesi.** Harp Okulu satırı "(not completed)"
   ifadesi olmadan, yalnızca yıl aralığı ve program adıyla nötr yazılır.
   İngilizce CEFR kırılımı (B1/A2) siteden çıkarıldı; İngilizce dokümantasyon,
   repo ve blog yazılarının kendisi zaten kanıt ve seviye ilan etmek öz-elemeyi
   artırıyor.
8. **CV.** Gerçek PDF `public/cv/dogancanyildiz-cv.pdf` yolunda; dosya varken
   indirme düğmesi görünüyor, yokken hiç render edilmiyor (`src/lib/cv.ts`).

## Gerekçe

Sektör araştırmasının tutarlı bulguları: işe alımcıların büyük çoğunluğu
mülakat öncesi portfolyoya bakıyor ve yalnızca repo değil çalışan bir demo
görmek istiyor; 3-6 proje, her biri "ne yaptım, neden, ne öğrendim" formatında
derin case study, düz listeden daha ikna edici; sertifikalar doğrulama linkiyle
kanıt değeri kazanıyor; Türkiye'de işe alım yöneticilerinin yarısından fazlası
adayın online varlığının kararı etkilediğini söylüyor.

Dengeleyici karşıt görüş de kayda geçti: portfolyo ilk elemeyi tek başına
geçirmiyor, asıl işlevi mülakat sonrası teknik derinlik göstermek. Bu, case
study derinliğinin gerekçesini değiştirmiyor ama sitenin başvuru hunisi değil
kanıt katmanı olduğunu netleştiriyor.

Dört yön karşılaştırıldı: sade CV (hızlı ama DevOps + security farkını düz
liste olarak gömüyor), case study ağırlıklı (en yüksek uyum), blog ağırlıklı
(GDG geçmişiyle örtüşüyor ama sürdürülebilirlik riski yüksek), homelab vitrini
(site zaten Coolify üstünde self-hosted, meta-kanıt; ama tek başına yetersiz ve
dikkatsiz tasarlanırsa topoloji sızdırır). Karma karar bu dördünün ağırlıklı
birleşimi.

Reddedilenler: 6 projenin tamamını korumak (kalite miktardan önemli, zayıf
hikayeli projeyi zorla case study formatına sokmak formatı sulandırır),
temsili/örnek ekran görüntüsü üretmek (dürüstlük problemi, fark edilmesi an
meselesi), Konuşmalar bölümünü placeholder ile yayınlamak (şablon izlenimini
güçlendirir, "Alex Chen" kalıntısı bu riskin somut örneği), Harp Okulu satırını
gizlemek (referans kontrolünde ortaya çıkma riski; nötr çerçeveleme tercih
edildi).

## Case study formatı

1. **Mono künye (üst blok, 4 hücre):** Rol / Stack / Yıl / Sonuç. Tek satırda
   taranabilir, uzun cümle içermez. Sonuç ölçülebilir bir ifade, ölçüm yoksa
   somut kapsam cümlesi.
2. **Gövde sırası:** ne yaptım (görev ve kapsam) -> neden (problem ve karar
   bağlamı) -> sonuç veya ne öğrendim.
3. **Görsel:** ideal 2-3 gerçek ekran görüntüsü. Yoksa kapaksız yayın.
4. **Canlı link:** varsa künyenin hemen altında; yoksa alan boş bırakılır,
   "coming soon" yazılmaz.
5. **Ton:** ilk şahıs, somut fiil, mümkünse ölçülebilir sonuç. Pazarlama dili
   ve abartılı sıfat yok.

## Yayındaki içerik

Altı proje case study'si, iki dilde: Köklü Hukuk (ilk müşteri işi ve ilk
kapaklı proje), Cargo Pilot, Bilet Satın Alma Sistemi, Wikonya, Hubit, Not
Ortalaması Hesaplayıcı. Üç blog yazısı, iki dilde: Coolify ile self-host, CAPT
sınavına hazırlık, CCNA'dan web güvenliğine. On üç sertifika kaydı, on ikisi
doğrulama linkli.

Proje seçiminde plandan bir sapma var: Sportlink yerine GPA hesaplayıcı
seçildi, çünkü GPA'nın public linki ve deposu var, Sportlink'in canlı linki
yok. Cargo Pilot ve Bilet Satın Alma'nın öncelikli kalması kararı aynen
uygulandı.

Yıllar ve teknoloji yığınları herkese açık repolarla doğrulandı; plan
taslağındaki uydurma yıllar ve kaynağın desteklemediği "önce şöyleydi"
iddiaları düzeltildi.

`tests/no-template-residue.test.ts` şablon persona kalıntısını (Alex Chen,
`alex@example.com`, `example.com`, TechCorp, StartupXYZ) `src`, `content`,
`messages`, `public` ve `.env.example` üzerinde kilitliyor.

## İçerik kontrol listesi

Yeni içerik veya sertifika eklerken:

- Her case study'de mono künye alanları dolu, `translationKey` iki dilde aynı.
- Kapağı olan her projede `coverAlt` var (`tests/content-layer.test.ts`
  zorunlu kılıyor); kapağı olmayan proje kapaksız yayınlanıyor.
- Sertifika rozeti `public/images/badges/` altında gerçekten var ve veri
  katmanındaki boyut dosyanın kendi boyutuyla aynı (`tests/profile.test.ts`
  PNG/JPEG başlığından okuyor).
- Her sertifika kaydında iki dilde eşit sayıda, en çok altı, boş olmayan
  anahtar kelime var (`withCheckedCertificates` build'i düşürüyor).
- Okul amblemi `public/images/schools/` altında, kaynağı ve lisansı aynı
  klasördeki `README.md`'de.
- `npm run verify:links` canlı demo URL'lerini ve sertifika doğrulama
  linklerini kontrol ediyor (haftalık workflow, merge kapısı değil).
- CEFR ifadesi ve "(not completed)" metni sitede geçmiyor.

Bakım ritmi: [trust-maintenance-checklist.md](./trust-maintenance-checklist.md).

## Riskler ve tripwire'lar

- **Blog sürdürülebilirliği kanıtlanmamış.** Konuşmalar bölümünün bugüne kadar
  boş kalması, düzenli içerik üretiminin önceliklendirilmediğinin sinyali.
  Tripwire: açılış yazılarından sonra iki ay üst üste yeni yazı gelmezse ayda
  bir hedefi gözden geçirilir, ana sayfada blog linkinin görünürlüğü
  küçültülebilir.
- **Kapak eksikliği ikna gücünü düşürüyor.** Beş proje hâlâ kapaksız; kural
  gereği placeholder konulmuyor, teslimat bekleniyor
  ([11-acik-isler.md](./11-acik-isler.md)).
- **Homelab vitrini içerik sınırı.** Panelde yalnızca takma ad, durum, build
  bilgisi ve public status linki; hostname, port ve iç servis topolojisi asla
  gösterilmez.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md) - sertifika ve eğitim bloklarının sunumu
- [04-i18n.md](./04-i18n.md) - çeviri kapsamı ve slug kuralları
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) - Velite şeması
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md) - Person JSON-LD, hreflang
- [11-acik-isler.md](./11-acik-isler.md) - bekleyen teslimatlar ve metin onayı

## Kaynaklar

- https://hakia.com/skills/building-portfolio/
- https://slategit.com/blog/how-many-projects-to-feature-on-a-developer-portfolio
- https://proxify.io/knowledge-base/developer-types/how-do-developer-portfolios-differ-from-case-studies
- https://www.teamblind.com/post/do-portfolio-projects-actually-help-developers-get-jobs-yvtvuwcq
- https://dev.to/abpanic/how-to-add-a-credly-badge-page-to-your-site-cbo
- https://www.patika.dev/blog/tecrubeniz-yoksa-yazilimci-portfolyosu-var-peki-nasil-olacak
- https://www.resumonk.com/articles/unfinished-degree-on-resume
- https://noted.lol/every-developer-should-try-self-hosting/
