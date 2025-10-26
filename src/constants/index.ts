// Navigation constants
export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/case-studies' },
  { label: 'Contact', href: '/contact' },
] as const;

// Technology categories
export const TECH_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps',
  'Design',
  'Mobile',
] as const;

// Animation presets
export const ANIMATION_PRESETS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 }
  }
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Color palette
export const COLORS = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    50: '#f8fafc',
    500: '#64748b',
    600: '#475569',
  },
  accent: {
    50: '#fdf4ff',
    500: '#a855f7',
    600: '#9333ea',
  }
} as const;


