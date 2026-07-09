/**
 * Shared sitewide SEO defaults for index.html, inject-seo-html, and generate-sitemap.
 * Tuned for recruiters, hiring managers, and founders (AI product design + trust UX).
 */
const DEFAULT_AUTHOR = process.env.SITE_DEFAULT_AUTHOR || 'Brian Bureson';

/** Short brand line for og:site_name (LinkedIn Featured gray subtitle). */
const SITE_NAME = process.env.SITE_NAME || 'Brian Bureson';

const HOME_TITLE =
  process.env.SITE_HOME_TITLE ||
  'Brian Bureson · AI product design & trust UX · Denver';

const HOME_DESCRIPTION =
  process.env.SITE_HOME_DESCRIPTION ||
  'Lead Principal UX at Oracle. Denver-based AI product designer for enterprise generative AI, conversational search, assistants, and agent experiences. Case studies and writing on trust UX, answer quality, and launch readiness. 20+ years · FDA-regulated to 100M+ users.';

const HOME_OG_DESCRIPTION =
  process.env.SITE_HOME_OG_DESCRIPTION ||
  'Enterprise AI product design and trust UX. Case studies, essays, and 20+ years shipping regulated, consumer-scale, and enterprise products.';

/** Used by /api/og default image title param. */
const DEFAULT_OG_IMAGE_TITLE =
  process.env.SITE_OG_IMAGE_TITLE || 'Brian Bureson · AI product design & trust UX';

const PERSON_JOB_TITLE =
  process.env.SITE_PERSON_JOB_TITLE || 'Lead Principal UX · AI product design';

const PERSON_DESCRIPTION = HOME_DESCRIPTION;

const ABOUT_DESCRIPTION =
  'About Brian Bureson: Denver-based AI product design leader. Enterprise generative AI, trust UX, 0→1 launches, FDA-regulated medical devices, and consumer products at global scale.';

const WRITING_INDEX_DESCRIPTION =
  'Essays on enterprise AI product design, agent behavior, trust UX, and answer quality before launch.';

const FALLBACK_WRITING_POSTS = [
  {
    slug: 'what-if-the-happy-path-is-a-dead-end',
    title: 'What if the happy path is a dead end...?',
    excerpt:
      'Deploy got easy. Behavior design did not. On permissions, refusals, escalation, and what teams discover in production.',
  },
  {
    slug: 'you-shipped-a-pilot-and-called-it-ga',
    title: 'You shipped a pilot and called it GA',
    excerpt:
      'Three questions before any agent ships: boundaries, uncertainty UX, and what users see when something fails.',
  },
];

function buildDefaultOgImageUrl(baseUrl) {
  const base = String(baseUrl || 'https://www.bureson.com').replace(/\/+$/, '');
  return `${base}/assets/og-default.png`;
}

module.exports = {
  DEFAULT_AUTHOR,
  SITE_NAME,
  HOME_TITLE,
  HOME_DESCRIPTION,
  HOME_OG_DESCRIPTION,
  DEFAULT_OG_IMAGE_TITLE,
  PERSON_JOB_TITLE,
  PERSON_DESCRIPTION,
  ABOUT_DESCRIPTION,
  WRITING_INDEX_DESCRIPTION,
  FALLBACK_WRITING_POSTS,
  buildDefaultOgImageUrl,
};
