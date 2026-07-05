import type { ReactNode } from 'react';

interface WritingPostMetaProps {
  author?: string;
  date?: string;
  readingMinutes?: number;
  topics?: string[];
}

export function WritingPostMeta({
  author,
  date,
  readingMinutes,
  topics = [],
}: WritingPostMetaProps) {
  const items: ReactNode[] = [];

  if (author) items.push(<span key="author">{author}</span>);
  if (date) items.push(<span key="date">{date}</span>);
  if (readingMinutes != null && readingMinutes > 0) {
    items.push(<span key="read">{readingMinutes} min read</span>);
  }

  return (
    <div className="modern-writing-meta">
      {items.map((item, index) => (
        <span key={index} className="modern-writing-meta__item">
          {index > 0 ? <span className="modern-writing-meta__dot" aria-hidden /> : null}
          {item}
        </span>
      ))}
      {topics.length > 0 ? (
        <div className="modern-writing-topics">
          {topics.map((topic) => (
            <span key={topic} className="modern-writing-topic">
              {topic}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
