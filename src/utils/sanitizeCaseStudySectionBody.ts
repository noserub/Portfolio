/**
 * Keep pasted markdown inside one case-study section.
 * H1s in a section body split the document and the editor then drops the original section.
 */
export function sanitizeCaseStudySectionBody(body: string, sectionTitle: string): string {
  if (!body) return body;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const title = sectionTitle.trim().toLowerCase();
  let start = 0;

  while (start < lines.length && lines[start].trim() === "") {
    start += 1;
  }

  const firstHeader = lines[start]?.trim().match(/^#\s+(.+)$/);
  if (firstHeader && firstHeader[1].trim().toLowerCase() === title) {
    start += 1;
    while (start < lines.length && lines[start].trim() === "") {
      start += 1;
    }
  }

  return lines
    .slice(start)
    .map((line) => {
      if (/^#\s+/.test(line) && !/^#{2,}/.test(line)) {
        return line.replace(/^#\s+/, "## ");
      }
      return line;
    })
    .join("\n");
}
