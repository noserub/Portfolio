import { supabase } from "./supabaseClient";
import { getPortfolioOwnerUserId, getProfileWriterUserId } from "./portfolioOwner";
import {
  DEFAULT_FONT_THEME_ID,
  parseFontThemeId,
  type FontThemeId,
} from "../design/fontThemes";

export type FontThemeSaveResult =
  | { ok: true }
  | { ok: false; reason: "not_signed_in" | "db_error"; message: string };

export async function loadPublishedFontTheme(): Promise<FontThemeId> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);

    const { data, error } = await supabase
      .from("app_settings")
      .select("font_theme")
      .eq("user_id", ownerId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Could not load font theme:", error.message);
      return DEFAULT_FONT_THEME_ID;
    }

    return parseFontThemeId(data?.font_theme) ?? DEFAULT_FONT_THEME_ID;
  } catch (error) {
    console.warn("Could not load font theme:", error);
    return DEFAULT_FONT_THEME_ID;
  }
}

export async function savePublishedFontTheme(themeId: FontThemeId): Promise<FontThemeSaveResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return { ok: false, reason: "not_signed_in", message: "Sign in to save typography presets." };
    }

    const writerUserId = getProfileWriterUserId(user.id);

    const { data: existing, error: readError } = await supabase
      .from("app_settings")
      .select("id, theme, logo_url, favicon_url, is_authenticated, show_debug_panel")
      .eq("user_id", writerUserId)
      .maybeSingle();

    if (readError && readError.code !== "PGRST116") {
      console.warn("Could not read app_settings for font theme:", readError.message);
      return {
        ok: false,
        reason: "db_error",
        message: readError.message,
      };
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("app_settings")
        .update({
          font_theme: themeId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", writerUserId);

      if (updateError) {
        console.warn("Could not save font theme:", updateError.message);
        return { ok: false, reason: "db_error", message: updateError.message };
      }

      return { ok: true };
    }

    const { error: insertError } = await supabase.from("app_settings").insert({
      user_id: writerUserId,
      font_theme: themeId,
      theme: "dark",
      is_authenticated: false,
      show_debug_panel: false,
    });

    if (insertError) {
      console.warn("Could not create app_settings row for font theme:", insertError.message);
      return { ok: false, reason: "db_error", message: insertError.message };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn("Could not save font theme:", error);
    return { ok: false, reason: "db_error", message };
  }
}
