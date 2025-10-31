interface MarkdownRendererProps {
  content: string;
  variant?: 'default' | 'compact';
}

export function MarkdownRenderer({ content, variant = 'default' }: MarkdownRendererProps) {
  // Add custom CSS for spacing and gradient bullets
  const customStyles = `
    /* Beautiful accessible link colors matching the color scheme */
    .markdown-content a,
    .markdown-content a.markdown-link {
      color: #ca8a04; /* yellow-600 for light mode */
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    
    .markdown-content a:hover,
    .markdown-content a.markdown-link:hover {
      color: #a16207; /* yellow-700 for hover */
      text-decoration: none;
    }
    
    .dark .markdown-content a,
    .dark .markdown-content a.markdown-link {
      color: #60a5fa; /* blue-400 for dark mode */
      text-decoration: none;
    }
    
    .dark .markdown-content a:hover,
    .dark .markdown-content a.markdown-link:hover {
      color: #93c5fd; /* blue-300 for hover in dark mode */
      text-decoration: none;
    }
    
    .markdown-content p + h1,
    .markdown-content ul + h1,
    .markdown-content p + h2,
    .markdown-content ul + h2 {
      margin-top: 6rem !important;
    }
    
    .markdown-content p + h3,
    .markdown-content ul + h3 {
      margin-top: 4rem !important;
    }
    
    .markdown-content p + h4,
    .markdown-content ul + h4 {
      margin-top: 3.5rem !important;
    }
    
    .markdown-content p + h5,
    .markdown-content ul + h5 {
      margin-top: 3rem !important;
    }
    
    .markdown-content p + h6,
    .markdown-content ul + h6 {
      margin-top: 2.5rem !important;
    }
    
    .markdown-content p {
      margin-bottom: 1rem !important;
    }
    
    .markdown-content p:last-child {
      margin-bottom: 0 !important;
    }
    
    .markdown-content br {
      display: block !important;
      content: "" !important;
      margin-bottom: 0rem !important;
    }
    
    .markdown-content ul {
      margin-top: 3rem !important;
      margin-bottom: 3rem !important;
      list-style: none !important;
      padding-left: 0 !important;
    }
    
    .markdown-content ul:last-child {
      margin-bottom: 0 !important;
    }
    
    /* Reduce spacing between headings and bullets */
    .markdown-content h2 + ul,
    .markdown-content h3 + ul,
    .markdown-content h4 + ul,
    .markdown-content h5 + ul,
    .markdown-content h6 + ul {
      margin-top: 1rem !important;
    }
    
    .markdown-content ul li {
      position: relative !important;
      padding-left: 2rem !important;
      margin-bottom: 1rem !important;
      display: flex !important;
      align-items: start !important;
      gap: 0.625rem !important;
    }
    
    .markdown-content ul li::before {
      content: "" !important;
      flex-shrink: 0 !important;
      width: 0.375rem !important;
      height: 0.375rem !important;
      border-radius: 9999px !important;
      margin-top: 0.5rem !important;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899) !important;
      position: absolute !important;
      left: 0.25rem !important;
    }
    
    .markdown-content ul li::marker {
      content: none !important;
      display: none !important;
    }
  `;

  // Parse markdown to HTML
  const parseMarkdown = (text: string): string => {
    let html = text || '';

    // Headers - Process in reverse order (6 to 1) to avoid conflicts
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Unordered lists - MUST come before italic parsing to avoid conflicts with asterisks
    const listItemStyle = variant === 'compact' 
      ? ' style="position: relative; padding-left: 1.5em; margin-bottom: 0.875rem; line-height: 1.7; font-size: 0.875rem; list-style: none;"'
      : '';
    html = html.replace(/^• (.+)$/gm, `<li${listItemStyle}>$1</li>`);
    html = html.replace(/^- (.+)$/gm, `<li${listItemStyle}>$1</li>`);
    html = html.replace(/^\* (.+)$/gm, `<li${listItemStyle}>$1</li>`);

    // Links - must come before bold/italic to avoid conflicts
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr />');

    // Wrap consecutive <li> in <ul>
    const ulStyle = variant === 'compact'
      ? ' style="list-style: none; padding: 0; margin: 0;"'
      : '';
    html = html.replace(/(<li.*?<\/li>\n?)+/gs, (match) => {
      return `<ul${ulStyle}>${match}</ul>`;
    });

    // Process line breaks - single line breaks become <br>, double become paragraph breaks
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let currentParagraph: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] || '').trim();
      
      // Empty line separates paragraphs
      if (line === '') {
        if (currentParagraph.length > 0) {
          processedLines.push('<p>' + currentParagraph.join('<br>\n') + '</p>');
          currentParagraph = [];
        }
        continue;
      }
      
      // Don't wrap headers, lists, or hr in paragraphs
      if (
        line.startsWith('<h1') ||
        line.startsWith('<h2') ||
        line.startsWith('<h3') ||
        line.startsWith('<h4') ||
        line.startsWith('<h5') ||
        line.startsWith('<h6') ||
        line.startsWith('</h') ||
        line.startsWith('<ul') ||
        line.startsWith('</ul') ||
        line.startsWith('<li') ||
        line.startsWith('<hr')
      ) {
        // Flush current paragraph first
        if (currentParagraph.length > 0) {
          processedLines.push('<p>' + currentParagraph.join('<br>\n') + '</p>');
          currentParagraph = [];
        }
        processedLines.push(line);
      } else {
        // Add to current paragraph
        currentParagraph.push(line);
      }
    }
    
    // Flush remaining paragraph
    if (currentParagraph.length > 0) {
      processedLines.push('<p>' + currentParagraph.join('<br>\n') + '</p>');
    }

    html = processedLines.join('\n');

    return html;
  };

  const htmlContent = parseMarkdown(content);

  const compactStyles = variant === 'compact' ? `
    /* Link colors for compact variant */
    .markdown-content-compact a,
    .markdown-content-compact a.markdown-link {
      color: #ca8a04; /* yellow-600 for light mode */
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    
    .markdown-content-compact a:hover,
    .markdown-content-compact a.markdown-link:hover {
      color: #a16207; /* yellow-700 for hover */
      text-decoration: none;
    }
    
    .dark .markdown-content-compact a,
    .dark .markdown-content-compact a.markdown-link {
      color: #60a5fa; /* blue-400 for dark mode */
      text-decoration: none;
    }
    
    .dark .markdown-content-compact a:hover,
    .dark .markdown-content-compact a.markdown-link:hover {
      color: #93c5fd; /* blue-300 for hover in dark mode */
      text-decoration: none;
    }
    
    .markdown-content-compact ul li::before {
      content: "•";
      position: absolute;
      left: 0.25em;
      top: 0;
      color: inherit;
    }
    .markdown-content-compact ul li:last-child {
      margin-bottom: 0 !important;
    }
  ` : '';

  if (variant === 'compact') {
    return (
      <>
        <style>{compactStyles}</style>
        <div 
          className="markdown-content-compact text-sm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div 
        className="markdown-content prose prose-lg max-w-none
          prose-headings:font-['Montserrat',sans-serif]
          prose-h1:text-5xl prose-h1:font-bold prose-h1:mb-10 first:prose-h1:mt-0 prose-h1:leading-tight
          prose-h2:text-3xl prose-h2:font-bold prose-h2:mb-8 first:prose-h2:mt-0 prose-h2:leading-snug
          prose-h3:text-2xl prose-h3:font-semibold prose-h3:mb-6 first:prose-h3:mt-0 prose-h3:leading-snug
          prose-h4:text-xl prose-h4:font-semibold prose-h4:mb-5 first:prose-h4:mt-0
          prose-h5:text-lg prose-h5:font-semibold prose-h5:mb-4 first:prose-h5:mt-0
          prose-h6:text-base prose-h6:font-semibold prose-h6:mb-3 first:prose-h6:mt-0
          prose-p:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground
          prose-ul:space-y-3 prose-ul:pl-6
          prose-li:text-lg prose-li:leading-relaxed prose-li:text-muted-foreground prose-li:marker:text-primary
          prose-strong:text-foreground prose-strong:font-semibold
          prose-hr:my-24 prose-hr:border-border/50
          dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}

export default MarkdownRenderer;