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

export interface SurveyOption {
    id: string
    text: string
}

export interface SurveyField {
    id: string
    label: string
}

export interface SurveyVoteData {
    newsId: string
    optionIds: string[]
    votedAt: string // ISO date
    // можна додати userId або інші дані про голосуючого
}

export interface SurveyResults {
    totalVotes: number
    optionResults: Record<string, number> // optionId -> count
    lastVoteAt: string // ISO date
}

export interface Survey {
    question: string
    options: SurveyOption[]
    allowMultiple?: boolean
    endDate?: string // ISO date when survey ends
    results?: SurveyResults
    // for free-form text surveys
    fields?: SurveyField[]
}

export interface NewsItem {
    _id?: string
    title: string
    content: string
    date: string
    type: 'news' | 'event'
    image?: string
    images?: string[]
    survey?: Survey
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
