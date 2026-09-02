import type { Locale } from "@/lib/content";

export type SkillCategoryId =
  | "frontend"
  | "backend"
  | "databases"
  | "devops"
  | "networking"
  | "security"
  | "ways-of-working"
  | "other";

export interface SkillGroup {
  id: SkillCategoryId;
  /** Display order on the page. Lower numbers appear first. */
  order: number;
  title: string;
  items: string[];
  /** True for the stack categories shown on the home page. */
  featured?: boolean;
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
  stack: string[];
}

export interface CommunityEntry {
  role: string;
  organization: string;
  period: string;
  description: string;
}

export interface SpeakingEntry {
  event: string;
  topic: string;
  date: string;
}

/**
 * A verification link is rendered straight into an href on the About page, so
 * the scheme is part of the contract rather than a formatting preference: a
 * javascript: or data: value contributed through a content pull request would
 * execute in the visitor's page. The template literal type rejects the obvious
 * cases at compile time and isHttpsUrl covers what the type cannot see, for
 * example a value that arrives through a cast. scripts/audit-live-links.mjs
 * already assumes the same https prefix.
 */
export type HttpsUrl = `https://${string}`;

export function isHttpsUrl(value: string): value is HttpsUrl {
  if (!value.startsWith("https://")) {
    return false;
  }
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Issuing organizations, in the order the About page prints their headings.
 * The group is what the reader sees first, so it is part of the data rather
 * than a sort key derived from the issuer string at render time.
 */
export type CertificateGroupId =
  | "hackviser"
  | "cisco-networking-academy"
  | "ibm-skillsbuild"
  | "global-ai-hub";

/**
 * An ISO calendar date. The template literal stops a prose date ("June 2025")
 * at compile time; isIsoDate below catches what the type cannot, such as
 * 2026-13-45, which satisfies the template but is not a day.
 */
export type IsoDate = `${number}-${number}-${number}`;

export function isIsoDate(value: string): value is IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Date.parse would accept 2026-02-30 and roll it into March, so compare the
  // parsed day back against the digits that were written.
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/** Local artwork for one credential. Remote badge CDNs are blocked by the CSP. */
export interface CertificateBadge {
  /** Path under public/, always inside the badges folder. */
  src: `/images/badges/${string}`;
  /** Intrinsic pixel size, which next/image needs to reserve the box. */
  width: number;
  height: number;
  /**
   * "badge" is the square emblem an issuer mints; "certificate" is a landscape
   * document scan. The About page gives them the same height but only the
   * square one a square slot.
   */
  kind: "badge" | "certificate";
}

/**
 * The subjects a credential covers, in the two locales.
 *
 * The name of a course says almost nothing about what was assessed: "CCNA:
 * Enterprise Networking, Security, and Automation" and "CyberOps Associate"
 * read as two identical mysteries to anyone outside the Cisco track. These
 * are the issuers' own skill tags, copied rather than paraphrased, so the
 * line under a name is evidence and not marketing.
 *
 * Both lists carry the same entries in the same order, so a reader switching
 * language sees the same claim.
 */
export interface CertificateKeywords {
  en: string[];
  tr: string[];
}

export interface CertificateEntry {
  /** Official name as the issuer writes it. Identical in both locales. */
  name: string;
  issuer: string;
  group: CertificateGroupId;
  keywords: CertificateKeywords;
  issued?: IsoDate;
  credentialId?: string;
  verifyUrl?: HttpsUrl;
  badge?: CertificateBadge;
  /**
   * True for an event attendance badge rather than an assessed credential.
   * The owner's decision is to keep these after the assessed ones inside
   * their group, whatever their date.
   */
  participation?: true;
  /** schema.org credentialCategory for the Person node's hasCredential list. */
  credentialCategory: "certificate" | "badge";
}

const BADGE_DIRECTORY = "/images/badges/";

/**
 * Six is where the line stops being a summary. The row prints them on one
 * muted line under the name, and past six the line wraps into a paragraph
 * that competes with the credential it is describing.
 */
const MAX_KEYWORDS = 6;

/**
 * Fails the build when a certificate carries a link the About page must not
 * render, a date no formatter can read, or artwork from outside the folder
 * the CSP allows. Every one of these reaches an attribute in the page, so the
 * check belongs at module load rather than in a test that a content only
 * change might not run.
 */
export function withCheckedCertificates(
  entries: Record<Locale, CertificateEntry[]>
): Record<Locale, CertificateEntry[]> {
  for (const [locale, list] of Object.entries(entries)) {
    for (const entry of list) {
      const where = `certificates.${locale}: "${entry.name}"`;
      if (entry.verifyUrl !== undefined && !isHttpsUrl(entry.verifyUrl)) {
        throw new Error(
          `${where} has a verifyUrl that is not https: ${entry.verifyUrl}`
        );
      }
      if (entry.issued !== undefined && !isIsoDate(entry.issued)) {
        throw new Error(
          `${where} has an issued date that is not an ISO calendar day: ${entry.issued}`
        );
      }
      if (entry.badge !== undefined) {
        if (!entry.badge.src.startsWith(BADGE_DIRECTORY)) {
          throw new Error(
            `${where} has badge artwork outside ${BADGE_DIRECTORY}: ${entry.badge.src}`
          );
        }
        if (entry.badge.width <= 0 || entry.badge.height <= 0) {
          throw new Error(
            `${where} has badge artwork without an intrinsic size: ${entry.badge.width}x${entry.badge.height}`
          );
        }
      }
      const { en, tr } = entry.keywords;
      if (en.length === 0) {
        throw new Error(`${where} has no keywords`);
      }
      if (en.length !== tr.length) {
        throw new Error(
          `${where} has ${en.length} English keywords and ${tr.length} Turkish ones: a reader switching language would see a different claim`
        );
      }
      if (en.length > MAX_KEYWORDS) {
        throw new Error(
          `${where} lists ${en.length} keywords, more than the ${MAX_KEYWORDS} the row prints`
        );
      }
      for (const keyword of [...en, ...tr]) {
        if (keyword.trim() === "") {
          throw new Error(`${where} has an empty keyword`);
        }
      }
    }
  }
  return entries;
}

export interface CertificateGroup {
  id: CertificateGroupId;
  /** Heading text, the issuer as this site names it. */
  issuer: string;
  entries: CertificateEntry[];
}

/**
 * Splits the flat list into the headings the About page prints, in the order
 * the entries were written. Grouping by walking the list instead of bucketing
 * by id keeps the authored order the single source of truth: an entry filed
 * out of place shows up as a repeated heading, which
 * tests/profile.test.ts fails on rather than quietly reordering it.
 */
export function certificateGroupsFor(locale: Locale): CertificateGroup[] {
  const groups: CertificateGroup[] = [];
  for (const entry of certificates[locale]) {
    const current = groups.at(-1);
    if (current?.id === entry.group) {
      current.entries.push(entry);
      continue;
    }
    groups.push({ id: entry.group, issuer: entry.issuer, entries: [entry] });
  }
  return groups;
}

/**
 * A school's own emblem, shown at the head of its education row.
 *
 * Rasters carry their real pixel size. The two SVG marks have no pixel size to
 * carry, so the box is their viewBox ratio normalized to a height of 200: it
 * is the aspect ratio next/image needs and nothing else, and writing the
 * viewBox numbers straight in would put 119.51 in a width attribute.
 *
 * See public/images/schools/README.md for where each file comes from and under
 * what terms.
 */
export interface SchoolLogo {
  /** Path under public/, always inside the schools folder. */
  src: `/images/schools/${string}`;
  width: number;
  height: number;
}

export interface EducationEntry {
  program: string;
  school: string;
  period: string;
  /** Absent where the institution publishes no usable mark. */
  logo?: SchoolLogo;
}

export const skills: Record<Locale, SkillGroup[]> = {
  en: [
    {
      id: "frontend",
      order: 1,
      title: "Frontend",
      items: [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Tailwind CSS",
        "Bootstrap",
      ],
      featured: true,
    },
    {
      id: "backend",
      order: 2,
      title: "Backend",
      items: [
        "Node.js / Express.js",
        "C# / ASP.NET MVC",
        "PHP",
        "RESTful API design",
      ],
      featured: true,
    },
    {
      id: "databases",
      order: 3,
      title: "Databases",
      items: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
      featured: true,
    },
    {
      id: "devops",
      order: 4,
      title: "DevOps and infrastructure",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD pipelines",
        "Linux server administration",
        "Traefik",
        "Coolify",
        "Go",
        "QEMU",
      ],
      featured: true,
    },
    {
      id: "security",
      order: 5,
      title: "Security",
      items: [
        "Web application security testing",
        "Network and system penetration testing",
        "Vulnerability assessment and exploitation",
        "SOC fundamentals",
      ],
      featured: true,
    },
    {
      id: "networking",
      order: 6,
      title: "Networking",
      items: [
        "Network fundamentals",
        "Routing and switching",
        "VLAN configuration",
        "IP addressing and subnetting",
        "WAN technologies",
        "Network automation",
        "Troubleshooting",
      ],
    },
    {
      id: "ways-of-working",
      order: 7,
      title: "Ways of working",
      items: [
        "Agile / Scrum",
        "Sprint planning",
        "Code review",
        "Issue and bug tracking",
        "ClickUp",
        "Technical team leadership",
      ],
    },
    {
      id: "other",
      order: 8,
      title: "Other",
      items: [
        "DNS and domain configuration",
        "Website deployment and maintenance",
        "Tech community management",
      ],
    },
  ],
  tr: [
    {
      id: "frontend",
      order: 1,
      title: "Frontend",
      items: [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Tailwind CSS",
        "Bootstrap",
      ],
      featured: true,
    },
    {
      id: "backend",
      order: 2,
      title: "Backend",
      items: [
        "Node.js / Express.js",
        "C# / ASP.NET MVC",
        "PHP",
        "RESTful API tasarımı",
      ],
      featured: true,
    },
    {
      id: "databases",
      order: 3,
      title: "Veritabanları",
      items: ["PostgreSQL", "MySQL", "SQLite", "MongoDB"],
      featured: true,
    },
    {
      id: "devops",
      order: 4,
      title: "DevOps ve altyapı",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD hatları",
        "Linux sunucu yönetimi",
        "Traefik",
        "Coolify",
        "Go",
        "QEMU",
      ],
      featured: true,
    },
    {
      id: "security",
      order: 5,
      title: "Güvenlik",
      items: [
        "Web uygulaması güvenlik testi",
        "Ağ ve sistem sızma testi",
        "Zafiyet analizi ve istismar",
        "SOC temelleri",
      ],
      featured: true,
    },
    {
      id: "networking",
      order: 6,
      title: "Ağ",
      items: [
        "Ağ temelleri",
        "Yönlendirme ve anahtarlama",
        "VLAN yapılandırması",
        "IP adresleme ve alt ağ",
        "WAN teknolojileri",
        "Ağ otomasyonu",
        "Sorun giderme",
      ],
    },
    {
      id: "ways-of-working",
      order: 7,
      title: "Çalışma biçimi",
      items: [
        "Agile / Scrum",
        "Sprint planlama",
        "Kod incelemesi",
        "İş ve hata takibi",
        "ClickUp",
        "Teknik ekip liderliği",
      ],
    },
    {
      id: "other",
      order: 8,
      title: "Diğer",
      items: [
        "DNS ve alan adı yapılandırması",
        "Web sitesi yayına alma ve bakımı",
        "Teknoloji topluluğu yönetimi",
      ],
    },
  ],
};

