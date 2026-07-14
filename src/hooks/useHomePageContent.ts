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
  writeHomePageToLocalStorage,
  type HomePageContentV2,
} from "../lib/homePageContent";
import { getPortfolioOwnerUserId, getProfileWriterUserId, hasVitePublicPortfolioOwnerId } from "../lib/portfolioOwner";

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
  /** Reactive mirror of `homeContentHydratedRef` so editor UI re-renders when load completes. */
  const [homeContentReady, setHomeContentReady] = useState(false);

  const homeContentHydratedRef = useRef(false);
  const heroLoadGenerationRef = useRef(0);
  const homePageContentRef = useRef<HomePageContentV2>(homePageContent);
  homePageContentRef.current = homePageContent;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeContentFingerprint = useCallback((content: HomePageContentV2): string => {
    const { _clientSavedAt: _ignored, ...rest } = content;
    return JSON.stringify(rest);
  }, []);

  useEffect(() => {
    const loadHomePageContent = async () => {
      const gen = ++heroLoadGenerationRef.current;
      homeContentHydratedRef.current = false;
      setHomeContentReady(false);
      setHomeContentLoading(true);

      const { supabase } = await import("../lib/supabaseClient");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const portfolioOwnerId = getPortfolioOwnerUserId(user?.id);
      const allowLocalDraftPreference =
        Boolean(user?.id) && user.id === portfolioOwnerId;

      const finishLoad = (migratedContent: HomePageContentV2) => {
        if (gen !== heroLoadGenerationRef.current) return;
        homeContentHydratedRef.current = true;
        setHomeContentReady(true);
        setHomePageContent(migratedContent);
        setHomeContentLoading(false);
        bumpBio();
        writeHomePageToLocalStorage(migratedContent);
      };

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

          finishLoad(migrateLegacyWelcomeGreeting(content));
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

        finishLoad(migratedContent);
        console.log("✅ Home page content loaded from Supabase (published row is source of truth)");
      } catch (error) {
        console.error("❌ Error loading home page content from Supabase:", error);
        const { content, draftAheadOfPublished } = resolveHomeContentAfterLoad(undefined, {
          allowLocalDraftPreference,
        });
        if (gen !== heroLoadGenerationRef.current) return;
        setHeroDraftAheadOfCloud(draftAheadOfPublished);
        finishLoad(migrateLegacyWelcomeGreeting(content));
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

  const persistHomePageNow = useCallback(async (content: HomePageContentV2): Promise<boolean> => {
    if (!shouldPersistHomePageContent(content)) {
      toast.error("Nothing to save yet. Add headline or intro copy first.");
      return false;
    }
    const payload = toPersistedPayload({ ...content, _clientSavedAt: Date.now() });
    const localWrite = writeHomePageToLocalStorage(payload);
    if (!localWrite.ok) {
      toast.error(
        "Browser storage is full, so a local draft backup could not be saved. Still trying to publish to the cloud.",
        { id: "hero-local-quota", duration: 8000 },
      );
    } else if (localWrite.slimmed) {
      toast.message(
        "Local draft saved without inlined logo images (browser storage was nearly full). Cloud publish still includes full logos.",
        { id: "hero-local-slimmed", duration: 6000 },
      );
    }

    const applyRowFromServer = (row: { hero_text: unknown; updated_at: string | null }) => {
      const next = migrateLegacyWelcomeGreeting(parseStoredHomeContent(row.hero_text ?? {}));
      writeHomePageToLocalStorage(next);
      setShowHeroCloudNotice(false);
      setHeroDraftAheadOfCloud(false);
      if (!isEditingHeroRef.current) {
        // Prevent save loops: Supabase echoes can differ only by metadata/timestamp.
        // Only update React state if meaningful home content actually changed.
        const currentFp = homeContentFingerprint(homePageContentRef.current);
        const nextFp = homeContentFingerprint(next);
        if (currentFp !== nextFp) {
          setHomePageContent(next);
          bumpBio();
        }
      }
    };

    try {
      const { supabase } = await import("../lib/supabaseClient");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const writerId = getProfileWriterUserId(user.id);
        const publishedOwnerId = getPortfolioOwnerUserId(user.id);
        if (hasVitePublicPortfolioOwnerId() && writerId !== publishedOwnerId) {
          console.warn(
            "⚠️ Home hero save blocked: signed-in user must match VITE_PUBLIC_PORTFOLIO_OWNER_ID so visitors read the same row you edit.",
            { authId: writerId, publishedOwnerId },
          );
          toast.error(
            "Home content saves to your signed-in profile, but visitors read VITE_PUBLIC_PORTFOLIO_OWNER_ID. Sign in as the portfolio owner or fix that env var.",
            { id: "home-hero-owner-mismatch", duration: 10000 },
          );
          setHeroDraftAheadOfCloud(true);
          return false;
        }

        console.log(
          localWrite.ok
            ? "💾 Home page: localStorage ✓ · syncing profiles.hero_text to Supabase for published row"
            : "💾 Home page: localStorage full · still syncing profiles.hero_text to Supabase for published row",
          writerId,
        );

        const { data: updatedRow, error: updateError } = await supabase
          .from("profiles")
          .update({ hero_text: payload })
          .eq("id", writerId)
          .select("hero_text, updated_at")
          .maybeSingle();

        if (updateError) {
          const isNoRow =
            updateError.code === "PGRST116" ||
            /0 rows|no rows returned/i.test(updateError.message ?? "");
          if (!isNoRow) {
            console.warn("⚠️ Failed to save home content to Supabase:", updateError.message);
            setHeroDraftAheadOfCloud(true);
            toast.error(
              updateError.message?.trim() ||
                (localWrite.ok
                  ? "Could not sync home content to the cloud. Your changes are saved on this device."
                  : "Could not sync home content to the cloud, and browser storage is too full for a local backup."),
            );
            return false;
          }
        }

        if (updatedRow) {
          console.log("✅ Home page: Supabase hero_text saved (confirmed from server)");
          applyRowFromServer(updatedRow as { hero_text: unknown; updated_at: string | null });
          return true;
        }

        console.log("📝 Profile not found, creating new profile row for home content...");
        const { data: insertedRow, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: writerId,
            email: user?.email?.trim() || import.meta.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim() || "",
            full_name: "Brian Bureson",
            hero_text: payload,
          })
          .select("hero_text, updated_at")
          .single();

        if (insertError) {
          console.warn("⚠️ Failed to save to Supabase:", insertError.message);
          setHeroDraftAheadOfCloud(true);
          toast.error(
            insertError.message?.trim() ||
              (localWrite.ok
                ? "Could not sync home content to the cloud. Your changes are saved on this device."
                : "Could not sync home content to the cloud, and browser storage is too full for a local backup."),
          );
          return false;
        }
        if (insertedRow) {
          console.log("✅ Home page: Supabase hero_text saved (new profile row)");
          applyRowFromServer(insertedRow as { hero_text: unknown; updated_at: string | null });
          return true;
        }

        setHeroDraftAheadOfCloud(true);
        toast.error("Could not confirm the home content save. Try again.");
        return false;
      }

      console.log(
        "💾 Home page: localStorage ✓ · not signed in — cloud sync skipped (edits stay on this browser)",
      );
      if (!localWrite.ok) {
        toast.error(
          "Could not save on this device (browser storage full) and you are not signed in, so nothing was published. Free storage or sign in and try again.",
          { id: "hero-local-quota-unsigned", duration: 10000 },
        );
        return false;
      }
      toast.message("Saved on this device. Sign in with Supabase to publish for all visitors.");
      return true;
    } catch (error) {
      console.warn("⚠️ Supabase save failed (egress limits?):", error);
      console.log("💾 Home page: localStorage still has your draft; Supabase sync failed");
      setHeroDraftAheadOfCloud(true);
      toast.error(
        localWrite.ok
          ? "Could not sync home content to the cloud. Your changes are saved on this device."
          : "Could not sync home content to the cloud, and browser storage is too full for a local backup.",
      );
      return false;
    }
  }, [bumpBio, isEditingHeroRef, homeContentFingerprint]);

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
    homeContentReady,
    homeContentLoading,
    showHeroCloudNotice,
    setShowHeroCloudNotice,
    heroDraftAheadOfCloud,
    persistHomePageNow,
    flushPendingHomePage,
    clearDebouncedHeroSave,
  };
}
