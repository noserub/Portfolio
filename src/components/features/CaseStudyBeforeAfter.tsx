import type { ReactNode } from 'react';

export interface CaseStudyBeforeAfterProps {
  question?: string;
  before: { label: string; content: ReactNode; takeaway?: string };
  after: { label: string; content: ReactNode; takeaway?: string };
}

/** A reusable comparison for case studies. Supply content and place it where needed. */
export function CaseStudyBeforeAfter({ question, before, after }: CaseStudyBeforeAfterProps) {
  return (
    <section aria-label="Before and after comparison" className="my-8">
      {question && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--modern-accent, #84bd00)' }}>Employee asks</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--modern-text, #fafafa)' }}>“{question}”</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {[before, after].map((item, index) => (
          <article key={index} className="flex flex-col rounded-xl border p-6 md:p-8" style={{ background: 'var(--modern-surface, #141414)', borderColor: 'var(--modern-border, #27272a)' }}>
            <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: index ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>{item.label}</p>
            <div className="flex-1 text-base leading-relaxed" style={{ color: 'var(--modern-text, #fafafa)' }}>{item.content}</div>
            {item.takeaway && <p className="mt-7 border-t pt-4 text-sm font-medium" style={{ borderColor: 'var(--modern-border, #27272a)', color: index ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>{item.takeaway}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
