import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  RESUME_DOWNLOAD_FILENAME,
  toResumeDownloadUrl,
  toResumeViewUrl,
} from "../../lib/portfolioLinks";

interface ModernResumeLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  resumeUrl: string;
  children: ReactNode;
  /** View in tab (default) vs force download with filename. */
  mode?: "view" | "download";
}

export function ModernResumeLink({
  resumeUrl,
  children,
  mode = "view",
  target = "_blank",
  rel = "noopener noreferrer",
  download,
  ...props
}: ModernResumeLinkProps) {
  const href = mode === "download" ? toResumeDownloadUrl(resumeUrl) : toResumeViewUrl(resumeUrl);

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      {...(mode === "download" ? { download: download ?? RESUME_DOWNLOAD_FILENAME } : {})}
      {...props}
    >
      {children}
    </a>
  );
}
