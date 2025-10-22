export interface HomeData {
  _id?: string;
  title: string;
  description: string;
  features: string[];
  images: string[];
  workingHours: string;
  address: string;
  phone: string;
}

export interface PriceItem {
    _id?: string
    name: string
    price: string
    description: string
    duration?: string
    category: string
    video?: string | undefined
}

export interface NewsItem {
  _id?: string;
  title: string;
  content: string;
  date: string;
  type: 'news' | 'event';
  image?: string;
}

export interface ContactInfo {
  _id?: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
}

export interface OfferItem {
    _id?: string
    title: string
    description: string
    active?: boolean
    startDate?: string // ISO
    endDate?: string // ISO
    priority?: number
    recommended?: boolean
    icon?: string // emoji or icon code
}

export interface OrderItem {
    serviceId?: string
    serviceName: string
    quantity?: number
    price?: string
}

export interface Order {
    _id?: string
    customerName: string
    phone: string
    date?: string // ISO date of event
    time?: string // optional time string
    notes?: string
    items?: OrderItem[]
    createdAt?: string
    status?: 'new' | 'confirmed' | 'cancelled'
}

export interface CafeItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}
