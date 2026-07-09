export const config = {
  runtime: 'edge',
};

const DEFAULT_OG_PATH = '/share/og-default.png';

/** Backwards-compatible redirect: dynamic OG generation is unavailable in this Vite deploy. */
export default function handler(req: Request) {
  const target = new URL(DEFAULT_OG_PATH, req.url);
  return Response.redirect(target.toString(), 302);
}