export const experience: Record<Locale, ExperienceEntry[]> = {
  en: [
    {
      role: "Full Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Present",
      bullets: [
        // The home page experience summary renders bullets[0], so the
        // measurable delivery fact leads the list rather than the stack.
        "5 production applications at BerrSoft came out of my hands. Architecture, API design, deployment and the maintenance after launch were all mine.",
        "The front end is Next.js and React, the back end Node.js/Express.js and PHP; I design the RESTful API that joins the two and consume it on the client.",
        "The database is a choice I make again on every project: MySQL, MongoDB, SQLite.",
        "Build and release are automated with GitHub Actions and Coolify; I push the Dockerized applications out to the company's own servers. Sprint boards and issue tracking live in ClickUp.",
      ],
      stack: [
        "Next.js",
        "React",
        "Node.js",
        "Express",
        "PHP",
        "MySQL",
        "MongoDB",
        "Docker",
        "GitHub Actions",
        "Coolify",
      ],
    },
    {
      role: "Frontend Web Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "06/2021 - 11/2024",
      bullets: [
        "5+ client projects got their interfaces from me: HTML, CSS, JavaScript and Bootstrap, responsive and accessible.",
        "10+ custom WordPress themes and client sites shipped in the same stretch. Every one of them had to hold its layout on mobile, tablet and desktop.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Intern",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "The vehicle tracking management panel I built there ran on PHP and JavaScript, with third-party API integrations behind it.",
        "Traffic light management at the municipality needed a simulation and an API integration; I wrote both.",
      ],
      stack: ["PHP", "JavaScript", "REST APIs"],
    },
  ],
  tr: [
    {
      role: "Full Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Devam ediyor",
      bullets: [
        "5 üretim uygulaması BerrSoft'ta benim elimden çıktı. Mimari, API tasarımı, yayın ve yayın sonrası bakım bendeydi.",
        "Ön yüz Next.js ve React, arka yüz Node.js/Express.js ve PHP; ikisini birleştiren RESTful API'yi ben tasarlıyorum, istemci tarafında yine ben tüketiyorum.",
        "Veritabanı her projede yeniden verdiğim bir karar: MySQL, MongoDB, SQLite.",
        "Derleme ve yayın GitHub Actions ile Coolify üzerinde otomatik ilerliyor; Docker ile paketlenen uygulamaları şirketin kendi sunucularına ben çıkarıyorum. Sprint panosu ve iş takibi ClickUp'ta duruyor.",
      ],
      stack: [
        "Next.js",
        "React",
        "Node.js",
        "Express",
        "PHP",
        "MySQL",
        "MongoDB",
        "Docker",
        "GitHub Actions",
        "Coolify",
      ],
    },
    {
      role: "Frontend Web Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "06/2021 - 11/2024",
      bullets: [
        "5'ten fazla müşteri projesinin arayüzü bendeydi: HTML, CSS, JavaScript ve Bootstrap ile duyarlı ve erişilebilir sayfalar yazdım.",
        "10'dan fazla özel WordPress teması ve müşteriye özel siteyi aynı dönemde teslim ettim. Her biri mobil, tablet ve masaüstünde düzenini korumak zorundaydı.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Stajyer",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "Araç takip yönetim panelini PHP, JavaScript ve üçüncü parti API entegrasyonlarıyla kurdum.",
        "Trafik ışığı yönetimi tarafında ise simülasyon ve API entegrasyonu vardı; ikisini de ben yazdım.",
      ],
      stack: ["PHP", "JavaScript", "REST API"],
    },
  ],
};

