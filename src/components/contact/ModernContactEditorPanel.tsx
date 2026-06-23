import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  ModernEditorDialog,
  ModernEditorField,
  modernEditorInputStyle,
} from "../modern/ModernEditorDialog";
import {
  DEFAULT_CONTACT_PAGE,
  fetchContactPageData,
  isLinkedInColumnMissingError,
  normalizeLinkedInUrl,
  writeLocalContactDraft,
  type ContactPageData,
} from "../../lib/contactPageContent";
import { useProfiles } from "../../hooks/useProfiles";

interface ModernContactEditorPanelProps {
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export function ModernContactEditorPanel({ open, onCancel, onSaved }: ModernContactEditorPanelProps) {
  const { updateCurrentUserProfile } = useProfiles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ContactPageData>(DEFAULT_CONTACT_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await fetchContactPageData();
    setDraft(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleDone = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const normalized: ContactPageData = {
        ...draft,
        email: draft.email.trim(),
        linkedinUrl: normalizeLinkedInUrl(draft.linkedinUrl),
      };

      writeLocalContactDraft(normalized);

      const profileUpdates: { email?: string; linkedin_url?: string } = {};
      if (normalized.email) profileUpdates.email = normalized.email;
      if (normalized.linkedinUrl) profileUpdates.linkedin_url = normalized.linkedinUrl;

      if (Object.keys(profileUpdates).length > 0) {
        try {
          await updateCurrentUserProfile(profileUpdates);
        } catch (err) {
          if (isLinkedInColumnMissingError(err)) {
            if (profileUpdates.email) {
              await updateCurrentUserProfile({ email: profileUpdates.email });
            }
            toast.warning(
              "Email saved. Run the latest database migration to persist LinkedIn URL for all visitors.",
            );
            window.dispatchEvent(new CustomEvent("portfolio-profile-updated"));
            onSaved();
            return;
          }
          throw err;
        }
      }

      toast.success("Contact page updated.");
      window.dispatchEvent(new CustomEvent("portfolio-profile-updated"));
      onSaved();
    } catch {
      toast.error("Could not save contact page. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModernEditorDialog
      open={open}
      title="Edit contact content"
      onCancel={onCancel}
      onDone={() => void handleDone()}
      saving={saving}
    >
      {loading ? (
        <div className="h-24 rounded-lg animate-pulse" style={{ background: modernEditorInputStyle.background }} />
      ) : (
        <>
          <ModernEditorField label="Page subtitle" hint="Shown below the headline on the contact page.">
            <Textarea
              value={draft.pageSubtitle}
              onChange={(e) => setDraft((d) => ({ ...d, pageSubtitle: e.target.value }))}
              rows={3}
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <ModernEditorField label="Email" hint="Used for the email card and mailto link.">
            <Input
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              type="email"
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <ModernEditorField
            label="LinkedIn URL"
            hint="Full profile URL, e.g. https://www.linkedin.com/in/your-handle"
          >
            <Input
              value={draft.linkedinUrl}
              onChange={(e) => setDraft((d) => ({ ...d, linkedinUrl: e.target.value }))}
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/…"
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <ModernEditorField label="Location">
            <Input
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <p className="text-xs" style={{ color: modernEditorInputStyle.color, opacity: 0.65 }}>
            Email and LinkedIn are saved to your profile so visitors see the same links. Subtitle and location are stored in this browser until synced to the database.
          </p>
        </>
      )}
    </ModernEditorDialog>
  );
}
