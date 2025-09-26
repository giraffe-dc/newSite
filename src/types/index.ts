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
  _id?: string;
  name: string;
  price: string;
  description: string;
  duration?: string;
  category: string;
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