import React, { useState } from "react";
import { motion } from "motion/react";
import { Info, Edit2, Save, X, Trash2 } from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface AtAGlanceSidebarProps {
  content: string;
  isEditMode?: boolean;
  onUpdate?: (title: string, content: string) => void;
  onRemove?: () => void;
}

export function AtAGlanceSidebar({ content, isEditMode, onUpdate, onRemove }: AtAGlanceSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Extract title from content (first line starting with #)
  const extractTitleFromContent = (content: string): string => {
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^# (.+)$/);
      if (match) {
        return match[1].trim();
      }
    }
    return "At a glance"; // fallback
  };
  
  const [editedTitle, setEditedTitle] = useState(extractTitleFromContent(content));
  const [editedContent, setEditedContent] = useState(content);
  const [originalTitle, setOriginalTitle] = useState(extractTitleFromContent(content));
  const [originalContent, setOriginalContent] = useState(content);

  // Update local state when content prop changes
  React.useEffect(() => {
    // Only update if content is valid and not corrupted
    if (content && typeof content === 'string' && content.trim().length > 0) {
      const extractedTitle = extractTitleFromContent(content);
      setEditedTitle(extractedTitle);
      setOriginalTitle(extractedTitle);
      setEditedContent(content);
      setOriginalContent(content);
    }
  }, [content]);

  const handleEdit = () => {
    setOriginalTitle(editedTitle);
    setOriginalContent(editedContent); // Use current edited content, not prop content
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedTitle, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(originalTitle);
    setEditedContent(originalContent);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <style>{`
        /* Override MarkdownRenderer spacing for compact layout */
        .at-a-glance-content.markdown-content p {
          margin-bottom: 1.25rem !important;
          margin-top: 0 !important;
          line-height: 1.7 !important;
          font-size: 0.95rem !important;
        }
        .at-a-glance-content.markdown-content p:last-child {
          margin-bottom: 0 !important;
        }
        .at-a-glance-content.markdown-content strong {
          font-weight: 600 !important;
        }
        /* Remove extra top margins from markdown renderer */
        .at-a-glance-content.markdown-content p + h1,
        .at-a-glance-content.markdown-content ul + h1,
        .at-a-glance-content.markdown-content p + h2,
        .at-a-glance-content.markdown-content ul + h2 {
          margin-top: 0 !important;
        }
      `}</style>
      <div className="p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
        {/* Gradient glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #06b6d420, transparent 70%)',
          }}
        />

        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-cyan-600 dark:text-cyan-400 shadow-md flex-shrink-0 transition-all duration-300 group-hover:shadow-xl"
          >
            <Info className="w-6 h-6" />
          </motion.div>
          
          {isEditing ? (
            <div className="flex-1">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-xl font-bold"
                placeholder="Section title..."
              />
            </div>
          ) : (
            <h3 className="text-xl flex-1">{editedTitle}</h3>
          )}
          
          {isEditMode && !isEditing && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="rounded-full"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              {onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRemove}
                  className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete this section"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content with scrollable editing area and sticky buttons */}
        <div className="relative z-10">
          {isEditing ? (
            <div className="flex flex-col max-h-[60vh]">
              <div className="flex-1 overflow-y-auto mb-4 pr-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px] h-full font-mono text-sm resize-none"
                  placeholder="Enter content (Markdown supported)..."
                />
              </div>
              <div className="flex gap-2 justify-end border-t border-border/50 pt-3 bg-card/80 backdrop-blur-sm">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="at-a-glance-content markdown-content">
              <MarkdownRenderer content={editedContent.trim()} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AtAGlanceSidebar;
