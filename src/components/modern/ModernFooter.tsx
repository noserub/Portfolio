import { getPublicContactEmail } from "../../lib/publicContactEmail";
import { useAppSettings } from "../../hooks/useAppSettings";
import { modernLayout } from "../../design/modernLayout";
import { modern, modernFont } from "../../design/modernTokens";
import { ModernBrandLogo } from "./ModernBrandLogo";

interface ModernFooterProps {
  ownerName?: string;
  logoUrl?: string | null;
}

export function ModernFooter({ ownerName = "Brian Bureson", logoUrl: logoUrlProp }: ModernFooterProps) {
  const { settings } = useAppSettings();
  const year = new Date().getFullYear();
  const email = getPublicContactEmail();
  const logoUrl = logoUrlProp ?? settings?.logo_url;

  return (
    <footer className={`${modernLayout.sectionX} ${modernLayout.footerPy}`}>
      <div className={modernLayout.container}>
        <div className="modern-footer-brand">
          <ModernBrandLogo logoUrl={logoUrl} variant="footer" />
        </div>
        <div className="modern-footer-meta">
          <span className="text-xs" style={{ ...modernFont, color: modern.muted }}>
            © {year} {ownerName}
          </span>
          <div className="flex items-center gap-6">
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-xs hover:text-[#FAFAFA] transition-colors"
                style={{ ...modernFont, color: modern.muted }}
              >
                {email}
              </a>
            ) : null}
            <a
              href="https://github.com/noserub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-[#FAFAFA] transition-colors"
              style={{ ...modernFont, color: modern.muted }}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
