import { useEffect, useState } from "react";
import {
  createDefaultHomePageContent,
  parseStoredHomeContent,
  resolveHomeContentAfterLoad,
  type HomePageContentV2,
} from "../lib/homePageContent";
import {
  isSupabaseUnavailable,
  preferPublishedSnapshot,
  snapshotHeroText,
} from "../lib/publishedSnapshot";
import { getPortfolioOwnerUserId } from "../lib/portfolioOwner";
import { supabase } from "../lib/supabaseClient";

/** Read-only home CMS for Modern visitor pages (no save / edit integration). */
export function usePublicHomePageContent() {
  const [homePageContent, setHomePageContent] = useState<HomePageContentV2>(() =>
    createDefaultHomePageContent(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (preferPublishedSnapshot()) {
        if (!cancelled) {
          setHomePageContent(parseStoredHomeContent(snapshotHeroText() ?? {}));
          setLoading(false);
        }
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ownerId = getPortfolioOwnerUserId(user?.id);
        const { data: row, error } = await supabase
          .from("profiles")
          .select("hero_text, updated_at")
          .eq("id", ownerId)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        const profileMs = row?.updated_at ? Date.parse(row.updated_at) : 0;
        const { content } = resolveHomeContentAfterLoad(row?.hero_text, {
          // Never prefer localStorage on the public home path. Slimmed local drafts
          // strip inlined logo images and will make the logo strip disappear.
          allowLocalDraftPreference: false,
          remoteProfileUpdatedAtMs: Number.isNaN(profileMs) ? 0 : profileMs,
        });
        setHomePageContent(content);
      } catch (error) {
        if (!cancelled) {
          setHomePageContent(
            isSupabaseUnavailable(error)
              ? parseStoredHomeContent(snapshotHeroText() ?? {})
              : createDefaultHomePageContent(),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { homePageContent, loading };
}
