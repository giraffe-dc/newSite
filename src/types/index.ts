export interface FeatureCard {
  title: string;
  description: string;
}

export interface HomeData {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  images: string[];
  featureCards?: FeatureCard[];
  workingHours: string;
  phone: string;
  serviceArea: string;
  whatsapp?: string;
  telegram?: string;
  // Підтверджені факти нової концепції. Необов'язкові, щоб не ламати
  // наявні документи CMS і контракти адмінки.
  baseCity?: string; // «Теплик»
  serviceZone?: string; // «Теплик і район · виїзди на 30+ км»
  crewSize?: number; // 3
  eventsCount?: number; // 100
  brandCharacter?: string;
  posterImage?: string;
}

export interface PriceItem {
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
  video?: string | undefined;
}

export interface SurveyOption {
  id: string;
  text: string;
}

export interface SurveyField {
  id: string;
  label: string;
}

export interface SurveyVoteData {
  newsId: string;
  optionIds: string[];
  votedAt: string; // ISO date
  // можна додати userId або інші дані про голосуючого
}

export interface SurveyResults {
  totalVotes: number;
  optionResults: Record<string, number>; // optionId -> count
  lastVoteAt: string; // ISO date
}

export interface Survey {
  question: string;
  options: SurveyOption[];
  allowMultiple?: boolean;
  endDate?: string; // ISO date when survey ends
  results?: SurveyResults;
  // for free-form text surveys
  fields?: SurveyField[];
}

export interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  date: string;
  type: "news" | "event";
  image?: string;
  images?: string[];
  survey?: Survey;
}

export interface OfferItem {
  _id?: string;
  title: string;
  description: string;
  active?: boolean;
  startDate?: string; // ISO
  endDate?: string; // ISO
  priority?: number;
  recommended?: boolean;
  icon?: string; // emoji or icon code
}

export interface ServiceItem {
  _id?: string;
  name: string;
  shortDescription: string;
  description: string;
  category:
    | "animation"
    | "life-size-doll"
    | "vr"
    | "playstation"
    | "master-class"
    | "decor";
  priceFrom: string;
  duration?: string;
  icon?: string; // emoji or icon name
  image?: string;
  active?: boolean;
  priority?: number;
}

export interface ServicePackage {
  _id?: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  includes: string[]; // список послуг, що входять
  recommended?: boolean;
  active?: boolean;
  priority?: number;
  icon?: string;
}

export interface OrderItem {
  serviceId?: string;
  serviceName: string;
  quantity?: number;
  price?: string;
}

export interface Order {
  _id?: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  date?: string; // ISO date of event
  time?: string; // optional time string
  eventAddress: string; // адреса проведення святкування
  eventType: string; // день народження, випускний, корпоратив тощо
  childrenCount?: number;
  notes?: string;
  items?: OrderItem[];
  packageId?: string;
  packageName?: string;
  programId?: string; // обрана програма виїзду
  contactChannel?: "phone" | "telegram" | "whatsapp" | "chat";
  createdAt?: string;
  /** Нова заявка на виїзд → На зв'язку → Підтверджено → Виконано. */
  status?: OrderStatus;
}

/** Єдиний тип контактів. Адреса стаціонарного центру не друкується —
 *  лишається лише зона виїзду; поле address збережене для сумісності адмінки. */
export interface ContactInfo {
  _id?: string;
  phone: string;
  email: string;
  workingHours: string;
  serviceArea: string; // «Теплик і район · виїзди на 30+ км»
  whatsapp?: string;
  telegram?: string;
  address?: string; // deprecated: не показувати на публічних сторінках
  socialMedia: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
}

export type OrderStatus =
  | "new"
  | "in_contact"
  | "confirmed"
  | "done"
  | "cancelled";

export interface Testimonial {
  _id?: string;
  name: string; // ім'я батька/клієнта
  text: string; // текст відгуку
  rating: number; // 1-5 зірок
  event?: string; // тип свята (день народження, випускний тощо)
  location?: string; // населений пункт виїзду
  photo?: string;
  date?: string; // ISO
  active?: boolean;
}

export interface FaqItem {
  _id?: string;
  question: string;
  answer: string;
  order?: number;
  active?: boolean;
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description: string;
  category:
    | "birthday"
    | "graduation"
    | "garden-school"
    | "vr-party"
    | "corporate"
    | "other";
  image?: string;
  beforeImage?: string;
  afterImage?: string;
  location?: string;
  date?: string;
  active?: boolean;
  priority?: number;
}

export interface Skill {
  _id?: string;
  name: string; // назва навички (напр. Анімація, Робота з VR, Ростові ляльки)
  description: string; // короткий опис
  icon?: string; // emoji або назва іконки lucide
  level?: number; // 0-100, рівень володіння
  category?: string; // категорія навички
  active?: boolean;
  priority?: number;
}
