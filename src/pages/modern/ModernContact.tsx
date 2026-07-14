import { useEffect, useState } from "react";
import { Mail, MapPin, ArrowUpRight, Send, CheckCircle, FileText, Linkedin, Edit2 } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ModernFooter } from "../../components/modern/ModernFooter";
import { ModernResumeLink } from "../../components/modern/ModernResumeLink";
import { ModernContactEditorPanel } from "../../components/contact/ModernContactEditorPanel";
import { useContactMessages } from "../../hooks/useContactMessages";
import { useContactPageData } from "../../hooks/useContactPageData";
import { useSEO } from "../../hooks/useSEO";
import { formatLinkedInDisplay } from "../../lib/contactPageContent";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface ModernContactProps {
  onBack: () => void;
  isEditMode?: boolean;
}

function ContactInfoCard({
  isEditMode,
  onEdit,
  children,
  className,
}: {
  isEditMode: boolean;
  onEdit: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isEditMode) return <>{children}</>;

  return (
    <div
      className={`relative ${className ?? ""}`}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Edit contact info"
    >
      {children}
      <span
        className="absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 rounded-md opacity-70 hover:opacity-100 transition-opacity"
        style={{ background: "rgba(255,255,255,0.08)", color: modern.muted }}
        aria-hidden
      >
        <Edit2 className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}

function ContactInfoSkeleton() {
  return (
    <div
      className={`${modernLayout.contactInfoGrid} modern-contact-info-grid--four`}
      aria-busy="true"
      aria-label="Loading contact info"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`${modernLayout.contactCard} modern-contact-card-skeleton`}
          style={{ background: modern.surfaceInset, minHeight: "7.5rem" }}
        />
      ))}
    </div>
  );
}

