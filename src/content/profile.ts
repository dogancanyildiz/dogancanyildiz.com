import type { Locale } from "@/lib/content";

export interface SkillGroup {
  title: string;
  items: string[];
  /** True for the four groups shown in the home page skills strip. */
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

export interface CertificateEntry {
  name: string;
  issuer: string;
  detail?: string;
  verifyUrl?: string;
}

export interface EducationEntry {
  program: string;
  school: string;
  period: string;
}

export const skills: Record<Locale, SkillGroup[]> = {
  en: [
    {
      title: "Frontend",
      items: ["TypeScript", "JavaScript", "Next.js", "React", "HTML", "CSS", "Bootstrap"],
      featured: true,
    },
    {
      title: "Backend",
      items: ["Node.js / Express.js", "PHP", "RESTful API design"],
      featured: true,
    },
    { title: "Databases", items: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"] },
    {
      title: "DevOps and infrastructure",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD pipelines",
        "Traefik",
        "Coolify",
        "Linux server engineering",
        "QEMU",
        "Go",
      ],
      featured: true,
    },
    {
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
      title: "Security",
      items: [
        "Vulnerability assessment and exploitation",
        "Network and system penetration testing",
        "Web application security testing",
        "SOC fundamentals",
      ],
      featured: true,
    },
    {
      title: "Ways of working",
      items: [
        "Agile / Scrum",
        "Sprint planning",
        "ClickUp",
        "Code review",
        "Issue and bug tracking",
        "Technical team leadership",
      ],
    },
    {
      title: "Other",
      items: [
        "DNS and domain configuration",
        "Website deployment and maintenance",
        "Tech community management",
        "Public speaking",
      ],
    },
  ],
  tr: [
    {
      title: "Frontend",
      items: ["TypeScript", "JavaScript", "Next.js", "React", "HTML", "CSS", "Bootstrap"],
      featured: true,
    },
    {
      title: "Backend",
      items: ["Node.js / Express.js", "PHP", "RESTful API tasarımı"],
      featured: true,
    },
    { title: "Veritabanları", items: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"] },
    {
      title: "DevOps ve altyapı",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD hatları",
        "Traefik",
        "Coolify",
        "Linux sunucu yönetimi",
        "QEMU",
        "Go",
      ],
      featured: true,
    },
    {
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
      title: "Güvenlik",
      items: [
        "Zafiyet analizi ve istismar",
        "Ağ ve sistem sızma testi",
        "Web uygulaması güvenlik testi",
        "SOC temelleri",
      ],
      featured: true,
    },
    {
      title: "Çalışma biçimi",
      items: [
        "Agile / Scrum",
        "Sprint planlama",
        "ClickUp",
        "Kod incelemesi",
        "İş ve hata takibi",
        "Teknik ekip liderliği",
      ],
    },
    {
      title: "Diğer",
      items: [
        "DNS ve alan adı yapılandırması",
        "Web sitesi yayına alma ve bakımı",
        "Teknik topluluk yönetimi",
        "Topluluk önünde konuşma",
      ],
    },
  ],
};

export const experience: Record<Locale, ExperienceEntry[]> = {
  en: [
    {
      role: "Full-Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Present",
      bullets: [
        "Build web applications with Next.js and React on the front end, Node.js/Express.js and PHP on the back end, designing and consuming RESTful APIs.",
        "Work across MySQL, MongoDB and SQLite, selecting the right database per project for scalable, maintainable systems.",
        "Delivered 5 production applications end-to-end, owning the full lifecycle from architecture and API design through deployment and maintenance.",
        "Automated build and release with GitHub Actions and Coolify, deploying Dockerized applications to self-hosted servers; managed sprint boards and issue tracking in ClickUp.",
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
        "Built responsive, accessible web interfaces with HTML, CSS, JavaScript and Bootstrap for 5+ client projects.",
        "Delivered 10+ custom WordPress themes and client-specific websites; improved UI/UX and ensured compatibility across mobile, tablet and desktop.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Intern",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "Developed a vehicle tracking management panel using PHP, JavaScript and third-party API integrations.",
        "Implemented simulation and API integration for municipal traffic light management.",
      ],
      stack: ["PHP", "JavaScript", "REST APIs"],
    },
  ],
  tr: [
    {
      role: "Full-Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Devam ediyor",
      bullets: [
        "Ön yüzde Next.js ve React, arka yüzde Node.js/Express.js ve PHP ile web uygulamaları geliştiriyorum; RESTful API'leri tasarlıyor ve tüketiyorum.",
        "MySQL, MongoDB ve SQLite ile çalışıyorum; ölçeklenebilir ve sürdürülebilir sistemler için her projede doğru veritabanını seçiyorum.",
        "5 üretim uygulamasını uçtan uca teslim ettim; mimari ve API tasarımından yayın ve bakıma kadar tüm yaşam döngüsünü üstlendim.",
        "GitHub Actions ve Coolify ile derleme ve yayın adımlarını otomatikleştirdim, Docker ile paketlenmiş uygulamaları kendi sunucularımıza yayına aldım; sprint panolarını ve iş takibini ClickUp üzerinde yürüttüm.",
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
        "5'ten fazla müşteri projesi için HTML, CSS, JavaScript ve Bootstrap ile duyarlı ve erişilebilir web arayüzleri geliştirdim.",
        "10'dan fazla özel WordPress teması ve müşteriye özel web sitesi teslim ettim; arayüz deneyimini iyileştirdim, mobil, tablet ve masaüstü uyumunu sağladım.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Stajyer",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "PHP, JavaScript ve üçüncü parti API entegrasyonlarıyla bir araç takip yönetim paneli geliştirdim.",
        "Belediye trafik ışığı yönetimi için simülasyon ve API entegrasyonu uyguladım.",
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
        "Organized technical events, hands-on workshops and community projects focused on Google Cloud technologies.",
    },
    {
      role: "Organizer",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "Co-organized tech talks, study jams and networking events across two years, supporting knowledge-sharing around Google technologies.",
    },
  ],
  tr: [
    {
      role: "Çekirdek ekip üyesi",
      organization: "GDG Cloud Konya",
      period: "05/2025 - 10/2025",
      description:
        "Google Cloud teknolojileri odağında teknik etkinlikler, uygulamalı atölyeler ve topluluk projeleri düzenledim.",
    },
    {
      role: "Organizatör",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "İki yıl boyunca teknik konuşmalar, study jam'ler ve tanışma etkinlikleri düzenledim; Google teknolojileri etrafında bilgi paylaşımını destekledim.",
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
export const certificates: Record<Locale, CertificateEntry[]> = {
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
};

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
