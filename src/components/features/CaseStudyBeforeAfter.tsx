import type { ReactNode } from 'react';

export interface CaseStudyBeforeAfterProps {
  question?: string;
  before: { label: string; content: ReactNode; takeaway?: string };
  after: { label: string; content: ReactNode; takeaway?: string };
}

/** A reusable comparison for case studies. Supply content and place it where needed. */
export function CaseStudyBeforeAfter({ question, before, after }: CaseStudyBeforeAfterProps) {
  const cards = [
    { ...before, state: 'Before', isAfter: false },
    { ...after, state: 'After', isAfter: true },
  ];

  return (
    <section aria-label="Before and after comparison" className="my-8">
      {question && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--modern-accent, #84bd00)' }}>Employee asks</p>
          <p className="text-lg font-semibold leading-relaxed" style={{ color: 'var(--modern-text, #fafafa)' }}>“{question}”</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {cards.map(({ state, isAfter, label, content, takeaway }) => {
          // Labels authored in the CMS often already include “Before ·” or “After ·”.
          const detail = label.replace(/^(?:before|after)\s*(?:[·:\-–—]\s*)?/i, '').trim();
          return (
            <article
              key={state}
              aria-label={`${state}${detail ? `: ${detail}` : ''}`}
              className="flex min-w-0 flex-col border-l-4 px-6 py-7 md:px-8 md:py-8"
              style={{
                background: 'var(--modern-surface, #141414)',
                borderColor: isAfter ? 'var(--modern-accent, #84bd00)' : 'transparent',
              }}
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: isAfter ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>
                {state}{detail && ` · ${detail}`}
              </p>
              <div className="min-w-0 flex-1 text-base leading-relaxed" style={{ color: isAfter ? 'var(--modern-text, #fafafa)' : 'var(--modern-muted-text, #a3a3a3)' }}>{content}</div>
              {takeaway && <p className="mt-7 text-sm font-medium leading-relaxed" style={{ color: isAfter ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>{takeaway}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
