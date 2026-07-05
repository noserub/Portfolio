import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  ModernEditorDialog,
  ModernEditorField,
  modernEditorInputStyle,
} from '../modern/ModernEditorDialog';
import {
  DEFAULT_WRITING_INDEX_CONTENT,
  fetchWritingIndexContent,
  saveWritingIndexContent,
  type WritingIndexContent,
} from '../../lib/writingIndexContent';

interface ModernWritingIndexEditorPanelProps {
  open: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export function ModernWritingIndexEditorPanel({
  open,
  onCancel,
  onSaved,
}: ModernWritingIndexEditorPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<WritingIndexContent>(DEFAULT_WRITING_INDEX_CONTENT);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await fetchWritingIndexContent();
    setDraft(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleDone = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await saveWritingIndexContent(draft);
    setSaving(false);
    if (ok) {
      toast.success('Writing page updated.');
      onSaved();
    } else {
      toast.error('Could not save writing page copy. Try again while signed in.');
    }
  };

  return (
    <ModernEditorDialog
      open={open}
      title="Edit writing page"
      onCancel={onCancel}
      onDone={() => void handleDone()}
      saving={saving}
    >
      {loading ? (
        <div className="h-24 rounded-lg animate-pulse" style={{ background: modernEditorInputStyle.background }} />
      ) : (
        <>
          <ModernEditorField label="Eyebrow" hint="Small label above the headline.">
            <Input
              value={draft.eyebrow}
              onChange={(e) => setDraft((prev) => ({ ...prev, eyebrow: e.target.value }))}
              placeholder="Writing"
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <ModernEditorField label="Headline">
            <Input
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Essays & notes"
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
          <ModernEditorField label="Lead paragraph">
            <Textarea
              value={draft.lead}
              onChange={(e) => setDraft((prev) => ({ ...prev, lead: e.target.value }))}
              rows={4}
              placeholder="Short intro for the writing index…"
              className="bg-transparent"
              style={modernEditorInputStyle}
            />
          </ModernEditorField>
        </>
      )}
    </ModernEditorDialog>
  );
}