export const community: Record<Locale, CommunityEntry[]> = {
  en: [
    {
      role: "Core team member",
      organization: "GDG Cloud Konya",
      period: "05/2025 - 10/2025",
      description:
        "The core team ran technical events, hands-on workshops and community projects around Google Cloud. I took part in organizing them.",
    },
    {
      role: "Organizer",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "Two years of co-organizing tech talks, study jams and networking events around Google technologies.",
    },
  ],
  tr: [
    {
      role: "Çekirdek ekip üyesi",
      organization: "GDG Cloud Konya",
      period: "05/2025 - 10/2025",
      description:
        "Çekirdek ekip Google Cloud odağında teknik etkinlikler, uygulamalı atölyeler ve topluluk projeleri yürüttü. Ben de bunların organizasyonunda görev aldım.",
    },
    {
      role: "Organizatör",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "İki yıl boyunca Google teknolojileri etrafında teknik konuşmalar, study jam'ler ve tanışma etkinlikleri düzenledim.",
    },
  ],
};

// Event name, topic and date have not been delivered by the site owner yet.
// The About page never renders the Talks block while these arrays are empty.
// A bracketed placeholder line is NEVER written here.
export const speaking: Record<Locale, SpeakingEntry[]> = {
  en: [],
  tr: [],
};

