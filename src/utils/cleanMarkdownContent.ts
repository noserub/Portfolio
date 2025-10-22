/**
 * Utility function to clean up corrupted markdown content
 * Removes duplicate sections and malformed content
 */

export function cleanMarkdownContent(content: string): string {
  if (!content) return content;
  
  const lines = content.split('\n');
  const cleanedLines: string[] = [];
  const seenSections = new Set<string>();
  let inCorruptedSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section headers
    const sectionMatch = line.trim().match(/^# (.+)$/);
    const subsectionMatch = line.trim().match(/^## (.+)$/);
    
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      
      // Skip corrupted or duplicate sections
      if (title === '' || 
          title === 'fdsa fdsa' || 
          title.toLowerCase().includes('fdsa') ||
          (title.toLowerCase().includes('test') && title.toLowerCase().includes('notes')) ||
          seenSections.has(title)) {
        inCorruptedSection = true;
        continue;
      }
      
      // Reset corrupted section flag
      inCorruptedSection = false;
      seenSections.add(title);
      cleanedLines.push(line);
    } else if (subsectionMatch) {
      const title = subsectionMatch[1].trim();
      
      // Skip corrupted subsections
      if (title === '' || 
          title === 'fdsa fdsa' || 
          title.toLowerCase().includes('fdsa') ||
          title.toLowerCase().includes('test')) {
        inCorruptedSection = true;
        continue;
      }
      
      // Reset corrupted section flag
      inCorruptedSection = false;
      cleanedLines.push(line);
    } else if (!inCorruptedSection) {
      // Only add content if we're not in a corrupted section
      cleanedLines.push(line);
    }
  }
  
  return cleanedLines.join('\n').trim();
}

/**
 * Check if content appears to be corrupted
 */
export function isContentCorrupted(content: string): boolean {
  if (!content) return false;
  
  const corruptedPatterns = [
    'fdsa fdsa',
    'fdsa fds',
    'test 1',
    'test 2',
    'test 3',
    'test 4',
    'test 10',
    'test 11',
    'test 12',
    'test 13'
  ];
  
  return corruptedPatterns.some(pattern => 
    content.toLowerCase().includes(pattern.toLowerCase())
  );
}
