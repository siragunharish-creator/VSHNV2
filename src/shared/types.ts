export interface SiteSettings {
  companyName: string;
  tagline: string;
  supportingTagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  googleMapsEmbed: string;
  experienceYears: number;
  foundersExperienceYears: number;
  completedProjectsCount: number;
  ongoingProjectsCount: number;
  happyClientsCount: number;
  sqFtConstructed: string;
  logoUrl: string;
  socials: {
    instagram: string;
    youtube: string;
    threads: string;
    facebook?: string;
  };
  businessHours: string;
  hero: {
    headline: string;
    subheading: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundImage: string;
  };
  aboutSection: {
    introHeading: string;
    introParagraph: string;
    story: string;
    founderName: string;
    founderTitle: string;
    founderMessage: string;
    founderExperience: string;
    mission: string;
    vision: string;
    image: string;
  };
  brandValues: Array<{
    letter: string;
    title: string;
    description: string;
  }>;
  sectionVisibility: {
    hero: boolean;
    stats: boolean;
    brandValues: boolean;
    services: boolean;
    calculator: boolean;
    projects: boolean;
    packages: boolean;
    process: boolean;
    testimonials: boolean;
    faq: boolean;
    contact: boolean;
  };
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  location: string;
  city: string;
  category: 'Residential Villa' | 'Independent House' | 'Duplex' | 'Turnkey Construction' | 'Renovation';
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  propertyType: string;
  builtUpArea: number; // in sq.ft
  floors: string; // e.g., 'G+1', 'G+2'
  completionYear: number;
  coverImage: string;
  galleryImages: string[];
  floorPlanImages?: string[];
  threeDDesignImages?: string[];
  description: string;
  keyFeatures: string[];
  packageUsed?: 'Super' | 'Deluxe' | 'Premium';
  isFeatured: boolean;
  isPublished: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  startingPrice?: string;
  benefits: string[];
  deliverables: string[];
  isPublished: boolean;
  order: number;
}

export interface PricingPackage {
  id: string;
  name: 'Super' | 'Deluxe' | 'Premium' | string;
  ratePerSqFt: number; // e.g. 2250, 2450, 2650
  badge?: string;
  tagline: string;
  description: string;
  isPopular?: boolean;
  isPublished: boolean;
  specifications: {
    category: string;
    details: string;
  }[];
  includedHighlights: string[];
}

export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  projectTitle: string;
  review: string;
  rating: number;
  avatarUrl?: string;
  isPublished: boolean;
  isDemo?: boolean;
  date: string;
}

export interface MediaItem {
  id: string;
  url: string;
  title: string;
  altText: string;
  category: 'exterior' | 'interior' | 'floor_plan' | '3d_render' | 'site_work' | 'branding';
  uploadedAt: string;
  sizeBytes?: number;
}

export interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  email?: string;
  plotLocation: string;
  serviceNeeded: string;
  estimatedSqFt?: number;
  preferredPackage?: string;
  budgetRange?: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
  createdAt: string;
  adminNotes?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface WebsiteContent {
  settings: SiteSettings;
  projects: Project[];
  services: Service[];
  packages: PricingPackage[];
  testimonials: Testimonial[];
  mediaLibrary: MediaItem[];
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
  }>;
}

export interface AuthUser {
  username: string;
  name: string;
  role: 'admin';
}
