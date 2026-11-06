import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getPortfolioOwnerUserId } from "../lib/portfolioOwner";
import {
  DEFAULT_OWNER_DISPLAY_NAME,
  LINKEDIN_PROFILE_URL,
  normalizeOwnerDisplayName,
} from "../lib/portfolioLinks";
import { normalizeLinkedInUrl, isLinkedInColumnMissingError } from "../lib/contactPageContent";
import {
  isSupabaseUnavailable,
  preferPublishedSnapshot,
  publishedSnapshot,
} from "../lib/publishedSnapshot";

export interface PortfolioProfileNav {
  fullName: string;
  resumeUrl: string | null;
  linkedinUrl: string;
}

const NAV_CACHE_KEY = "portfolioProfileNav";

function readCachedNav(): PortfolioProfileNav | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortfolioProfileNav;
    if (!parsed || typeof parsed.fullName !== "string") return null;
    return {
      fullName: normalizeOwnerDisplayName(parsed.fullName),
      resumeUrl: typeof parsed.resumeUrl === "string" ? parsed.resumeUrl : null,
      linkedinUrl:
        typeof parsed.linkedinUrl === "string" && parsed.linkedinUrl.trim()
          ? parsed.linkedinUrl
          : LINKEDIN_PROFILE_URL,
    };
  } catch {
    return null;
  }
}

function navFromSnapshot(): PortfolioProfileNav {
  const resume =
    typeof publishedSnapshot.profile.resume_url === "string"
      ? publishedSnapshot.profile.resume_url
      : null;
  const name =
    typeof publishedSnapshot.profile.full_name === "string"
      ? publishedSnapshot.profile.full_name
      : null;
  return {
    fullName: normalizeOwnerDisplayName(name),
    resumeUrl: resume,
    linkedinUrl: LINKEDIN_PROFILE_URL,
  };
}

function writeCachedNav(profile: PortfolioProfileNav) {
  try {
    sessionStorage.setItem(NAV_CACHE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function usePortfolioProfileNav(): PortfolioProfileNav {
  const [profile, setProfile] = useState<PortfolioProfileNav>(
    () =>
      readCachedNav() ?? {
        fullName: DEFAULT_OWNER_DISPLAY_NAME,
        resumeUrl: null,
        linkedinUrl: LINKEDIN_PROFILE_URL,
      },
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (preferPublishedSnapshot()) {
        if (!cancelled) setProfile(navFromSnapshot());
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ownerId = getPortfolioOwnerUserId(user?.id);

        const withLinkedIn = await supabase
          .from("profiles")
          .select("full_name, resume_url, linkedin_url")
          .eq("id", ownerId)
          .maybeSingle();

        let data = withLinkedIn.data;
        if (withLinkedIn.error) {
          if (isSupabaseUnavailable(withLinkedIn.error)) {
            if (!cancelled) setProfile(navFromSnapshot());
            return;
          }
          if (!isLinkedInColumnMissingError(withLinkedIn.error)) {
            const fallback = await supabase
              .from("profiles")
              .select("full_name, resume_url")
              .eq("id", ownerId)
              .maybeSingle();
            if (!fallback.error) {
              data = fallback.data;
            } else {
              return;
            }
          } else {
            const fallback = await supabase
              .from("profiles")
              .select("full_name, resume_url")
              .eq("id", ownerId)
              .maybeSingle();
            if (fallback.error) return;
            data = fallback.data;
          }
        }

        if (cancelled || !data) return;

        const linkedinRaw =
          typeof data.linkedin_url === "string" ? data.linkedin_url.trim() : "";
        const next = {
          fullName: normalizeOwnerDisplayName(data.full_name as string),
          resumeUrl: (data.resume_url as string) || null,
          linkedinUrl: linkedinRaw ? normalizeLinkedInUrl(linkedinRaw) : LINKEDIN_PROFILE_URL,
        };
        writeCachedNav(next);
        setProfile(next);
      } catch (error) {
        if (!cancelled && isSupabaseUnavailable(error)) setProfile(navFromSnapshot());
      }
    }

    void load();

    const onProfileUpdated = () => {
      void load();
    };
    window.addEventListener("portfolio-profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("portfolio-profile-updated", onProfileUpdated);
    };
  }, []);

  return profile;
}
