import { Plus, Trash2 } from "lucide-react";
import type { ProjectLink, ProjectLinkVariant } from "../../lib/projectLinks";
import { MAX_PROJECT_LINKS, emptyProjectLink } from "../../lib/projectLinks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CaseStudyProjectLinksEditorProps {
  links: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
}

export function CaseStudyProjectLinksEditor({ links, onChange }: CaseStudyProjectLinksEditorProps) {
  const updateLink = (index: number, patch: Partial<ProjectLink>) => {
    const next = links.map((link, i) => (i === index ? { ...link, ...patch } : link));
    onChange(next);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (links.length >= MAX_PROJECT_LINKS) return;
    onChange([...links, emptyProjectLink(links.length === 0 ? "primary" : "secondary")]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Live project links</Label>
        <p className="text-xs text-muted-foreground leading-snug">
          Button-style actions below the hero (max {MAX_PROJECT_LINKS}). Opens in a new tab.
        </p>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground">No links yet.</p>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`project-link-label-${index}`} className="text-xs text-muted-foreground">
                  Label
                </Label>
                <Input
                  id={`project-link-label-${index}`}
                  value={link.label}
                  onChange={(e) => updateLink(index, { label: e.target.value })}
                  placeholder="Try live site"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`project-link-href-${index}`} className="text-xs text-muted-foreground">
                  URL
                </Label>
                <Input
                  id={`project-link-href-${index}`}
                  value={link.href}
                  onChange={(e) => updateLink(index, { href: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Style</Label>
                <Select
                  value={link.variant}
                  onValueChange={(value) => updateLink(index, { variant: value as ProjectLinkVariant })}
                >
                  <SelectTrigger className="w-full min-w-[7.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  aria-label={`Remove link ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLink}
        disabled={links.length >= MAX_PROJECT_LINKS}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add link
      </Button>
    </div>
  );
}
