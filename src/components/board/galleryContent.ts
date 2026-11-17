/* Демо-вміст галереї (GAL-01).
   Ілюстрації й ролик перенесено з макета ZHYRAFYK_GALEREYA_DEMO.html
   як тимчасові заглушки. Реальні фото/відео й дозволи на зйомку
   дітей надає власник — замінюються в адмінці (секція «Галерея»). */

export interface GalleryAlbum {
  id: string;
  title: string;
  category: string;
  summary: string;
  /** Посилання на послугу/пакет із каталогу: service:<id> | package:<id>. */
  serviceRef: string;
  /** Текст послуги, якщо посилання з каталогу не вибрано. */
  serviceLabel: string;
  images: string[];
  /** Показувати серед обраних (на першій сторінці галереї). */
  featured: boolean;
  published: boolean;
  /** Відео альбому (необов'язково). */
  videoUrl: string;
}

export const GALLERY_CATEGORIES: ReadonlyArray<{
  id: string;
  label: string;
  icon: string;
}> = [
  { id: "animators", label: "Аніматори", icon: "🎈" },
  { id: "mascots", label: "Ростові ляльки", icon: "🦒" },
  { id: "shows", label: "Шоу", icon: "🎉" },
  { id: "gaming", label: "VR та PS4", icon: "🎮" },
  { id: "workshops", label: "Майстер-класи", icon: "🎨" },
  { id: "teens", label: "Підліткам", icon: "⚡" },
  { id: "adults", label: "Для дорослих", icon: "✨" },
  { id: "seasonal", label: "Новий рік", icon: "❄️" },
  { id: "school", label: "Випускні", icon: "🎓" },
] as const;

export function galleryCategoryLabel(id: string): string {
  return GALLERY_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: "paper-disco",
    title: "Паперова дискотека",
    category: "shows",
    summary: "Паперовий драйв, яскравий фінал і море радості.",
    serviceRef: "service:шоу 3",
    serviceLabel: "Паперове шоу",
    images: [
      "/brand/demo/gallery/paper-disco-1.svg",
      "/brand/demo/gallery/paper-disco-2.svg",
      "/brand/demo/gallery/paper-disco-3.svg",
      "/brand/demo/gallery/paper-disco-4.svg",
    ],
    featured: true,
    published: true,
    videoUrl: "",
  },
  {
    id: "favorite-character",
    title: "Свято з улюбленим героєм",
    category: "animators",
    summary: "Тематичні ігри, руханки та весела компанія.",
    serviceRef: "service:animators 1",
    serviceLabel: "Аніматорські програми",
    images: [
      "/brand/demo/gallery/favorite-character-1.svg",
      "/brand/demo/gallery/favorite-character-2.svg",
      "/brand/demo/gallery/favorite-character-3.svg",
      "/brand/demo/gallery/favorite-character-4.svg",
    ],
    featured: true,
    published: true,
    videoUrl: "",
  },
  {
    id: "giraffe-surprise",
    title: "Жираф у гостях",
    category: "mascots",
    summary: "Експрес-привітання, сюрпризи та святкові фото.",
    serviceRef: "service:puppets",
    serviceLabel: "Ростові ляльки",
    images: [
      "/brand/demo/gallery/giraffe-surprise-1.svg",
      "/brand/demo/gallery/giraffe-surprise-2.svg",
      "/brand/demo/gallery/giraffe-surprise-3.svg",
      "/brand/demo/gallery/giraffe-surprise-4.svg",
    ],
    featured: true,
    published: true,
    videoUrl: "",
  },
  {
    id: "game-portal",
    title: "GAME PORTAL · VR + PS4",
    category: "gaming",
    summary: "Віртуальні пригоди та змагання в одній програмі.",
    serviceRef: "service:vr",
    serviceLabel: "VR та PS4",
    images: [
      "/brand/demo/gallery/game-portal-1.svg",
      "/brand/demo/gallery/game-portal-2.svg",
      "/brand/demo/gallery/game-portal-3.svg",
      "/brand/demo/gallery/game-portal-4.svg",
    ],
    featured: false,
    published: true,
    videoUrl: "",
  },
  {
    id: "creative-masterclass",
    title: "Творча майстерня",
    category: "workshops",
    summary: "Свічки, картини, декор та власні маленькі шедеври.",
    serviceRef: "service:mk-1",
    serviceLabel: "Майстер-класи",
    images: [
      "/brand/demo/gallery/creative-masterclass-1.svg",
      "/brand/demo/gallery/creative-masterclass-2.svg",
      "/brand/demo/gallery/creative-masterclass-3.svg",
      "/brand/demo/gallery/creative-masterclass-4.svg",
    ],
    featured: false,
    published: true,
    videoUrl: "",
  },
  {
    id: "neon-teen-party",
    title: "Неонова вечірка",
    category: "teens",
    summary: "Сучасна атмосфера, музика та світловий настрій.",
    serviceRef: "service:шоу 2",
    serviceLabel: "Підліткові вечірки",
    images: [
      "/brand/demo/gallery/neon-teen-party-1.svg",
      "/brand/demo/gallery/neon-teen-party-2.svg",
      "/brand/demo/gallery/neon-teen-party-3.svg",
      "/brand/demo/gallery/neon-teen-party-4.svg",
    ],
    featured: true,
    published: true,
    videoUrl: "/brand/demo/gallery-demo.mp4",
  },
  {
    id: "warm-surprise",
    title: "Привітання для дорослих",
    category: "adults",
    summary: "Несподіваний візит і справжні святкові емоції.",
    serviceRef: "",
    serviceLabel: "Експрес-привітання",
    images: [
      "/brand/demo/gallery/warm-surprise-1.svg",
      "/brand/demo/gallery/warm-surprise-2.svg",
      "/brand/demo/gallery/warm-surprise-3.svg",
      "/brand/demo/gallery/warm-surprise-4.svg",
    ],
    featured: false,
    published: true,
    videoUrl: "",
  },
  {
    id: "winter-magic",
    title: "Новорічні пригоди",
    category: "seasonal",
    summary: "Миколай, Ангел, Санта, Ельфійка та казковий настрій.",
    serviceRef: "service:new-bmbk4ot",
    serviceLabel: "Новорічні привітання",
    images: [
      "/brand/demo/gallery/winter-magic-1.svg",
      "/brand/demo/gallery/winter-magic-2.svg",
      "/brand/demo/gallery/winter-magic-3.svg",
      "/brand/demo/gallery/winter-magic-4.svg",
    ],
    featured: true,
    published: true,
    videoUrl: "/brand/demo/gallery-demo.mp4",
  },
  {
    id: "graduation",
    title: "Святковий випускний",
    category: "school",
    summary: "Командні ігри, привітання і завершення важливого етапу.",
    serviceRef: "service:animators 3",
    serviceLabel: "Програми для колективів",
    images: [
      "/brand/demo/gallery/graduation-1.svg",
      "/brand/demo/gallery/graduation-2.svg",
      "/brand/demo/gallery/graduation-3.svg",
      "/brand/demo/gallery/graduation-4.svg",
    ],
    featured: false,
    published: true,
    videoUrl: "",
  },
];
