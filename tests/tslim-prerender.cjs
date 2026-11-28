const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { selectTslimProject, mergeProjectEntries, htmlForRoute } = require('../scripts/generate-sitemap.cjs');
const redirects = require('../vercel.json').redirects;

const site = 'https://www.bureson.com';
const canonical = '/project/tslim-insulin-pump';
const alias = '/project/tandem-diabetes-care';
const production = { verified: true, snapshotMode: false };
const project = {
  slug: 'tslim-insulin-pump',
  title: 't:slim insulin pump',
  description: '65% fewer use errors, 27% faster training. $& </script>',
  caseStudyContent: '# Overview\nPublished text\n## Design\nDetails\n# Impact\nHidden legacy copy\n# Results\n<script>alert(1)</script>',
  caseStudySidebars: {
    impact: { hidden: true, content: 'Hidden JSON copy' },
    atGlance: { title: 'At a glance', content: 'Lead Interaction Designer' },
  },
  published: true,
  requiresPassword: false,
};
const legacy = { ...project, slug: 'tandem-diabetes-care', title: 'Tandem Diabetes Care' };
const template = readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const publicRow = selectTslimProject([legacy, project], [legacy], production);
const html = htmlForRoute(template, publicRow, site);

assert.equal(publicRow.path, canonical);
assert.equal(publicRow.slug, project.slug);
assert.equal(html.match(/<h1>/g).length, 1);
for (const text of ['<h2>Overview</h2>', '<h3>Design</h3>', 'Lead Interaction Designer', '65% fewer use errors']) {
  assert.ok(html.includes(text));
}
assert.ok(html.includes('$&amp; &lt;/script&gt;'));
assert.doesNotMatch(html, /Hidden (?:legacy|JSON) copy|<script>alert/);
const schemas = [...html.matchAll(/data-prerendered-case-study>(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
assert.deepEqual(schemas.map((schema) => schema['@type']), ['Article', 'BreadcrumbList']);
assert.equal(schemas[0].url, site + canonical);
assert.deepEqual(redirects.find(({ source }) => source === alias), {
  source: alias, destination: canonical, permanent: true,
});
assert.deepEqual(mergeProjectEntries([legacy, project], [legacy], publicRow).map(({ path }) => path), [canonical]);

for (const [rows, options] of [
  [[legacy], production],
  [[{ ...project, requiresPassword: true }], production],
  [[{ ...project, published: false }], production],
  [[], { ...production, verified: false }],
]) {
  assert.equal(selectTslimProject(rows, [legacy], options), null);
  assert.deepEqual(mergeProjectEntries(rows, [legacy], null), []);
}
const unavailable = htmlForRoute(template, { path: canonical, noindex: true }, site);
assert.match(unavailable, /name="robots" content="noindex, follow"/);
assert.doesNotMatch(unavailable, /Published text|data-prerendered-case-study/);
assert.equal(selectTslimProject([], [legacy], { ...production, snapshotMode: true }).path, canonical);
assert.equal(selectTslimProject([], [{ ...project, requiresPassword: true }, legacy], {
  ...production, snapshotMode: true,
}), null);
console.log('t:slim static HTML, canonical URL, and publication checks passed');
