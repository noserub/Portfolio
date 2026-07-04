import positioning from "../data/seo-positioning.json";

export const seoPositioning = positioning;

export const SEO_LOCATION_LABEL = positioning.locationLabel;

export function personHomeLocationSchema() {
  return {
    "@type": "Place" as const,
    name: positioning.locationLabel,
    address: {
      "@type": "PostalAddress" as const,
      addressLocality: positioning.locationLocality,
      addressRegion: positioning.locationRegion,
      addressCountry: positioning.locationCountry,
    },
  };
}

export const PERSON_KNOWS_ABOUT = [
  "Enterprise AI",
  "Product Design",
  "UX Strategy",
  "Design Systems",
  "Generative AI",
  "AI Agents",
] as const;
