# Sertifika rozet görselleri

Bu klasördeki görseller Hakkımda sayfasının sertifika bölümünde kullanılır.
CSP `img-src 'self' data:` olduğu için hotlink yoktur, her dosya repoda durur.

## Kaynak ve kullanım

Credly rozet görselleri (11 PNG, 600x600, RGBA): rozeti kazanan kişi kendi
rozetini gösterebilir. Görseller Credly'nin herkese açık rozet kayıtlarından
indirildi (2026-09-02), 600x600 boyutunda alındı ve sharp ile kayıpsız yeniden
kodlandı (`compressionLevel: 9`, `effort: 10`; üç dosyada renk sayısı 256'nın
altında kaldığı için palet kullanıldı, hepsinde çıkan dosya piksel piksel
kaynakla aynı). Ölçek değiştirilmedi: 600x600 hem satırdaki 64px slot için hem
de tıklandığında açılan büyük önizleme için yeterli çözünürlüktür, küçük görsel
next/image optimizer'ından `sizes="64px"` ile iner.

| Dosya | Rozet | Credly kaydı |
| --- | --- | --- |
| `cyberops-associate.png` | CyberOps Associate | https://www.credly.com/badges/46e201d4-af31-4d46-aa0a-3d5b17c14711 |
| `cisco-networking-academy-learn-a-thon-2026.png` | Cisco Networking Academy Learn-A-Thon 2026 | https://www.credly.com/badges/b670b2f8-b9ad-4b79-bc66-82e4884393de |
| `linux-unhatched.png` | Linux Unhatched | https://www.credly.com/badges/dc6d5e37-48f0-47f0-9444-35621594b850 |
| `network-technician-career-path.png` | Network Technician Career Path | https://www.credly.com/badges/65b70ad1-7c9a-4c13-9396-d7fe3a5ce600 |
| `introduction-to-cybersecurity.png` | Introduction to Cybersecurity | https://www.credly.com/badges/aa7bea00-159e-47f2-b47f-90a07d09b551 |
| `ccna-enterprise-networking-security-and-automation.png` | CCNA: Enterprise Networking, Security, and Automation | https://www.credly.com/badges/f4dd0693-ae37-42fc-8a6e-4315a1faeadb |
| `ccna-switching-routing-and-wireless-essentials.png` | CCNA: Switching, Routing, and Wireless Essentials | https://www.credly.com/badges/8a51a779-c77a-4a8e-a596-8888429ac666 |
| `ccna-introduction-to-networks.png` | CCNA: Introduction to Networks | https://www.credly.com/badges/a8cf90df-9b5e-4b7a-aa80-ac17e77d8d78 |
| `cybersecurity-fundamentals.png` | Cybersecurity Fundamentals | https://www.credly.com/badges/56b3b1f4-3f60-405f-84f2-4fb86e808882 |
| `explore-emerging-tech.png` | Explore Emerging Tech | https://www.credly.com/badges/955c0a41-a526-4623-b7fb-045b7106be94 |
| `working-in-a-digital-world-professional-skills.png` | Working in a Digital World: Professional Skills | https://www.credly.com/badges/c8ece69e-2314-43f8-9261-45abed5ce485 |

`capt-certificate.jpg` (1600x1031, JPEG) sitenin sahibinin kendi Hackviser
sertifikasının görselidir; Hackviser bu sınav için ayrı bir rozet görseli
vermiyor, doğrulama https://hackviser.com/verify?id=HV-CAPT-02TKGO4Q
adresinden yapılır. Dosya kaynağından bayt bayt kopyalandı: JPEG'i sharp ile
yeniden kodlamak aynı kayıplı codec'in ikinci kuşağı olurdu.

Rozetlerin marka ve logo hakları verenlere (Cisco, IBM) aittir; burada yalnızca
kazanılan kimlik bilgisini göstermek için kullanılırlar.

## Yeni rozet eklerken

1. Görseli 600x600 PNG olarak bu klasöre koy.
2. `src/content/profile.ts` içindeki `certificateRecords` listesine kaydı ekle
   (`badge.src`, `width`, `height`, `issued`, `verifyUrl`).
3. `npm test` çalıştır: `tests/profile.test.ts` dosyanın varlığını ve PNG
   başlığındaki boyutun kayıttaki boyutla aynı olduğunu doğrular.
