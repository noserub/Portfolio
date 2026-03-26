/**
 * Single integration point for `profiles.hero_text` (home CMS).
 * Load → React state → debounced save to Supabase; localStorage mirrors server after successful read/write.
 * See `useProfiles` / About for the same pattern on other profile columns.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  createDefaultHomePageContent,
  FLUSH_HOME_PAGE_CMS_EVENT,
  mergeHeroGreetingsFromDraftLines,
  migrateLegacyWelcomeGreeting,
  parseStoredHomeContent,
  persistHomePageToLocalStorageSync,
  readHomePageContentFromLocalStorage,
  resolveHomeContentAfterLoad,
  shouldPersistHomePageContent,
  toPersistedPayload,
  type HomePageContentV2,
} from "../lib/homePageContent";
import { getPortfolioOwnerUserId } from "../lib/portfolioOwner";

export interface UseHomePageContentOptions {
  /** Call when server-applied content should reset bio editor (TipTap). */
  bumpBioEditorRevision: () => void;
  isEditingHeroRef: MutableRefObject<boolean>;
  greetingsTextValueRef: MutableRefObject<string>;
  setIsEditingHero: Dispatch<SetStateAction<boolean>>;
  isEditingHero: boolean;
  greetingsTextValue: string;
}

export function useHomePageContent(options: UseHomePageContentOptions) {
  const {
    bumpBioEditorRevision,
    isEditingHeroRef,
    greetingsTextValueRef,
    setIsEditingHero,
    isEditingHero,
    greetingsTextValue,
  } = options;

  const bumpBioEditorRevisionRef = useRef(bumpBioEditorRevision);
  bumpBioEditorRevisionRef.current = bumpBioEditorRevision;
  const bumpBio = useCallback(() => {
    bumpBioEditorRevisionRef.current();
  }, []);

  const [homePageContent, setHomePageContent] = useState<HomePageContentV2>(() =>
    createDefaultHomePageContent(),
  );
  const [showHeroCloudNotice, setShowHeroCloudNotice] = useState(false);
  const [heroDraftAheadOfCloud, setHeroDraftAheadOfCloud] = useState(false);
  /** True until the first `profiles.hero_text` load finishes (success or fallback). Drives hero skeleton UI. */
  const [homeContentLoading, setHomeContentLoading] = useState(true);

  const homeContentHydratedRef = useRef(false);
  const heroLoadGenerationRef = useRef(0);
  const homePageContentRef = useRef<HomePageContentV2>(homePageContent);
  homePageContentRef.current = homePageContent;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadHomePageContent = async () => {
      const gen = ++heroLoadGenerationRef.current;
      homeContentHydratedRef.current = false;
      setHomeContentLoading(true);

      const { supabase } = await import("../lib/supabaseClient");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const portfolioOwnerId = getPortfolioOwnerUserId(user?.id);
      const allowLocalDraftPreference =
        Boolean(user?.id) && user.id === portfolioOwnerId;

      try {
        console.log("🔄 Loading home page content from Supabase...");
        const row = await (async () => {
          if (user?.id && user.id !== portfolioOwnerId) {
            console.warn(
              "⚠️ Home hero: signed-in user id ≠ VITE_PUBLIC_PORTFOLIO_OWNER_ID — incognito shows the owner row, not your account row. Set the env to your Supabase user UUID.",
              { authId: user.id, ownerId: portfolioOwnerId },
            );
          }

          console.log(
            "🏠 Home: Loading hero_text from published profile row",
            portfolioOwnerId,
            user ? "(signed in)" : "(public)",
          );

          const result = await supabase
            .from("profiles")
            .select("hero_text, updated_at")
            .eq("id", portfolioOwnerId)
            .maybeSingle();

          if (result.error) throw result.error;
          return result.data as { hero_text: unknown; updated_at: string | null } | null;
        })();

        const raw = row?.hero_text;
        const heroTextMissing =
          raw == null ||
          (typeof raw === "string" && raw.trim() === "") ||
          (typeof raw === "object" &&
            raw !== null &&
            !Array.isArray(raw) &&
            Object.keys(raw as object).length === 0);
        if (heroTextMissing) {
          console.warn(
            "[home] profiles.hero_text is empty for this row — UI uses defaults until you save from the editor.",
            { portfolioOwnerId },
          );
        }
        const ts = row?.updated_at != null ? Date.parse(String(row.updated_at)) : NaN;
        const remoteProfileUpdatedAtMs = !Number.isNaN(ts) ? ts : null;

        if (row == null) {
          console.warn(
            "[home] No profiles row for this id — visitors see defaults. Create a profile for this UUID or fix VITE_PUBLIC_PORTFOLIO_OWNER_ID.",
            { portfolioOwnerId },
          );
          const { content, localDraftSupersededByCloud, draftAheadOfPublished } =
            resolveHomeContentAfterLoad(undefined, {
              remoteProfileUpdatedAtMs,
              allowLocalDraftPreference,
            });
          if (gen !== heroLoadGenerationRef.current) return;
          setHeroDraftAheadOfCloud(draftAheadOfPublished);
          if (localDraftSupersededByCloud) setShowHeroCloudNotice(true);

          const migratedContent = migrateLegacyWelcomeGreeting(content);
          if (gen !== heroLoadGenerationRef.current) return;
          homeContentHydratedRef.current = true;
          setHomePageContent(migratedContent);
          setHomeContentLoading(false);
          bumpBio();
          localStorage.setItem("heroText", JSON.stringify(toPersistedPayload(migratedContent)));
          console.log("✅ Home page: no profile row — merged from local/offline defaults");
          return;
        }

        const parsedFromDb = parseStoredHomeContent(raw ?? {});
        let migratedContent = migrateLegacyWelcomeGreeting(parsedFromDb);
        if (JSON.stringify(parsedFromDb.hero) !== JSON.stringify(migratedContent.hero)) {
          console.log(
            '🔄 Migrated legacy "Welcome," greeting in place (stats, bio, and UI labels unchanged)',
          );
        }

        const serverClock = remoteProfileUpdatedAtMs ?? Date.now();
        migratedContent = {
          ...migratedContent,
          _clientSavedAt: Math.max(
            typeof migratedContent._clientSavedAt === "number" &&
              !Number.isNaN(migratedContent._clientSavedAt)
              ? migratedContent._clientSavedAt
              : 0,
            serverClock,
          ),
        };

        const previousLocal = readHomePageContentFromLocalStorage();
        const fp = (c: HomePageContentV2) => {
          const { _clientSavedAt: _t, ...rest } = c;
          return JSON.stringify(rest);
        };
        const replacedLocalDraft =
          allowLocalDraftPreference &&
          previousLocal &&
          shouldPersistHomePageContent(previousLocal) &&
          fp(previousLocal) !== fp(migratedContent);

        if (gen !== heroLoadGenerationRef.current) return;
        setHeroDraftAheadOfCloud(false);
        if (replacedLocalDraft) {
          setShowHeroCloudNotice(true);
        }

        if (gen !== heroLoadGenerationRef.current) return;
        homeContentHydratedRef.current = true;
        setHomePageContent(migratedContent);
        setHomeContentLoading(false);
        bumpBio();
        localStorage.setItem("heroText", JSON.stringify(toPersistedPayload(migratedContent)));
        console.log("✅ Home page content loaded from Supabase (published row is source of truth)");
      } catch (error) {
        console.error("❌ Error loading home page content from Supabase:", error);
        const { content, draftAheadOfPublished } = resolveHomeContentAfterLoad(undefined, {
          allowLocalDraftPreference,
        });
        if (gen !== heroLoadGenerationRef.current) return;
        setHeroDraftAheadOfCloud(draftAheadOfPublished);
        const migratedContent = migrateLegacyWelcomeGreeting(content);

        if (gen !== heroLoadGenerationRef.current) return;
        homeContentHydratedRef.current = true;
        setHomePageContent(migratedContent);
        setHomeContentLoading(false);
        bumpBio();
        localStorage.setItem("heroText", JSON.stringify(toPersistedPayload(migratedContent)));
        console.log("✅ Loaded home page content from offline / local merge");
      }
    };

    const authSubscriptionRef = { current: null as null | (() => void) };
    (async () => {
      const { supabase } = await import("../lib/supabaseClient");
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
        if (event === "SIGNED_OUT") {
          setIsEditingHero(false);
        }
        void loadHomePageContent();
      });
      authSubscriptionRef.current = () => subscription.unsubscribe();
      await loadHomePageContent();
    })();

    return () => {
      authSubscriptionRef.current?.();
      authSubscriptionRef.current = null;
    };
  }, [bumpBio, setIsEditingHero]);

  const persistHomePageNow = useCallback(async (content: HomePageContentV2) => {
    if (!shouldPersistHomePageContent(content)) {
      return;
    }
    const payload = toPersistedPayload({ ...content, _clientSavedAt: Date.now() });
    localStorage.setItem("heroText", JSON.stringify(payload));

    const applyRowFromServer = (row: { hero_text: unknown; updated_at: string | null }) => {
      const next = migrateLegacyWelcomeGreeting(parseStoredHomeContent(row.hero_text ?? {}));
      localStorage.setItem("heroText", JSON.stringify(toPersistedPayload(next)));
      setShowHeroCloudNotice(false);
      setHeroDraftAheadOfCloud(false);
      if (!isEditingHeroRef.current) {
        setHomePageContent(next);
        bumpBio();
      }
    };

    try {
      const { supabase } = await import("../lib/supabaseClient");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const ownerId = getPortfolioOwnerUserId(user?.id);
        if (user?.id && user.id !== ownerId) {
          console.warn(
            "⚠️ Home hero save skipped: auth user must match VITE_PUBLIC_PORTFOLIO_OWNER_ID to update the published row.",
            { authId: user.id, ownerId },
          );
          toast.error(
            "Home content is published from a fixed profile id. Set VITE_PUBLIC_PORTFOLIO_OWNER_ID to your Supabase user id so saves match what visitors see.",
            { id: "home-hero-owner-mismatch", duration: 8000 },
          );
          return;
        }

        console.log(
          "💾 Home page: localStorage ✓ · syncing profiles.hero_text to Supabase for published row",
          ownerId,
        );

        const { data: updatedRow, error: updateError } = await supabase
          .from("profiles")
          .update({ hero_text: payload })
          .eq("id", ownerId)
          .select("hero_text, updated_at")
          .single();

        if (updateError) {
          console.log("📝 Profile not found, creating new profile...");
          const { data: insertedRow, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: ownerId,
              email: user?.email?.trim() || import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim() || "",
              full_name: "Brian Bureson",
              hero_text: payload,
            })
            .select("hero_text, updated_at")
            .single();

          if (insertError) {
            console.warn("⚠️ Failed to save to Supabase (egress limits?):", insertError.message);
            setHeroDraftAheadOfCloud(true);
            toast.error(
              "Could not sync the hero section to the cloud. Your text is still saved on this device.",
            );
          } else if (insertedRow) {
            console.log("✅ Home page: Supabase hero_text saved (new profile row)");
            applyRowFromServer(insertedRow as { hero_text: unknown; updated_at: string | null });
          }
        } else if (updatedRow) {
          console.log("✅ Home page: Supabase hero_text saved (confirmed from server)");
          applyRowFromServer(updatedRow as { hero_text: unknown; updated_at: string | null });
        }
      } else {
        console.log(
          "💾 Home page: localStorage ✓ · not signed in — cloud sync skipped (edits stay on this browser)",
        );
      }
    } catch (error) {
      console.warn("⚠️ Supabase save failed (egress limits?):", error);
      console.log("💾 Home page: localStorage still has your draft; Supabase sync failed");
      setHeroDraftAheadOfCloud(true);
      try {
        const { supabase } = await import("../lib/supabaseClient");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          toast.error(
            "Could not sync the hero section to the cloud. Your text is still saved on this device.",
          );
        }
      } catch {
        /* ignore */
      }
    }
  }, [bumpBio, isEditingHeroRef]);

  const clearDebouncedHeroSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const flushPendingHomePage = useCallback(() => {
    if (!homeContentHydratedRef.current) return;
    clearDebouncedHeroSave();
    let content = homePageContentRef.current;
    if (isEditingHeroRef.current) {
      content = mergeHeroGreetingsFromDraftLines(content, greetingsTextValueRef.current);
    }
    void persistHomePageNow(content);
  }, [clearDebouncedHeroSave, persistHomePageNow, isEditingHeroRef, greetingsTextValueRef]);

  useEffect(() => {
    if (!homeContentHydratedRef.current) {
      return;
    }
    const mergedForGate = isEditingHero
      ? mergeHeroGreetingsFromDraftLines(homePageContent, greetingsTextValue)
      : homePageContent;
    if (!shouldPersistHomePageContent(mergedForGate)) {
      console.log("⏸️ Skipping save: no persistable home content yet");
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const snapshot = isEditingHeroRef.current
        ? mergeHeroGreetingsFromDraftLines(
            homePageContentRef.current,
            greetingsTextValueRef.current,
          )
        : homePageContentRef.current;
      void persistHomePageNow(snapshot);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [homePageContent, persistHomePageNow, isEditingHero, greetingsTextValue, isEditingHeroRef, greetingsTextValueRef]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        persistHomePageToLocalStorageSync(homePageContentRef.current);
        flushPendingHomePage();
      }
    };
    const onPageHide = () => {
      persistHomePageToLocalStorageSync(homePageContentRef.current);
      flushPendingHomePage();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [flushPendingHomePage]);

  useEffect(() => {
    const onFlushHomeCms = () => {
      persistHomePageToLocalStorageSync(homePageContentRef.current);
      flushPendingHomePage();
    };
    window.addEventListener(FLUSH_HOME_PAGE_CMS_EVENT, onFlushHomeCms);
    return () => window.removeEventListener(FLUSH_HOME_PAGE_CMS_EVENT, onFlushHomeCms);
  }, [flushPendingHomePage]);

  useEffect(() => {
    return () => {
      flushPendingHomePage();
    };
  }, [flushPendingHomePage]);

  return {
    homePageContent,
    setHomePageContent,
    homeContentHydratedRef,
    homeContentLoading,
    showHeroCloudNotice,
    setShowHeroCloudNotice,
    heroDraftAheadOfCloud,
    persistHomePageNow,
    flushPendingHomePage,
    clearDebouncedHeroSave,
  };
}
