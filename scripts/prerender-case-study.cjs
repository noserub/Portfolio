const MarkdownIt = require('markdown-it');

const markdown = new MarkdownIt({ html: false });
const sidebars = {
  atGlance: { title: 'At a glance', legacyTitles: ['at a glance', 'sidebar 1', 'tools', 'tech stack'], hide: 'hideAtAGlance' },
  impact: { title: 'Impact', legacyTitles: ['impact', 'sidebar 2'], hide: 'hideImpact' },
};

function renderCaseStudyBody({ caseStudyContent, caseStudySidebars, sectionPositions }) {
  const content = caseStudyContent.replace(/^<!-- case-study-panel:[\w-]+(?: type:[\w-]+)? -->\s*$/gm, '');
  const tokens = markdown.parse(content, {});
  const body = [];
  const legacySidebars = new Map();
  let destination = body;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type === 'heading_open' && token.tag === 'h1' && token.level === 0) {
      const title = tokens[i + 1].content.trim().toLowerCase();
      const key = Object.keys(sidebars).find((name) => sidebars[name].legacyTitles.includes(title));
      destination = body;
      if (key) {
        destination = [];
        if (!legacySidebars.has(key)) legacySidebars.set(key, destination);
        i += 2;
        continue;
      }
    }
    destination.push(token);
  }

  function renderSections(sectionTokens, headingOffset) {
    for (const token of sectionTokens) {
      if (token.type === 'heading_open' || token.type === 'heading_close') {
        token.tag = `h${Math.min(6, Number(token.tag.slice(1)) + headingOffset)}`;
      }
    }
    return markdown.renderer.render(sectionTokens, markdown.options, {});
  }

  const sidebarHtml = Object.entries(sidebars).map(([key, config]) => {
    const sidebar = caseStudySidebars?.[key];
    if (sidebar?.hidden || sectionPositions?.[config.hide]) return '';
    const sidebarTokens = sidebar?.content
      ? markdown.parse(sidebar.content, {})
      : legacySidebars.get(key);
    if (!sidebarTokens?.length) return '';
    const title = markdown.utils.escapeHtml(sidebar?.title || config.title);
    return `<section><h2>${title}</h2>\n${renderSections(sidebarTokens, 2)}</section>\n`;
  }).join('');

  return sidebarHtml + renderSections(body, 1);
}

module.exports = { renderCaseStudyBody };
