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
  
  // Define corrupted patterns more comprehensively
  const isCorruptedTitle = (title: string): boolean => {
    const lowerTitle = title.toLowerCase();
    return title === '' || 
           title === 'fdsa fdsa' || 
           lowerTitle.includes('fdsa') ||
           lowerTitle.includes('test') ||
           lowerTitle.includes('dad') ||
           lowerTitle.includes('eat you') ||
           lowerTitle.includes('snooky') ||
           lowerTitle.includes('chamakaka') ||
           lowerTitle.includes('slippery') ||
           lowerTitle.includes('notes') ||
           lowerTitle.includes('do it') ||
           lowerTitle.includes('help me') ||
           lowerTitle.includes('lead me') ||
           lowerTitle.includes('you tell me') ||
           lowerTitle.includes('your dad') ||
           lowerTitle.includes('i like it') ||
           seenSections.has(title);
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section headers
    const sectionMatch = line.trim().match(/^# (.+)$/);
    const subsectionMatch = line.trim().match(/^## (.+)$/);
    
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      
      // Skip corrupted or duplicate sections
      if (isCorruptedTitle(title)) {
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
      if (isCorruptedTitle(title)) {
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
    'test 13',
    'test 100',
    'test 101',
    'test 109',
    'test 110',
    'test 209',
    'test 210',
    'my dad is super',
    'eat you',
    'snooky',
    'chamakaka',
    'i like it slippery',
    'help me not die',
    'lead me to safety',
    'you tell me',
    'your dad',
    'do it 1',
    'do it 2',
    'make it clean',
    'not sure'
  ];
  
  return corruptedPatterns.some(pattern => 
    content.toLowerCase().includes(pattern.toLowerCase())
  );
}
