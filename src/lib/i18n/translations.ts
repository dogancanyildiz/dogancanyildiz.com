export type Locale = "en" | "tr";

export const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      projects: "Projects",
      contact: "Contact",
    },
    brand: "Alex Chen",
    hero: {
      greeting: "Hi, I'm",
      name: "Alex Chen",
      role: "Frontend Developer",
      title: "Designing premium digital products with clarity, rhythm, and speed.",
      subtitle:
        "I build interface systems, product experiences, and frontend architecture for teams that care about detail.",
      viewProjects: "View projects",
      contact: "Get in touch",
      availableForWork: "Available for select work",
      downloadCV: "Download CV",
      eyebrow: "Independent frontend partner",
      summaryTitle: "A sharper way to ship",
      summaryBody:
        "From landing pages to internal tools, I turn rough product ideas into interfaces that feel editorial, modern, and easy to use.",
      metricYears: "Years shipping products",
      metricProjects: "Selected launches",
      metricFocus: "Focus across design and code",
      focus1: "Design systems",
      focus2: "Product websites",
      focus3: "Application UI",
      focus4: "Frontend architecture",
      note: "Currently based in Istanbul, collaborating remotely with product teams.",
      focusLabel: "Focus",
    },
    home: {
      featuredTitle: "Featured projects",
      featuredSubtitle: "A curated selection of launches, systems, and product work.",
      skillsTitle: "Technologies I work with",
      viewAll: "View all projects",
      featuredEyebrow: "Selected work",
      skillsEyebrow: "Capabilities",
      skillsSubtitle:
        "A practical stack shaped by product delivery, systems thinking, and interface craft.",
    },
    footer: {
      copyright: "All rights reserved.",
      contact: "Contact",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter",
      elsewhere: "Elsewhere",
      availability: "Available for select freelance and full-time collaborations.",
      tagline: "Crafting interfaces with a calm visual voice and strong frontend foundations.",
      emailLabel: "Primary email",
    },
    about: {
      title: "About",
      intro:
        "I build product experiences that feel polished on the surface and dependable underneath.",
      p1: "My work sits at the intersection of UI craft, frontend engineering, and system thinking. I care about speed, accessibility, and giving teams a visual language they can keep extending.",
      p2: "Over the years I've worked on design systems, dashboards, e-commerce, internal tools, and launch surfaces. The throughline is always the same: make complex things feel legible.",
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
      eyebrow: "Profile",
      manifestoEyebrow: "Approach",
      manifestoTitle: "Frontend with an editorial eye",
      manifestoBody:
        "I like products that feel deliberate: clear hierarchy, thoughtful motion, stable architecture, and just enough personality to be memorable.",
      capabilitiesEyebrow: "Capabilities",
      timelineEyebrow: "Career path",
      educationEyebrow: "Background",
    },
    projects: {
      title: "Projects",
      subtitle:
        "A collection of product, platform, and systems work spanning commerce, analytics, design systems, and internal tooling.",
      backToProjects: "Back to projects",
      viewLive: "Live demo",
      viewSource: "Source code",
      technologies: "Technologies",
      notFound: "Project not found",
      eyebrow: "Archive",
      filtersTitle: "Browse by stack",
      all: "All",
      summary: "Project summary",
      impact: "Impact",
      role: "Role",
      links: "Links",
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
      subtitle:
        "If you're shaping a product, refreshing a marketing surface, or refining a frontend system, I'd be glad to hear about it.",
      location: "Based in Istanbul, Turkey",
      email: "alex@example.com",
      availability: "Open to full‑time and freelance opportunities.",
      eyebrow: "Start a conversation",
      cardTitle: "What I can help with",
      cardBody:
        "Design-forward product UI, landing page refreshes, component systems, and frontend clean-up for teams who want a sharper interface presence.",
      responseTitle: "Typical response",
      responseBody: "Usually within 1–2 business days.",
      workingTitle: "Working style",
      workingBody: "Structured, collaborative, and detail-oriented from kickoff through polish.",
      availabilityTitle: "Availability",
      availabilityBody: "Open for select product collaborations this quarter.",
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
      introTitle: "Message",
      introBody: "Share a little context and I'll reply with next steps.",
    },
    metadata: {
      defaultTitle: "Alex Chen Portfolio",
      defaultDescription: "Premium frontend portfolio — selected projects, experience, and contact.",
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
    brand: "Alex Chen",
    hero: {
      greeting: "Merhaba, ben",
      name: "Alex Chen",
      role: "Frontend Geliştirici",
      title: "Netlik, ritim ve hızla premium dijital ürünler tasarlıyorum.",
      subtitle:
        "Detaya önem veren ekipler için arayüz sistemleri, ürün deneyimleri ve frontend mimarisi geliştiriyorum.",
      viewProjects: "Projeleri gör",
      contact: "İletişime geç",
      availableForWork: "Seçili işler için uygunum",
      downloadCV: "CV İndir",
      eyebrow: "Bağımsız frontend partneri",
      summaryTitle: "Daha rafine teslimatlar",
      summaryBody:
        "Landing page'lerden dahili araçlara kadar ham ürün fikirlerini editoryal, modern ve kullanımı kolay arayüzlere dönüştürüyorum.",
      metricYears: "Yıllık ürün teslim deneyimi",
      metricProjects: "Seçili lansman",
      metricFocus: "Tasarım ve kod odağı",
      focus1: "Tasarım sistemleri",
      focus2: "Ürün siteleri",
      focus3: "Uygulama arayüzleri",
      focus4: "Frontend mimarisi",
      note: "Şu anda İstanbul merkezli, ürün ekipleriyle uzaktan çalışıyorum.",
      focusLabel: "Odak alanları",
    },
    home: {
      featuredTitle: "Öne çıkan projeler",
      featuredSubtitle: "Yayına aldığım ürünler, sistemler ve arayüz çalışmalarından seçki.",
      skillsTitle: "Çalıştığım teknolojiler",
      viewAll: "Tüm projeleri gör",
      featuredEyebrow: "Seçili işler",
      skillsEyebrow: "Yetenekler",
      skillsSubtitle:
        "Ürün teslimi, sistem yaklaşımı ve arayüz kalitesi etrafında şekillenmiş pratik bir teknoloji seti.",
    },
    footer: {
      copyright: "Tüm hakları saklıdır.",
      contact: "İletişim",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter",
      elsewhere: "Bağlantılar",
      availability: "Seçili freelance ve tam zamanlı iş birliklerine açığım.",
      tagline: "Sakin bir görsel dil ve güçlü frontend temelleriyle arayüzler geliştiriyorum.",
      emailLabel: "Birincil e-posta",
    },
    about: {
      title: "Hakkımda",
      intro:
        "Yüzeyde rafine, altında güvenilir hissettiren ürün deneyimleri geliştiriyorum.",
      p1: "İşim; arayüz kalitesi, frontend mühendisliği ve sistem düşüncesinin kesişiminde duruyor. Hıza, erişilebilirliğe ve ekiplerin büyütebileceği bir görsel dile önem veriyorum.",
      p2: "Yıllar içinde tasarım sistemleri, dashboard'lar, e-ticaret, dahili araçlar ve lansman yüzeyleri üzerinde çalıştım. Ortak hedef hep aynı: karmaşık işleri okunur hale getirmek.",
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
      eyebrow: "Profil",
      manifestoEyebrow: "Yaklaşım",
      manifestoTitle: "Editoryal bakış açısıyla frontend",
      manifestoBody:
        "Benim için iyi ürünler; net hiyerarşi, yerinde motion, sağlam mimari ve akılda kalan ölçülü bir karakter taşır.",
      capabilitiesEyebrow: "Yetkinlikler",
      timelineEyebrow: "Kariyer yolu",
      educationEyebrow: "Arka plan",
    },
    projects: {
      title: "Projeler",
      subtitle:
        "E-ticaret, analitik, tasarım sistemleri ve dahili araçlar arasında uzanan ürün ve platform işleri.",
      backToProjects: "Projelere dön",
      viewLive: "Canlıya bak",
      viewSource: "Kaynak kodu",
      technologies: "Teknolojiler",
      notFound: "Proje bulunamadı",
      eyebrow: "Arşiv",
      filtersTitle: "Teknolojiye göre filtrele",
      all: "Tümü",
      summary: "Proje özeti",
      impact: "Etkisi",
      role: "Rol",
      links: "Bağlantılar",
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
        "Bir ürün şekillendiriyor, landing page yeniliyor ya da frontend sisteminizi rafine etmek istiyorsanız detayları duymaktan memnun olurum.",
      location: "İstanbul, Türkiye",
      email: "alex@example.com",
      availability: "Tam zamanlı ve serbest çalışma fırsatlarına açığım.",
      eyebrow: "Konuşmayı başlatalım",
      cardTitle: "Destek olabileceğim alanlar",
      cardBody:
        "Tasarım odaklı ürün arayüzleri, landing page yenilemeleri, component sistemleri ve daha güçlü bir arayüz varlığı isteyen ekipler için frontend iyileştirmeleri.",
      responseTitle: "Yanıt süresi",
      responseBody: "Genelde 1–2 iş günü içinde.",
      workingTitle: "Çalışma tarzı",
      workingBody: "Kickoff'tan son polish aşamasına kadar yapılandırılmış, iş birlikçi ve detay odaklı.",
      availabilityTitle: "Uygunluk",
      availabilityBody: "Bu çeyrekte seçili ürün iş birliklerine açığım.",
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
      introTitle: "Mesaj",
      introBody: "Biraz bağlam paylaşın, sonraki adımlarla birlikte dönüş yapayım.",
    },
    metadata: {
      defaultTitle: "Alex Chen Portfolyo",
      defaultDescription: "Premium frontend portfolyosu — seçili projeler, deneyim ve iletişim.",
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
