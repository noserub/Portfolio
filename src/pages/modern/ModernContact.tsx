import { useEffect, useState } from "react";
import { Mail, MapPin, ArrowUpRight, Send, CheckCircle, FileText } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { ModernFooter } from "../../components/modern/ModernFooter";
import { useContactMessages } from "../../hooks/useContactMessages";
import { usePortfolioProfileNav } from "../../hooks/usePortfolioProfileNav";
import { useSEO } from "../../hooks/useSEO";
import { getPortfolioOwnerUserId } from "../../lib/portfolioOwner";
import { getPublicContactEmail } from "../../lib/publicContactEmail";
import { supabase } from "../../lib/supabaseClient";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont, modernPrimaryButtonStyle } from "../../design/modernTokens";

interface ModernContactProps {
  onBack: () => void;
}

export function ModernContact({ onBack }: ModernContactProps) {
  useSEO("contact");
  const { createMessage } = useContactMessages();
  const { resumeUrl } = usePortfolioProfileNav();

  const [pageSubtitle, setPageSubtitle] = useState(
    "Have a question or want to work together? I'd love to hear from you.",
  );
  const [contactInfo, setContactInfo] = useState({
    email: getPublicContactEmail(),
    location: "Colorado, USA",
  });
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem("contactPageContent");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.pageSubtitle) setPageSubtitle(parsed.pageSubtitle);
          if (parsed.contactInfo?.location) {
            setContactInfo((prev) => ({ ...prev, location: parsed.contactInfo.location }));
          }
        } catch {
          /* ignore */
        }
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = getPortfolioOwnerUserId(user?.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();

        if (profile?.email) {
          setContactInfo((prev) => ({ ...prev, email: profile.email as string }));
        }
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);

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

  return (
    <main className="min-h-screen" style={{ background: modern.bg }}>
      <section className={`relative overflow-hidden ${modernLayout.sectionX} ${modernLayout.heroPt} ${modernLayout.contactHero}`}>
        <div className="absolute inset-0 pointer-events-none modern-hero-glow modern-hero-glow--about" />
        <div className={`relative ${modernLayout.container}`}>
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
            {pageSubtitle}
          </p>
        </div>
      </section>

      <section className={`${modernLayout.sectionX} ${modernLayout.contactBlocks}`}>
        <div className={modernLayout.container}>
          <div className={`${modernLayout.contactInfoGrid} modern-contact-info-grid--three`}>
            <a
              href={`mailto:${contactInfo.email}`}
              className={`group ${modernLayout.contactCard}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Mail size={18} style={{ color: modern.accent }} />
                <ArrowUpRight size={14} className="text-[#666666] modern-icon-accent-hover transition-colors" />
              </div>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                Email
              </div>
              <div className="text-sm break-all" style={{ ...modernFont, color: modern.text }}>
                {contactInfo.email}
              </div>
            </a>

            <div className={modernLayout.contactCard}>
              <div className="flex items-center justify-between mb-4">
                <MapPin size={18} style={{ color: modern.accent }} />
              </div>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                Location
              </div>
              <div className="text-sm" style={{ ...modernFont, color: modern.text }}>
                {contactInfo.location}
              </div>
            </div>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${modernLayout.contactCard}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText size={18} style={{ color: modern.accent }} />
                  <ArrowUpRight size={14} className="text-[#666666] modern-icon-accent-hover transition-colors" />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  Resume
                </div>
                <div className="text-sm leading-snug" style={{ ...modernFont, color: modern.text }}>
                  View full resume on Google Drive
                </div>
              </a>
            ) : (
              <div className={modernLayout.contactCard} aria-hidden="true">
                <div className="flex items-center justify-between mb-4">
                  <FileText size={18} style={{ color: modern.accent }} />
                  <ArrowUpRight size={14} style={{ color: "#666666" }} />
                </div>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ ...modernFont, color: modern.muted }}>
                  Resume
                </div>
                <div className="text-sm leading-snug" style={{ ...modernFont, color: modern.text }}>
                  View full resume on Google Drive
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={`${modernLayout.sectionX} pb-20 sm:pb-24`}>
        <div className={modernLayout.container}>
          <div className="rounded-xl border p-8" style={{ borderColor: modern.border, background: modern.surface }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: modern.text }}>
              Send a message
            </h2>
            {isSubmitted ? (
              <div className="modern-form-success flex items-center gap-3 py-8 px-4 rounded-lg" role="status">
                <CheckCircle className="w-6 h-6 shrink-0 modern-form-success__icon" aria-hidden />
                <p style={modernFont}>Thanks! Your message has been sent.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm mb-2" style={{ color: modern.muted }}>
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="border-[var(--modern-border)]"
                    style={{ background: modern.bg, color: modern.text }}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm mb-2" style={{ color: modern.muted }}>
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="border-[var(--modern-border)]"
                    style={{ background: modern.bg, color: modern.text }}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm mb-2" style={{ color: modern.muted }}>
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="border-[var(--modern-border)]"
                    style={{ background: modern.bg, color: modern.text }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="modern-btn-primary disabled:opacity-60"
                  style={modernPrimaryButtonStyle}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mt-8 text-sm hover:opacity-80"
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
