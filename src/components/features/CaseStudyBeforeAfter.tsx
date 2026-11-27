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
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border"
              style={{
                background: isAfter ? 'color-mix(in srgb, var(--modern-surface, #141414) 92%, var(--modern-accent, #84bd00) 8%)' : 'var(--modern-surface, #141414)',
                borderColor: isAfter ? 'color-mix(in srgb, var(--modern-accent, #84bd00) 48%, var(--modern-border, #27272a))' : 'var(--modern-border, #27272a)',
              }}
            >
              <div className="flex items-center gap-3 border-b px-6 py-5 md:px-8" style={{ borderColor: 'var(--modern-border, #27272a)' }}>
                <span className="inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide" style={{ background: isAfter ? 'var(--modern-accent-subtle, rgba(132, 189, 0, 0.12))' : 'var(--modern-bg, #0a0a0a)', color: isAfter ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>{state}</span>
                {detail && <span className="min-w-0 text-sm font-semibold" style={{ color: 'var(--modern-text, #fafafa)' }}>{detail}</span>}
              </div>
              <div className="flex flex-1 flex-col px-6 py-6 md:px-8 md:py-8">
                <div className="min-w-0 flex-1 text-base leading-relaxed" style={{ color: 'var(--modern-text, #fafafa)' }}>{content}</div>
                {takeaway && <p className="mt-7 border-t pt-4 text-sm font-medium leading-relaxed" style={{ borderColor: 'var(--modern-border, #27272a)', color: isAfter ? 'var(--modern-accent, #84bd00)' : 'var(--modern-muted-text, #a3a3a3)' }}>{takeaway}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
