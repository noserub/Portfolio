import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getPortfolioOwnerUserId } from "../lib/portfolioOwner";
import {
  DEFAULT_OWNER_DISPLAY_NAME,
  normalizeOwnerDisplayName,
} from "../lib/portfolioLinks";

export interface PortfolioProfileNav {
  fullName: string;
  resumeUrl: string | null;
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
    };
  } catch {
    return null;
  }
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
    () => readCachedNav() ?? { fullName: DEFAULT_OWNER_DISPLAY_NAME, resumeUrl: null },
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ownerId = getPortfolioOwnerUserId(user?.id);
        const { data } = await supabase
          .from("profiles")
          .select("full_name, resume_url")
          .eq("id", ownerId)
          .maybeSingle();

        if (cancelled || !data) return;

        const next = {
          fullName: normalizeOwnerDisplayName(data.full_name as string),
          resumeUrl: (data.resume_url as string) || null,
        };
        writeCachedNav(next);
        setProfile(next);
      } catch {
        /* keep defaults */
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
