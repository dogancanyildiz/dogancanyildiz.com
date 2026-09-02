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

export interface CertificateEntry {
  name: string;
  issuer: string;
  detail?: string;
  verifyUrl?: HttpsUrl;
}

/** Fails the build when a certificate carries a link the About page must not render. */
export function withCheckedVerifyUrls(
  entries: Record<Locale, CertificateEntry[]>
): Record<Locale, CertificateEntry[]> {
  for (const [locale, list] of Object.entries(entries)) {
    for (const entry of list) {
      if (entry.verifyUrl !== undefined && !isHttpsUrl(entry.verifyUrl)) {
        throw new Error(
          `certificates.${locale}: "${entry.name}" has a verifyUrl that is not https: ${entry.verifyUrl}`
        );
      }
    }
  }
  return entries;
}

export interface EducationEntry {
  program: string;
  school: string;
  period: string;
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
        "Bootstrap",
      ],
      featured: true,
    },
    {
      id: "backend",
      order: 2,
      title: "Backend",
      items: ["Node.js / Express.js", "PHP", "RESTful API design"],
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
        "Bootstrap",
      ],
      featured: true,
    },
    {
      id: "backend",
      order: 2,
      title: "Backend",
      items: ["Node.js / Express.js", "PHP", "RESTful API tasarımı"],
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

// verifyUrl fields are filled in once the site owner provides verification
// links. Until then the field stays undefined; the entry itself is never
// dropped from the list.
export const certificates: Record<Locale, CertificateEntry[]> =
  withCheckedVerifyUrls({
    en: [
      { name: "Certified Associate Penetration Tester (CAPT)", issuer: "Hackviser" },
      {
        name: "CCNA complete track",
        issuer: "Cisco Networking Academy",
        detail:
          "Introduction to Networks · Switching, Routing and Wireless Essentials · Enterprise Networking, Security and Automation",
      },
      { name: "CyberOps Associate", issuer: "Cisco Networking Academy" },
      { name: "Network Technician Career Path", issuer: "Cisco Networking Academy" },
      { name: "Linux Unhatched", issuer: "Cisco Networking Academy" },
      { name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
      { name: "Version Control Systems and Portfolio", issuer: "Global AI Hub" },
    ],
    tr: [
      { name: "Certified Associate Penetration Tester (CAPT)", issuer: "Hackviser" },
      {
        name: "CCNA tam hattı",
        issuer: "Cisco Networking Academy",
        detail:
          "Introduction to Networks · Switching, Routing and Wireless Essentials · Enterprise Networking, Security and Automation",
      },
      { name: "CyberOps Associate", issuer: "Cisco Networking Academy" },
      { name: "Network Technician Career Path", issuer: "Cisco Networking Academy" },
      { name: "Linux Unhatched", issuer: "Cisco Networking Academy" },
      { name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
      { name: "Version Control Systems and Portfolio", issuer: "Global AI Hub" },
    ],
  });

export const education: Record<Locale, EducationEntry[]> = {
  en: [
    {
      program: "Mathematics and Computer Science",
      school: "Necmettin Erbakan University",
      period: "09/2025 - 06/2028",
    },
    {
      program: "Computer Programming, associate degree",
      school: "Konya Technical University",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Web Design and Coding",
      school: "Anadolu University",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Electronics and Communications Engineering",
      school: "National Defence University, Turkish Military Academy",
      period: "10/2017 - 06/2021",
    },
  ],
  tr: [
    {
      program: "Matematik ve Bilgisayar Bilimleri",
      school: "Necmettin Erbakan Üniversitesi",
      period: "09/2025 - 06/2028",
    },
    {
      program: "Bilgisayar Programcılığı, ön lisans",
      school: "Konya Teknik Üniversitesi",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Web Tasarımı ve Kodlama",
      school: "Anadolu Üniversitesi",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Elektronik ve Haberleşme Mühendisliği",
      school: "Milli Savunma Üniversitesi, Kara Harp Okulu",
      period: "10/2017 - 06/2021",
    },
  ],
};
