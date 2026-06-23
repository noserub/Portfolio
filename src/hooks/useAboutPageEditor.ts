import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfiles } from "./useProfiles";
import {
  areAboutHeroColumnsAvailable,
  fetchAboutProfileRow,
  isAboutHeroColumnMissingError,
  mergeDevAboutLocalStorageDraft,
  omitAboutHeroFields,
} from "../lib/aboutPageProfile";
import {
  aboutEditorDraftToProfileUpdate,
  mapProfileToAboutEditorDraft,
  type AboutEditorDraft,
} from "../lib/aboutPageEditorModel";

export function useAboutPageEditor() {
  const { updateCurrentUserProfile } = useProfiles();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<AboutEditorDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchAboutProfileRow();
      const profile = mergeDevAboutLocalStorageDraft(remote);
      setDraft(mapProfileToAboutEditorDraft(profile));
    } catch {
      setDraft(mapProfileToAboutEditorDraft(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((patchFn: (prev: AboutEditorDraft) => AboutEditorDraft) => {
    setDraft((prev) => (prev ? patchFn(prev) : prev));
  }, []);

  const save = useCallback(async () => {
    if (!draft) return false;
    try {
      let payload = aboutEditorDraftToProfileUpdate(draft);
      if (!areAboutHeroColumnsAvailable()) {
        payload = omitAboutHeroFields(payload);
      }
      await updateCurrentUserProfile(payload);
      if (!import.meta.env.PROD) {
        localStorage.setItem(
          "aboutPageProfile",
          JSON.stringify({ ...payload, lastModified: new Date().toISOString() }),
        );
      }
      return true;
    } catch (error) {
      if (isAboutHeroColumnMissingError(error)) {
        try {
          await updateCurrentUserProfile(omitAboutHeroFields(aboutEditorDraftToProfileUpdate(draft)));
          toast.message("Bio saved. Run migration 0038 for hero headline fields.");
          return true;
        } catch (retryErr) {
          console.error(retryErr);
        }
      }
      toast.error("Could not save About page. Try again.");
      return false;
    }
  }, [draft, updateCurrentUserProfile]);

  return { loading, draft, setDraft, patch, save, reload: load };
}
