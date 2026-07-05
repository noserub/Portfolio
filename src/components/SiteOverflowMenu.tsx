import {
  BookOpen,
  Key,
  LogOut,
  Moon,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import type { DesignVariant } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Switch } from "./ui/switch";

export interface SiteOverflowMenuProps {
  variant?: "classic" | "modern";
  isEditMode: boolean;
  isSupabaseAuthenticated: boolean;
  designVariant: DesignVariant;
  pageVisibility: { about: boolean; contact: boolean; writing: boolean };
  systemPrefersDark: boolean;
  themeSource: "system" | "user";
  resolvedTheme: "light" | "dark";
  onEditModeClick: () => void;
  onPageVisibilityChange: (page: "about" | "contact" | "writing") => void;
  onDesignVariantChange: (variant: DesignVariant) => void;
  onThemeLight: () => void;
  onThemeDark: () => void;
  onThemeSystem: () => void;
  onShowPasswordReset: () => void;
  onShowSEOEditor: () => void;
  onShowComponentLibrary: () => void;
  onSignOut: () => void;
}

function blurActiveElement() {
  setTimeout(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, 0);
}

export function SiteOverflowMenu({
  variant = "classic",
  isEditMode,
  isSupabaseAuthenticated,
  designVariant,
  pageVisibility,
  systemPrefersDark,
  themeSource,
  resolvedTheme,
  onEditModeClick,
  onPageVisibilityChange,
  onDesignVariantChange,
  onThemeLight,
  onThemeDark,
  onThemeSystem,
  onShowPasswordReset,
  onShowSEOEditor,
  onShowComponentLibrary,
  onSignOut,
}: SiteOverflowMenuProps) {
  const triggerClass =
    variant === "modern"
      ? `modern-nav-overflow-trigger${isEditMode ? " modern-nav-overflow-trigger--edit" : ""}`
      : `rounded-full shadow-lg backdrop-blur-sm p-2.5 inline-flex items-center justify-center ${
          isEditMode
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        } transition-colors`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClass}
        aria-label="Site menu"
        onMouseUp={(e) => e.currentTarget.blur()}
      >
        <MoreHorizontal className={variant === "modern" ? "w-[18px] h-[18px]" : "w-5 h-5"} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => {
            onEditModeClick();
            blurActiveElement();
          }}
        >
          {isEditMode ? "Preview Mode" : isSupabaseAuthenticated ? "Edit Mode" : "Sign In"}
        </DropdownMenuItem>

        {isSupabaseAuthenticated && isEditMode ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
              Page Visibility
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between"
            >
              <span
                className="flex-1 cursor-pointer"
                onClick={() => onPageVisibilityChange("writing")}
              >
                Writing Page
              </span>
              <Switch
                checked={pageVisibility.writing}
                onCheckedChange={() => onPageVisibilityChange("writing")}
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between"
            >
              <span
                className="flex-1 cursor-pointer"
                onClick={() => onPageVisibilityChange("about")}
              >
                About Page
              </span>
              <Switch
                checked={pageVisibility.about}
                onCheckedChange={() => onPageVisibilityChange("about")}
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between"
            >
              <span
                className="flex-1 cursor-pointer"
                onClick={() => onPageVisibilityChange("contact")}
              >
                Contact Page
              </span>
              <Switch
                checked={pageVisibility.contact}
                onCheckedChange={() => onPageVisibilityChange("contact")}
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              />
            </DropdownMenuItem>
          </>
        ) : null}

        {isSupabaseAuthenticated ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Design</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                onDesignVariantChange("modern");
                blurActiveElement();
              }}
            >
              {designVariant === "modern" ? "✓ " : ""}Modern design
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onDesignVariantChange("classic");
                blurActiveElement();
              }}
            >
              {designVariant === "classic" ? "✓ " : ""}Classic design
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Theme</DropdownMenuLabel>
        {variant === "classic" ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                onThemeLight();
                blurActiveElement();
              }}
            >
              {resolvedTheme === "light" && themeSource === "user" ? "✓ " : ""}
              <Sun className="w-4 h-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onThemeDark();
                blurActiveElement();
              }}
            >
              {resolvedTheme === "dark" && themeSource === "user" ? "✓ " : ""}
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem
          onClick={() => {
            onThemeSystem();
            blurActiveElement();
          }}
        >
          {themeSource === "system" ? "✓ " : ""}
          {systemPrefersDark ? (
            <Moon className="w-4 h-4 mr-2" />
          ) : (
            <Sun className="w-4 h-4 mr-2" />
          )}
          System (auto)
        </DropdownMenuItem>

        {isSupabaseAuthenticated ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    onShowPasswordReset();
                    blurActiveElement();
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Case Study Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onShowSEOEditor();
                    blurActiveElement();
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  SEO Settings
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}

        {isEditMode ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                window.location.reload();
                blurActiveElement();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onShowComponentLibrary();
                blurActiveElement();
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Component Library
            </DropdownMenuItem>
          </>
        ) : null}

        {isSupabaseAuthenticated ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onSignOut();
                blurActiveElement();
              }}
              className="text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
