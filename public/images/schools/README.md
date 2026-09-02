# Okul logoları

Bu klasördeki görseller Hakkımda sayfasının eğitim listesinde, her satırın
başında 40px yüksekliğinde amblem olarak kullanılır. CSP `img-src 'self' data:`
olduğu için hotlink yoktur, her dosya repoda durur.

Logolar okulların kendi markalarıdır; burada yalnızca hangi kurumda okunduğunu
göstermek için, kimlik amaçlı kullanılırlar. Site bu markalar üzerinde hak iddia
etmez, kurumlarla bir ortaklık ya da onay ilişkisi ima etmez. Satırda okul adı
zaten metin olarak yazılı olduğu için görseller `alt=""` ile dekoratif işaretlenir.

## Kaynak ve lisans

Dosyalar 2026-09-02 tarihinde Wikimedia Commons ve tr.wikipedia'dan indirildi.

| Dosya | Kaynak dosya sayfası | Lisans |
| --- | --- | --- |
| `konya-teknik-universitesi.svg` | https://commons.wikimedia.org/wiki/File:Konya_Teknik_%C3%9Cniversitesi_logo.svg | Kamu malı (Commons); kaynak KTÜN kurumsal kimlik sayfası |
| `anadolu-universitesi.svg` | https://commons.wikimedia.org/wiki/File:Anadolu_%C3%9Cniversitesi_Logosu.svg | Kamu malı (Commons), marka olarak tescilli |
| `kara-harp-okulu.png` | https://tr.wikipedia.org/wiki/Dosya:Kara_Harp_Okulu_br%C3%B6vesi_2024.png | Adil kullanım (tr.wikipedia yerel yüklemesi) |
| `necmettin-erbakan-universitesi.png` | https://tr.wikipedia.org/wiki/Dosya:Necmettin_Erbakan_%C3%9Cniversitesi_logosu.png | Adil kullanım (tr.wikipedia yerel yüklemesi) |

Milli Savunma Üniversitesi satırı Kara Harp Okulu brövesini kullanır: kayıt
"Milli Savunma Üniversitesi, Kara Harp Okulu" olarak yazılı ve 2024 brövesi
ikisinin adını da taşıyor.

## İşlem

İki SVG kaynaklarından bayt bayt kopyalandı; ikisi de yalnızca `path` ve gömülü
`style` içerir, `<script>`, `<image>`, `<use>`, `xlink:href` veya herhangi bir
dış referans yoktur (`grep` ile denetlendi). `next/image` `.svg` uzantılı
kaynağı kendiliğinden optimizer'a sokmaz, dosya olduğu gibi servis edilir.

İki PNG sharp ile kayıpsız yeniden kodlandı (`compressionLevel: 9`,
`effort: 10`); yazılan dosya piksel piksel kaynağın aynısı, sırasıyla 52073 ->
47009 ve 94232 -> 72629 bayt.

## Yeni okul eklerken

1. Görseli bu klasöre koy, kaynağını ve lisansını yukarıdaki tabloya yaz.
2. `src/content/profile.ts` içindeki `education` kayıtlarına iki dilde de
   `logo: { src, width, height }` ekle. SVG için genişlik ve yükseklik
   `viewBox` oranından, yüksekliği 200'e sabitleyerek türetilir; PNG için
   dosyanın gerçek piksel boyutudur.
3. `npm test` çalıştır: `tests/profile.test.ts` dosyanın varlığını, PNG
   başlığındaki boyutun kayıttakiyle aynı olduğunu ve SVG `viewBox` oranının
   kayıttaki orana uyduğunu doğrular.
