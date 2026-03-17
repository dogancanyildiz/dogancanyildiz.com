export type Locale = "en" | "tr";

export const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      projects: "Projects",
      contact: "Contact",
    },
    brand: "Portfolio",
    hero: {
      greeting: "Hi, I'm",
      name: "Alex Chen",
      role: "Frontend Developer",
      title: "Building clean, fast experiences for the web",
      subtitle:
        "I design and build modern web apps with React, Next.js, and TypeScript. Open to collaborations and new opportunities.",
      viewProjects: "View projects",
      contact: "Get in touch",
      availableForWork: "Open to work",
      downloadCV: "Download CV",
    },
    home: {
      featuredTitle: "Featured projects",
      featuredSubtitle: "A few things I've shipped recently.",
      skillsTitle: "Technologies I work with",
      viewAll: "View all projects",
    },
    footer: {
      copyright: "All rights reserved.",
      contact: "Contact",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter",
    },
    about: {
      title: "About",
      intro: "I'm a frontend developer with 5+ years of experience building web applications. I focus on performance, accessibility, and maintainable code.",
      p1: "I started with HTML and CSS, then moved to React and TypeScript. I've worked on design systems, dashboards, e‑commerce, and internal tools. I care about UX and developer experience alike.",
      p2: "When I'm not coding, I contribute to open source, write technical posts, and follow the JavaScript ecosystem. This site is built with Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, and Resend for the contact form.",
      skillsTitle: "Skills & tools",
      experienceTitle: "Experience",
      educationTitle: "Education",
      browseIntro: "You can browse my",
      or: " or ",
      projectsLink: "projects",
      contactLink: "get in touch",
      exp1Role: "Senior Frontend Developer",
      exp1Company: "TechCorp Inc.",
      exp1Period: "2021 – Present",
      exp1Desc: "Lead frontend for the main product. Introduced design system and improved Core Web Vitals.",
      exp2Role: "Frontend Developer",
      exp2Company: "StartupXYZ",
      exp2Period: "2019 – 2021",
      exp2Desc: "Built customer dashboard and admin panel with React. Integrated REST and GraphQL APIs.",
      exp3Role: "Junior Frontend Developer",
      exp3Company: "WebAgency",
      exp3Period: "2017 – 2019",
      exp3Desc: "Developed responsive sites and small web apps. Worked with designers and backend team.",
      edu1Degree: "B.Sc. Computer Science",
      edu1School: "State University",
      edu1Period: "2013 – 2017",
      downloadCV: "Download CV",
      skillsFrontend: "Frontend",
      skillsBackend: "Backend",
      skillsTools: "Tools",
    },
    projects: {
      title: "Projects",
      subtitle:
        "A selection of projects I've built. Each one uses modern tools and practices.",
      backToProjects: "Back to projects",
      viewLive: "Live demo",
      viewSource: "Source code",
      technologies: "Technologies",
      notFound: "Project not found",
      items: {
        "1": {
          title: "E‑commerce platform",
          description:
            "Full‑stack online store with product catalog, cart, checkout, and admin panel. Built with Next.js, Stripe, and PostgreSQL. Handles thousands of SKUs and supports multiple locales.",
        },
        "2": {
          title: "Analytics dashboard",
          description:
            "Real‑time analytics dashboard for marketing teams. Custom charts, filters, and export to CSV/PDF. Integrates with Google Analytics and internal APIs. Used by 50+ companies.",
        },
        "3": {
          title: "Design system & docs",
          description:
            "Internal design system with 40+ components, Storybook, and usage guidelines. Reduced UI inconsistency and sped up feature delivery across 5 product teams.",
        },
        "4": {
          title: "Developer CLI tool",
          description:
            "Open‑source CLI for scaffolding and deploying static sites. Published on npm with 10k+ weekly downloads. Written in TypeScript, supports plugins.",
        },
        "5": {
          title: "Mobile-first booking app",
          description:
            "Booking flow for a service marketplace. Calendar, availability, payments, and push notifications. React Native (Expo) and Node.js backend.",
        },
        "6": {
          title: "Internal HR portal",
          description:
            "Leave requests, timesheets, and org chart. SSO, role-based access, and audit logs. Built with React and .NET. Serves 500+ employees.",
        },
      },
    },
    contact: {
      title: "Contact",
      subtitle: "Have a project in mind or want to chat? Send a message and I'll get back to you within a couple of days.",
      location: "Based in Istanbul, Turkey",
      email: "alex@example.com",
      availability: "Open to full‑time and freelance opportunities.",
    },
    form: {
      name: "Name",
      email: "Email",
      subject: "Subject (optional)",
      message: "Message",
      placeholderName: "Your name",
      placeholderEmail: "you@example.com",
      placeholderSubject: "Subject",
      placeholderMessage: "Your message...",
      send: "Send message",
      sending: "Sending...",
      success: "Message sent. I'll get back to you soon.",
      errorGeneric: "Something went wrong. Please try again.",
      errorNetwork: "Network error. Please try again.",
    },
    metadata: {
      defaultTitle: "Portfolio",
      defaultDescription: "Personal portfolio — projects and contact.",
      aboutTitle: "About",
      aboutDescription: "About me and my work.",
      projectsTitle: "Projects",
      projectsDescription: "A selection of projects I've worked on.",
      contactTitle: "Contact",
      contactDescription: "Get in touch.",
    },
  },
  tr: {
    nav: {
      home: "Ana Sayfa",
      about: "Hakkımda",
      projects: "Projeler",
      contact: "İletişim",
    },
    brand: "Portfolio",
    hero: {
      greeting: "Merhaba, ben",
      name: "Alex Chen",
      role: "Frontend Geliştirici",
      title: "Web için sade ve hızlı deneyimler üretiyorum",
      subtitle:
        "React, Next.js ve TypeScript ile modern web uygulamaları tasarlayıp geliştiriyorum. İş birlikleri ve yeni fırsatlara açığım.",
      viewProjects: "Projeleri gör",
      contact: "İletişime geç",
      availableForWork: "İş arayışındayım",
      downloadCV: "CV İndir",
    },
    home: {
      featuredTitle: "Öne çıkan projeler",
      featuredSubtitle: "Son dönemde yayına aldığım birkaç proje.",
      skillsTitle: "Çalıştığım teknolojiler",
      viewAll: "Tüm projeleri gör",
    },
    footer: {
      copyright: "Tüm hakları saklıdır.",
      contact: "İletişim",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter",
    },
    about: {
      title: "Hakkımda",
      intro: "5 yılı aşkın süredir web uygulamaları geliştiren bir frontend geliştiriciyim. Performans, erişilebilirlik ve sürdürülebilir kod odaklı çalışıyorum.",
      p1: "HTML ve CSS ile başladım, ardından React ve TypeScript'e geçtim. Tasarım sistemleri, dashboard'lar, e‑ticaret ve dahili araçlar üzerinde çalıştım. Hem kullanıcı hem geliştirici deneyimine önem veriyorum.",
      p2: "Kod yazmadığım zamanlarda açık kaynağa katkıda bulunuyor, teknik yazılar yazıyor ve JavaScript ekosistemini takip ediyorum. Bu site Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion ve iletişim formu için Resend ile yapıldı.",
      skillsTitle: "Yetenekler ve araçlar",
      experienceTitle: "Deneyim",
      educationTitle: "Eğitim",
      browseIntro: "Projelerime göz atabilir veya",
      or: " sayfasına gidebilir veya ",
      projectsLink: "projeler",
      contactLink: "iletişime geçin",
      exp1Role: "Kıdemli Frontend Geliştirici",
      exp1Company: "TechCorp Inc.",
      exp1Period: "2021 – Günümüz",
      exp1Desc: "Ana ürünün frontend'ine liderlik. Tasarım sistemi kuruldu, Core Web Vitals iyileştirildi.",
      exp2Role: "Frontend Geliştirici",
      exp2Company: "StartupXYZ",
      exp2Period: "2019 – 2021",
      exp2Desc: "React ile müşteri paneli ve admin arayüzü geliştirildi. REST ve GraphQL API entegrasyonları.",
      exp3Role: "Junior Frontend Geliştirici",
      exp3Company: "WebAgency",
      exp3Period: "2017 – 2019",
      exp3Desc: "Duyarlı siteler ve küçük web uygulamaları. Tasarımcılar ve backend ekibiyle çalışıldı.",
      edu1Degree: "B.Sc. Bilgisayar Mühendisliği",
      edu1School: "Devlet Üniversitesi",
      edu1Period: "2013 – 2017",
      downloadCV: "CV İndir",
      skillsFrontend: "Frontend",
      skillsBackend: "Backend",
      skillsTools: "Araçlar",
    },
    projects: {
      title: "Projeler",
      subtitle:
        "Üzerinde çalıştığım projelerden bir seçki. Her biri modern araçlar ve pratikler kullanıyor.",
      backToProjects: "Projelere dön",
      viewLive: "Canlıya bak",
      viewSource: "Kaynak kodu",
      technologies: "Teknolojiler",
      notFound: "Proje bulunamadı",
      items: {
        "1": {
          title: "E‑ticaret platformu",
          description:
            "Ürün kataloğu, sepet, ödeme ve admin paneli olan tam yığın mağaza. Next.js, Stripe ve PostgreSQL. Binlerce SKU, çoklu dil desteği.",
        },
        "2": {
          title: "Analitik dashboard",
          description:
            "Pazarlama ekipleri için gerçek zamanlı analitik. Özel grafikler, filtreler, CSV/PDF dışa aktarma. Google Analytics ve dahili API entegrasyonu. 50+ şirket tarafından kullanılıyor.",
        },
        "3": {
          title: "Tasarım sistemi ve dokümantasyon",
          description:
            "40+ bileşenli dahili tasarım sistemi, Storybook ve kullanım kılavuzu. UI tutarlılığı artırıldı, 5 ürün ekibinde teslimat hızlandı.",
        },
        "4": {
          title: "Geliştirici CLI aracı",
          description:
            "Statik siteleri iskeletleyen ve yayınlayan açık kaynak CLI. npm'de haftalık 10k+ indirme. TypeScript, eklenti desteği.",
        },
        "5": {
          title: "Mobil öncelikli rezervasyon uygulaması",
          description:
            "Hizmet pazarı için rezervasyon akışı. Takvim, müsaitlik, ödemeler, push bildirimleri. React Native (Expo) ve Node.js backend.",
        },
        "6": {
          title: "Dahili İK portalı",
          description:
            "İzin talepleri, zaman çizelgeleri, organizasyon şeması. SSO, rol tabanlı erişim, denetim kayıtları. React ve .NET. 500+ çalışan.",
        },
      },
    },
    contact: {
      title: "İletişim",
      subtitle:
        "Aklınızda bir proje mi var ya da sohbet etmek mi istiyorsunuz? Mesaj gönderin, birkaç gün içinde dönüş yapacağım.",
      location: "İstanbul, Türkiye",
      email: "alex@example.com",
      availability: "Tam zamanlı ve serbest çalışma fırsatlarına açığım.",
    },
    form: {
      name: "Ad",
      email: "E-posta",
      subject: "Konu (isteğe bağlı)",
      message: "Mesaj",
      placeholderName: "Adınız",
      placeholderEmail: "siz@ornek.com",
      placeholderSubject: "Konu",
      placeholderMessage: "Mesajınız...",
      send: "Gönder",
      sending: "Gönderiliyor...",
      success: "Mesaj gönderildi. En kısa sürede dönüş yapacağım.",
      errorGeneric: "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
      errorNetwork: "Ağ hatası. Lütfen tekrar deneyin.",
    },
    metadata: {
      defaultTitle: "Portfolio",
      defaultDescription: "Kişisel portfolio — projeler ve iletişim.",
      aboutTitle: "Hakkımda",
      aboutDescription: "Ben ve çalışmalarım hakkında.",
      projectsTitle: "Projeler",
      projectsDescription: "Üzerinde çalıştığım projelerden bir seçki.",
      contactTitle: "İletişim",
      contactDescription: "İletişime geçin.",
    },
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

function getNested(
  obj: Record<string, unknown>,
  path: string
): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(locale: Locale, key: string): string {
  const obj = translations[locale] as Record<string, unknown>;
  return getNested(obj, key) ?? getNested(translations.en as Record<string, unknown>, key) ?? key;
}