export function ModernContact({ onBack, isEditMode = false }: ModernContactProps) {
  useSEO("contact");
  const { createMessage } = useContactMessages();
  const { data: contactPage, hydrated: contactHydrated, reload } = useContactPageData();
  const [contactEditorOpen, setContactEditorOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isEditMode) setContactEditorOpen(false);
  }, [isEditMode]);

  const openContactEditor = () => setContactEditorOpen(true);

  const closeContactEditor = () => {
    setContactEditorOpen(false);
    reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await createMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });
      if (result) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Error sending message: ${message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkedInDisplay = formatLinkedInDisplay(contactPage.linkedinUrl);
  const resumeUrl = contactPage.resumeUrl;

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <ModernContactEditorPanel
        open={isEditMode && contactEditorOpen}
        onCancel={closeContactEditor}
        onSaved={closeContactEditor}
      />

      <section className={`relative overflow-hidden ${modernLayout.sectionX} ${modernLayout.heroPt} ${modernLayout.contactHero}`}>
        <div className="modern-hero-glow modern-hero-glow--about" aria-hidden />
        <div className={`relative ${modernLayout.container}`}>
          {isEditMode ? (
            <div className="mb-6">
              <button
                type="button"
                className="modern-home-hero-editor__btn modern-home-hero-editor__btn--primary"
                style={modernFont}
                onClick={openContactEditor}
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden />
                Edit contact content
              </button>
            </div>
          ) : null}
          <p className="text-xs uppercase tracking-widest mb-4" style={{ ...modernFont, fontWeight: 600, color: modern.accent }}>
            Contact
          </p>
          <h1
            style={{
              ...modernFont,
              fontWeight: 600,
              fontSize: "clamp(28px, 3.5vw, 42px)",
              lineHeight: 1.15,
              color: modern.text,
            }}
          >
            Let&apos;s work together.
          </h1>
          <p className={`${modernLayout.contactSubtitle} leading-relaxed`} style={{ ...modernFont, fontSize: "1rem", color: modern.muted }}>
            {contactPage.pageSubtitle}
          </p>
        </div>
      </section>

      <section className={`${modernLayout.sectionX} ${modernLayout.contactBlocks}`}>
        <div className={modernLayout.container}>
          {!contactHydrated ? (
            <ContactInfoSkeleton />
          ) : (
          <div className={`${modernLayout.contactInfoGrid} modern-contact-info-grid--four`}>
            <ContactInfoCard isEditMode={isEditMode} onEdit={openContactEditor}>
              <a
                href={`mailto:${contactPage.email}`}
                className={`group block ${modernLayout.contactCard}`}
                onClick={isEditMode ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center justify-between mb-4">
                  <Mail size={18} style={{ color: modern.accent }} />
                  <ArrowUpRight size={14} className="text-[#666666] modern-icon-accent-hover transition-colors" />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  Email
                </div>
                <div className="text-sm break-all" style={{ ...modernFont, color: modern.text }}>
                  {contactPage.email}
                </div>
              </a>
            </ContactInfoCard>

            <ContactInfoCard isEditMode={isEditMode} onEdit={openContactEditor}>
              <a
                href={contactPage.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block ${modernLayout.contactCard}`}
                onClick={isEditMode ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center justify-between mb-4">
                  <Linkedin size={18} style={{ color: modern.accent }} />
                  <ArrowUpRight size={14} className="text-[#666666] modern-icon-accent-hover transition-colors" />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  LinkedIn
                </div>
                <div className="text-sm leading-snug break-all" style={{ ...modernFont, color: modern.text }}>
                  {linkedInDisplay}
                </div>
              </a>
            </ContactInfoCard>

            {resumeUrl ? (
              <ModernResumeLink resumeUrl={resumeUrl} className={`group ${modernLayout.contactCard}`}>
                <div className="flex items-center justify-between mb-4">
                  <FileText size={18} style={{ color: modern.accent }} />
                  <ArrowUpRight size={14} className="text-[#666666] modern-icon-accent-hover transition-colors" />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  Resume
                </div>
                <div className="text-sm leading-snug" style={{ ...modernFont, color: modern.text }}>
                  View resume in new tab
                </div>
              </ModernResumeLink>
            ) : null}

            <ContactInfoCard isEditMode={isEditMode} onEdit={openContactEditor}>
              <div className={`${modernLayout.contactCard} modern-contact-card--static`}>
                <div className="flex items-center justify-between mb-4">
                  <MapPin size={18} style={{ color: modern.accent }} />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  Location
                </div>
                <div className="text-sm" style={{ ...modernFont, color: modern.text }}>
                  {contactPage.location}
                </div>
              </div>
            </ContactInfoCard>
          </div>
          )}

          <div className="modern-contact-form-wrap">
            <h2 className="modern-contact-form__title">Send a message</h2>
            {isSubmitted ? (
              <div className="modern-form-success flex items-center gap-3 py-8 px-4 rounded-lg" role="status">
                <CheckCircle className="w-6 h-6 shrink-0 modern-form-success__icon" aria-hidden />
                <p style={modernFont}>Thanks! Your message has been sent.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modern-contact-form" noValidate>
                <div className="modern-contact-field">
                  <label htmlFor="contact-name" className="modern-contact-label">
                    Name
                  </label>
                  <Input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required
                    disabled={isSubmitting}
                    className="modern-contact-input"
                  />
                </div>
                <div className="modern-contact-field">
                  <label htmlFor="contact-email" className="modern-contact-label">
                    Email
                  </label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    disabled={isSubmitting}
                    className="modern-contact-input"
                  />
                </div>
                <div className="modern-contact-field">
                  <label htmlFor="contact-message" className="modern-contact-label">
                    Message
                  </label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about your project or question…"
                    required
                    rows={6}
                    disabled={isSubmitting}
                    className="modern-contact-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="modern-btn-primary modern-contact-form__submit disabled:opacity-60"
                  style={modernPrimaryButtonStyle}
                >
                  <Send className="w-4 h-4" aria-hidden />
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-10 text-sm hover:opacity-80"
            style={{ ...modernFont, color: modern.muted }}
          >
            ← Back to home
          </button>
        </div>
      </section>

      <ModernFooter />
    </main>
  );
}
