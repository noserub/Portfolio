import { useMemo, useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Link2,
  Plus,
  Quote,
  Trash2,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { WritingBlockRenderer, type RelatedLinkTarget } from './WritingBlockRenderer';
import { WritingImageField } from './WritingImageField';
import { uploadWritingImage } from '../../lib/writingImageUpload';
import { getPostgrestErrorMessage } from '../../lib/supabaseClient';
import {
  createWritingBlock,
  WRITING_BLOCK_TYPES,
  type WritingBlock,
  type WritingBlockType,
} from '../../types/writingBlocks';
import type { WritingLayout } from '../../types/writingBlocks';
import type { WritingPost, WritingPostUpdate } from '../../lib/writingPosts';
import { buildWritingPostUpdatePayload } from '../../lib/writingPosts';
import { isValidWritingSlug, slugFromWritingTitle } from '../../lib/writingSlug';

const BLOCK_LABELS: Record<WritingBlockType, string> = {
  prose: 'Prose',
  pull_quote: 'Pull quote',
  figure: 'Figure',
  related: 'Related link',
};

const BLOCK_ICONS: Record<WritingBlockType, typeof Type> = {
  prose: Type,
  pull_quote: Quote,
  figure: ImagePlus,
  related: Link2,
};

function parseTopicsInput(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatTopicsInput(topics: string[]): string {
  return topics.join(', ');
}

const LAYOUT_HINTS: Record<WritingLayout, string> = {
  essay:
    'Text-first article. Hero image appears on index cards only, not on the post page.',
  magazine:
    'Full-width hero banner above the title. Set a hero image below, then save settings.',
  note: 'Shorter read with a compact title and tighter spacing.',
};

export interface WritingBlocksEditorProps {
  post: WritingPost;
  caseStudies: RelatedLinkTarget[];
  posts: RelatedLinkTarget[];
  existingSlugs: string[];
  onSave: (patch: WritingPostUpdate) => Promise<boolean>;
  onDelete?: () => Promise<void>;
}

export function WritingBlocksEditor({
  post,
  caseStudies,
  posts,
  existingSlugs,
  onSave,
  onDelete,
}: WritingBlocksEditorProps) {
  const [draft, setDraft] = useState<WritingPost>(post);
  const [topicsInput, setTopicsInput] = useState(() => formatTopicsInput(post.topics));
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockDraft, setBlockDraft] = useState<WritingBlock | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    setDraft(post);
    setTopicsInput(formatTopicsInput(post.topics));
  }, [post.id, post.updated_at]);

  const otherSlugs = useMemo(
    () => existingSlugs.filter((s) => s !== post.slug),
    [existingSlugs, post.slug],
  );

  const syncPost = (next: WritingPost) => {
    setDraft(next);
  };

  const persistPost = async (next: WritingPost) => {
    setSaving(true);
    const payload = buildWritingPostUpdatePayload(post, {
      slug: next.slug,
      title: next.title,
      subtitle: next.subtitle,
      excerpt: next.excerpt,
      hero_image: next.hero_image,
      hero_image_crop: next.hero_image_crop,
      hero_image_lightbox: next.hero_image_lightbox,
      layout: next.layout,
      topics: next.topics,
      blocks: next.blocks,
      linkedin_url: next.linkedin_url,
      published: next.published,
      published_at: next.published_at,
      sort_order: next.sort_order,
    });
    const ok = await onSave(payload);
    setSaving(false);
    if (ok) toast.success('Post saved');
    else toast.error('Failed to save post');
    return ok;
  };

  const handleMetaSave = async () => {
    if (!isValidWritingSlug(draft.slug)) {
      toast.error('Slug must be lowercase letters, numbers, and hyphens.');
      return;
    }
    if (otherSlugs.includes(draft.slug)) {
      toast.error('That slug is already in use.');
      return;
    }
    const next = { ...draft, topics: parseTopicsInput(topicsInput) };
    syncPost(next);
    setTopicsInput(formatTopicsInput(next.topics));
    await persistPost(next);
  };

  const startEditBlock = (block: WritingBlock) => {
    setEditingBlockId(block.id);
    setBlockDraft(JSON.parse(JSON.stringify(block)) as WritingBlock);
  };

  const cancelEditBlock = () => {
    setEditingBlockId(null);
    setBlockDraft(null);
  };

  const saveBlock = async () => {
    if (!blockDraft || !editingBlockId) return;
    const nextBlocks = draft.blocks.map((b) =>
      b.id === editingBlockId ? blockDraft : b,
    );
    const next = { ...draft, blocks: nextBlocks };
    syncPost(next);
    cancelEditBlock();
    await persistPost(next);
  };

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= draft.blocks.length) return;
    const nextBlocks = [...draft.blocks];
    [nextBlocks[index], nextBlocks[target]] = [nextBlocks[target], nextBlocks[index]];
    const next = { ...draft, blocks: nextBlocks };
    syncPost(next);
    await persistPost(next);
  };

  const removeBlock = async (id: string) => {
    const next = { ...draft, blocks: draft.blocks.filter((b) => b.id !== id) };
    syncPost(next);
    if (editingBlockId === id) cancelEditBlock();
    await persistPost(next);
  };

  const addBlock = async (type: WritingBlockType) => {
    const block = createWritingBlock(type);
    const next = { ...draft, blocks: [...draft.blocks, block] };
    syncPost(next);
    setShowAddMenu(false);
    await persistPost(next);
    startEditBlock(block);
  };

  const uploadFigureImage = async (file: File, onUrl: (url: string) => void) => {
    try {
      const url = await uploadWritingImage(file);
      onUrl(url);
      toast.success('Image uploaded');
    } catch (err) {
      console.error('Writing image upload failed:', err);
      toast.error(getPostgrestErrorMessage(err) || 'Image upload failed');
    }
  };

  const applyHeroImage = async (url: string) => {
    const next = {
      ...draft,
      hero_image: url || null,
      hero_image_crop: url ? draft.hero_image_crop : null,
      hero_image_lightbox: url ? draft.hero_image_lightbox : false,
    };
    syncPost(next);
    await persistPost(next);
  };

  const renderBlockEditor = (block: WritingBlock) => {
    if (!blockDraft || blockDraft.id !== block.id) return null;

    switch (blockDraft.type) {
      case 'prose':
        return (
          <Textarea
            value={blockDraft.content}
            onChange={(e) => setBlockDraft({ ...blockDraft, content: e.target.value })}
            rows={12}
            placeholder="Markdown supported..."
            className="font-mono text-sm"
          />
        );
      case 'pull_quote':
        return (
          <div className="space-y-3">
            <Textarea
              value={blockDraft.text}
              onChange={(e) => setBlockDraft({ ...blockDraft, text: e.target.value })}
              rows={3}
              placeholder="Quote text"
            />
            <Input
              value={blockDraft.attribution || ''}
              onChange={(e) => setBlockDraft({ ...blockDraft, attribution: e.target.value })}
              placeholder="Attribution (optional)"
            />
          </div>
        );
      case 'figure':
        return (
          <div className="space-y-3">
            <WritingImageField
              id={`figure-${block.id}`}
              label="Figure image"
              value={blockDraft.url}
              onChange={(url) =>
                setBlockDraft({
                  ...blockDraft,
                  url,
                  crop: url ? blockDraft.crop : null,
                  lightbox: url ? blockDraft.lightbox : false,
                })
              }
              crop={blockDraft.crop}
              onCropChange={(crop) => setBlockDraft({ ...blockDraft, crop })}
              cropPreview={
                blockDraft.layout === 'fullBleed' ? 'figure-bleed' : 'figure-inline'
              }
              onUpload={async (file) => {
                await uploadFigureImage(file, (url) => setBlockDraft({ ...blockDraft, url }));
              }}
            />
            <Input
              value={blockDraft.alt}
              onChange={(e) => setBlockDraft({ ...blockDraft, alt: e.target.value })}
              placeholder="Alt text"
            />
            <Input
              value={blockDraft.caption || ''}
              onChange={(e) => setBlockDraft({ ...blockDraft, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
            <Select
              value={blockDraft.layout}
              onValueChange={(v) =>
                setBlockDraft({ ...blockDraft, layout: v as 'inline' | 'fullBleed' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">Inline (text column)</SelectItem>
                <SelectItem value="fullBleed">Wide (page width)</SelectItem>
              </SelectContent>
            </Select>
            <p className="modern-writing-layout-hint">
              {blockDraft.layout === 'fullBleed'
                ? 'Wide figures break out to the full content width. Inline stays inside the reading column with a height cap.'
                : 'Inline figures stay in the reading column with rounded corners and a max height.'}
            </p>
            {blockDraft.url ? (
              <div className="flex items-center gap-3">
                <Switch
                  id={`figure-lightbox-${block.id}`}
                  checked={Boolean(blockDraft.lightbox)}
                  onCheckedChange={(checked) =>
                    setBlockDraft({ ...blockDraft, lightbox: checked })
                  }
                />
                <Label htmlFor={`figure-lightbox-${block.id}`} className="font-normal">
                  Click for full view
                </Label>
              </div>
            ) : null}
          </div>
        );
      case 'related':
        return (
          <div className="space-y-3">
            <Select
              value={blockDraft.linkType}
              onValueChange={(v) =>
                setBlockDraft({
                  ...blockDraft,
                  linkType: v as 'case_study' | 'post',
                  targetId: '',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="case_study">Case study</SelectItem>
                <SelectItem value="post">Writing post</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={blockDraft.targetId || undefined}
              onValueChange={(v) => setBlockDraft({ ...blockDraft, targetId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {(blockDraft.linkType === 'case_study' ? caseStudies : posts)
                  .filter((t) => t.id !== post.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              value={blockDraft.label || ''}
              onChange={(e) => setBlockDraft({ ...blockDraft, label: e.target.value })}
              placeholder="Custom label (optional)"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border/70 bg-card/40 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Post settings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="writing-title">Title</Label>
            <Input
              id="writing-title"
              value={draft.title}
              onChange={(e) => {
                const title = e.target.value;
                setDraft((prev) => ({
                  ...prev,
                  title,
                  slug: prev.slug || slugFromWritingTitle(title),
                }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writing-slug">Slug</Label>
            <Input
              id="writing-slug"
              value={draft.slug}
              onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="writing-layout">Layout</Label>
            <Select
              value={draft.layout}
              onValueChange={(v) => setDraft((prev) => ({ ...prev, layout: v as WritingLayout }))}
            >
              <SelectTrigger id="writing-layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="magazine">Magazine</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
            <p className="modern-writing-layout-hint">{LAYOUT_HINTS[draft.layout]}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="writing-subtitle">Subtitle</Label>
            <Input
              id="writing-subtitle"
              value={draft.subtitle || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="writing-excerpt">Excerpt</Label>
            <Textarea
              id="writing-excerpt"
              value={draft.excerpt || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="writing-topics">Topics (comma-separated)</Label>
            <Input
              id="writing-topics"
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              onBlur={() => {
                const topics = parseTopicsInput(topicsInput);
                setTopicsInput(formatTopicsInput(topics));
                setDraft((prev) => ({ ...prev, topics }));
              }}
              placeholder="Enterprise AI, Product Design, UX Strategy"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <WritingImageField
              id="writing-hero"
              label="Hero image"
              value={draft.hero_image || ''}
              onChange={(url) =>
                setDraft((prev) => ({
                  ...prev,
                  hero_image: url || null,
                  hero_image_crop: url ? prev.hero_image_crop : null,
                  hero_image_lightbox: url ? prev.hero_image_lightbox : false,
                }))
              }
              crop={draft.hero_image_crop}
              onCropChange={(crop) => {
                const next = { ...draft, hero_image_crop: crop };
                syncPost(next);
                void persistPost(next);
              }}
              cropPreview={draft.layout === 'magazine' ? 'hero' : 'card'}
              onClear={() => void applyHeroImage('')}
              onUpload={async (file) => {
                await uploadFigureImage(file, (url) => void applyHeroImage(url));
              }}
              hint="Used on index cards for all layouts. On the post page, only Magazine layout shows it as a full banner. Use Adjust framing to crop and position."
            />
            {draft.hero_image ? (
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id="writing-hero-lightbox"
                  checked={draft.hero_image_lightbox}
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, hero_image_lightbox: checked }))
                  }
                />
                <Label htmlFor="writing-hero-lightbox" className="font-normal">
                  Click hero for full view
                </Label>
              </div>
            ) : null}
            {draft.hero_image && draft.layout !== 'magazine' ? (
              <p className="text-xs text-muted-foreground">
                Full view applies on the post page when layout is Magazine.
              </p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="writing-linkedin">LinkedIn URL (optional)</Label>
            <Input
              id="writing-linkedin"
              value={draft.linkedin_url || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, linkedin_url: e.target.value }))}
              placeholder="https://www.linkedin.com/posts/..."
            />
            <p className="text-xs text-muted-foreground">
              Publish the full essay here first. Link to your LinkedIn post for discussion.
            </p>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Switch
              id="writing-published"
              checked={draft.published}
              onCheckedChange={(checked) =>
                setDraft((prev) => ({ ...prev, published: checked }))
              }
            />
            <Label htmlFor="writing-published">Published</Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleMetaSave()} disabled={saving}>
            Save settings
          </Button>
          {onDelete ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete post
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Blocks</h2>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowAddMenu((v) => !v)}>
              <Plus className="w-4 h-4 mr-1" />
              Add block
            </Button>
            {showAddMenu ? (
              <div className="absolute right-0 top-full mt-2 z-20 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-lg">
                {WRITING_BLOCK_TYPES.map((type) => {
                  const Icon = BLOCK_ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => void addBlock(type)}
                    >
                      <Icon className="w-4 h-4" />
                      {BLOCK_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {draft.blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No blocks yet. Add prose, quotes, figures, or related links.</p>
        ) : null}

        {draft.blocks.map((block, index) => {
          const isEditing = editingBlockId === block.id;
          return (
            <div
              key={block.id}
              className="rounded-xl border border-border/70 bg-card/30 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {BLOCK_LABELS[block.type]}
                  {!block.visible ? ' (hidden)' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => void moveBlock(index, 'up')}
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === draft.blocks.length - 1}
                    onClick={() => void moveBlock(index, 'down')}
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => startEditBlock(block)}>
                      Edit
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => void removeBlock(block.id)}
                    aria-label="Delete block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {renderBlockEditor(block)}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={blockDraft?.visible ?? true}
                      onCheckedChange={(checked) =>
                        blockDraft && setBlockDraft({ ...blockDraft, visible: checked })
                      }
                    />
                    <span className="text-sm text-muted-foreground">Visible</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveBlock()}>
                      Save block
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditBlock}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <WritingBlockRenderer
                  blocks={[block]}
                  caseStudies={caseStudies}
                  posts={posts}
                />
              )}
            </div>
          );
        })}
      </section>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the post and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onDelete?.()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