/**
 * One list, both locales.
 *
 * A credential name is issued in English and is not translated: "CCNA:
 * Introduction to Networks" is the name printed on the record a visitor
 * verifies, and a Turkish paraphrase would not match it. The issuers are named
 * as this site names them, which is why the Cisco badges say "Cisco Networking
 * Academy" where Credly's payload says only "Cisco". Everything else on the
 * row (date, credential id, link) is data, so a second copy per locale would
 * only be a second place to get it wrong.
 *
 * Order is the display order: groups in the sequence the About page prints
 * them, newest first inside a group, attendance badges after the assessed
 * ones. Dates and links come from the issuers' own records (Credly badge
 * pages, the Hackviser verification page), read on 2026-09-02.
 */
const certificateRecords: CertificateEntry[] = [
  {
    name: "Certified Associate Penetration Tester (CAPT)",
    keywords: {
      en: ["Hands-on penetration testing", "methodology", "tools", "techniques", "reporting"],
      tr: ["Uygulamalı sızma testi", "metodoloji", "araçlar", "teknikler", "raporlama"],
    },
    issuer: "Hackviser",
    group: "hackviser",
    issued: "2025-06-01",
    credentialId: "HV-CAPT-02TKGO4Q",
    verifyUrl: "https://hackviser.com/verify?id=HV-CAPT-02TKGO4Q",
    // Hackviser mints no badge emblem for this exam, so the artwork is the
    // certificate itself and the About page gives it a landscape slot.
    badge: {
      src: "/images/badges/capt-certificate.jpg",
      width: 1600,
      height: 1031,
      kind: "certificate",
    },
    credentialCategory: "certificate",
  },
  {
    name: "CyberOps Associate",
    keywords: {
      en: ["SOC monitoring", "intrusion analysis", "incident response", "malware analysis", "cryptography"],
      tr: ["SOC izleme", "saldırı analizi", "olay müdahalesi", "zararlı yazılım analizi", "kriptografi"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2026-06-02",
    verifyUrl: "https://www.credly.com/badges/46e201d4-af31-4d46-aa0a-3d5b17c14711",
    badge: {
      src: "/images/badges/cyberops-associate.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Linux Unhatched",
    keywords: {
      en: ["Linux command line", "files and permissions", "processes", "basic scripting"],
      tr: ["Linux komut satırı", "dosya ve izinler", "süreçler", "temel betikleme"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2026-02-18",
    verifyUrl: "https://www.credly.com/badges/dc6d5e37-48f0-47f0-9444-35621594b850",
    badge: {
      src: "/images/badges/linux-unhatched.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Network Technician Career Path",
    keywords: {
      en: ["Network fundamentals", "IPv4 and IPv6 addressing", "Cisco IOS", "cabling", "troubleshooting"],
      tr: ["Ağ temelleri", "IPv4 ve IPv6 adresleme", "Cisco IOS", "kablolama", "sorun giderme"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2026-02-14",
    verifyUrl: "https://www.credly.com/badges/65b70ad1-7c9a-4c13-9396-d7fe3a5ce600",
    badge: {
      src: "/images/badges/network-technician-career-path.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Introduction to Cybersecurity",
    keywords: {
      en: ["Cyber threats", "network vulnerabilities", "privacy and data confidentiality", "best practices"],
      tr: ["Siber tehditler", "ağ zafiyetleri", "gizlilik ve veri mahremiyeti", "iyi uygulamalar"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2026-02-02",
    verifyUrl: "https://www.credly.com/badges/aa7bea00-159e-47f2-b47f-90a07d09b551",
    badge: {
      src: "/images/badges/introduction-to-cybersecurity.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  // The three CCNA courses used to be one "complete track" line. They are
  // three separately issued badges with three verification links, and a
  // visitor can only check what is named.
  {
    name: "CCNA: Enterprise Networking, Security, and Automation",
    keywords: {
      en: ["Dynamic routing", "NAT", "QoS", "WAN", "network automation", "threat mitigation"],
      tr: ["Dinamik yönlendirme", "NAT", "QoS", "WAN", "ağ otomasyonu", "tehdit azaltma"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2024-07-28",
    verifyUrl: "https://www.credly.com/badges/f4dd0693-ae37-42fc-8a6e-4315a1faeadb",
    badge: {
      src: "/images/badges/ccna-enterprise-networking-security-and-automation.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "CCNA: Switching, Routing, and Wireless Essentials",
    keywords: {
      en: ["Switching", "routing", "wireless LAN", "first-hop redundancy", "access security"],
      tr: ["Anahtarlama", "yönlendirme", "kablosuz LAN", "first-hop yedeklilik", "erişim güvenliği"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2024-07-22",
    verifyUrl: "https://www.credly.com/badges/8a51a779-c77a-4a8e-a596-8888429ac666",
    badge: {
      src: "/images/badges/ccna-switching-routing-and-wireless-essentials.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "CCNA: Introduction to Networks",
    keywords: {
      en: ["Network fundamentals", "IP subnetting", "IPv4 and IPv6", "Ethernet", "switching"],
      tr: ["Ağ temelleri", "IP alt ağlama", "IPv4 ve IPv6", "Ethernet", "anahtarlama"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2024-07-20",
    verifyUrl: "https://www.credly.com/badges/a8cf90df-9b5e-4b7a-aa80-ac17e77d8d78",
    badge: {
      src: "/images/badges/ccna-introduction-to-networks.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Cisco Networking Academy Learn-A-Thon 2026",
    keywords: {
      en: ["Participation badge", "Networking Academy event"],
      tr: ["Katılım rozeti", "Networking Academy etkinliği"],
    },
    issuer: "Cisco Networking Academy",
    group: "cisco-networking-academy",
    issued: "2026-04-29",
    verifyUrl: "https://www.credly.com/badges/b670b2f8-b9ad-4b79-bc66-82e4884393de",
    badge: {
      src: "/images/badges/cisco-networking-academy-learn-a-thon-2026.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    // An event badge, not a course result: it sits under the assessed Cisco
    // credentials even though its date is newer than most of them.
    participation: true,
    credentialCategory: "badge",
  },
  {
    name: "Cybersecurity Fundamentals",
    keywords: {
      en: ["Threat analysis", "social engineering", "cryptography", "incident response", "risk management"],
      tr: ["Tehdit analizi", "sosyal mühendislik", "kriptografi", "olay müdahalesi", "risk yönetimi"],
    },
    issuer: "IBM SkillsBuild",
    group: "ibm-skillsbuild",
    issued: "2024-05-27",
    verifyUrl: "https://www.credly.com/badges/56b3b1f4-3f60-405f-84f2-4fb86e808882",
    badge: {
      src: "/images/badges/cybersecurity-fundamentals.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Explore Emerging Tech",
    keywords: {
      en: ["AI", "blockchain", "cloud computing", "cybersecurity", "data analytics", "IoT"],
      tr: ["Yapay zeka", "blokzincir", "bulut bilişim", "siber güvenlik", "veri analitiği", "IoT"],
    },
    issuer: "IBM SkillsBuild",
    group: "ibm-skillsbuild",
    issued: "2024-05-16",
    verifyUrl: "https://www.credly.com/badges/955c0a41-a526-4623-b7fb-045b7106be94",
    badge: {
      src: "/images/badges/explore-emerging-tech.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    name: "Working in a Digital World: Professional Skills",
    keywords: {
      en: ["Agile methods", "presentations", "problem solving", "team collaboration"],
      tr: ["Çevik yöntemler", "sunum", "problem çözme", "ekip çalışması"],
    },
    issuer: "IBM SkillsBuild",
    group: "ibm-skillsbuild",
    issued: "2024-05-16",
    verifyUrl: "https://www.credly.com/badges/c8ece69e-2314-43f8-9261-45abed5ce485",
    badge: {
      src: "/images/badges/working-in-a-digital-world-professional-skills.png",
      width: 600,
      height: 600,
      kind: "badge",
    },
    credentialCategory: "badge",
  },
  {
    // No badge artwork and no working verification page: the owner's copies of
    // both are gone. The entry stays, with nothing invented to fill the gaps,
    // and the page prints no "unverifiable" apology next to it.
    name: "Version Control Systems and Portfolio",
    keywords: {
      en: ["Git", "GitHub", "portfolio building"],
      tr: ["Git", "GitHub", "portfolyo oluşturma"],
    },
    issuer: "Global AI Hub",
    group: "global-ai-hub",
    credentialCategory: "certificate",
  },
];

export const certificates: Record<Locale, CertificateEntry[]> =
  withCheckedCertificates({
    en: [...certificateRecords],
    tr: [...certificateRecords],
  });

export const education: Record<Locale, EducationEntry[]> = {
  en: [
    {
      program: "Mathematics and Computer Science",
      school: "Necmettin Erbakan University",
      period: "09/2025 - 06/2028",
      logo: {
        src: "/images/schools/necmettin-erbakan-universitesi.png",
        width: 300,
        height: 300,
      },
    },
    {
      program: "Computer Programming, associate degree",
      school: "Konya Technical University",
      period: "09/2023 - 06/2025",
      logo: {
        src: "/images/schools/konya-teknik-universitesi.svg",
        width: 200,
        height: 200,
      },
    },
    {
      program: "Web Design and Coding",
      school: "Anadolu University",
      period: "09/2023 - 06/2025",
      logo: {
        src: "/images/schools/anadolu-universitesi.svg",
        width: 861,
        height: 200,
      },
    },
    {
      program: "Electronics and Communications Engineering",
      school: "National Defence University, Turkish Military Academy",
      period: "10/2017 - 06/2021",
      logo: {
        src: "/images/schools/kara-harp-okulu.png",
        width: 146,
        height: 185,
      },
    },
  ],
  tr: [
    {
      program: "Matematik ve Bilgisayar Bilimleri",
      school: "Necmettin Erbakan Üniversitesi",
      period: "09/2025 - 06/2028",
      logo: {
        src: "/images/schools/necmettin-erbakan-universitesi.png",
        width: 300,
        height: 300,
      },
    },
    {
      program: "Bilgisayar Programcılığı, ön lisans",
      school: "Konya Teknik Üniversitesi",
      period: "09/2023 - 06/2025",
      logo: {
        src: "/images/schools/konya-teknik-universitesi.svg",
        width: 200,
        height: 200,
      },
    },
    {
      program: "Web Tasarımı ve Kodlama",
      school: "Anadolu Üniversitesi",
      period: "09/2023 - 06/2025",
      logo: {
        src: "/images/schools/anadolu-universitesi.svg",
        width: 861,
        height: 200,
      },
    },
    {
      program: "Elektronik ve Haberleşme Mühendisliği",
      school: "Milli Savunma Üniversitesi, Kara Harp Okulu",
      period: "10/2017 - 06/2021",
      logo: {
        src: "/images/schools/kara-harp-okulu.png",
        width: 146,
        height: 185,
      },
    },
  ],
};
