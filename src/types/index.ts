// Core application types
export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content: string;
  images: string[];
  technologies: string[];
  challenges: string[];
  solutions: string[];
  results: string[];
  password?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  image: string;
  url: string;
}

export interface AllSEOData {
  [key: string]: SEOData;
}

// Component prop types
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface CardProps {
  title: string;
  description: string;
  image?: string;
  className?: string;
  children?: React.ReactNode;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
}

// Form types
export interface FormData {
  name: string;
  email: string;
  message: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Animation types
export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
}


