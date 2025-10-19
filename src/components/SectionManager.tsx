import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Edit2, 
  Save, 
  X,
  Settings,
  GripVertical
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// Available section types that can be added
const AVAILABLE_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Project introduction and summary',
    icon: '📋',
    type: 'markdown'
  },
  {
    id: 'at-a-glance',
    title: 'At a Glance',
    description: 'Key project details sidebar',
    icon: '👁️',
    type: 'sidebar'
  },
  {
    id: 'impact',
    title: 'Impact',
    description: 'Project impact and results sidebar',
    icon: '📊',
    type: 'sidebar'
  },
  {
    id: 'my-role-impact',
    title: 'My Role & Impact',
    description: 'Your role and contributions',
    icon: '👤',
    type: 'markdown'
  },
  {
    id: 'the-challenge',
    title: 'The Challenge',
    description: 'Problem statement and context',
    icon: '🎯',
    type: 'markdown'
  },
  {
    id: 'the-solution',
    title: 'The Solution',
    description: 'Solution approach and methodology',
    icon: '💡',
    type: 'markdown'
  },
  {
    id: 'key-features',
    title: 'Key Features',
    description: 'Important features and highlights',
    icon: '⭐',
    type: 'markdown'
  },
  {
    id: 'project-images',
    title: 'Project Images',
    description: 'Image gallery and visual content',
    icon: '🖼️',
    type: 'gallery'
  },
  {
    id: 'videos',
    title: 'Videos',
    description: 'Video content and demonstrations',
    icon: '🎥',
    type: 'gallery'
  },
  {
    id: 'flow-diagrams',
    title: 'Flow Diagrams',
    description: 'Process flows and diagrams',
    icon: '📊',
    type: 'gallery'
  },
  {
    id: 'solution-cards',
    title: 'Solution Cards',
    description: 'Interactive solution showcase',
    icon: '🎴',
    type: 'gallery'
  }
];

interface Section {
  id: string;
  title: string;
  content: string;
  type: string;
  position: number;
  isVisible: boolean;
}

interface SectionManagerProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  isEditMode: boolean;
}

export function SectionManager({ sections, onSectionsChange, isEditMode }: SectionManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const handleAddSection = (sectionId: string) => {
    const sectionTemplate = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
    if (!sectionTemplate) return;

    const newSection: Section = {
      id: `${sectionId}-${Date.now()}`,
      title: sectionTemplate.title,
      content: sectionTemplate.content,
      type: sectionTemplate.type,
      position: sections.length,
      isVisible: true
    };

    onSectionsChange([...sections, newSection]);
    setShowAddDialog(false);
  };

  const handleRemoveSection = (sectionId: string) => {
    const updatedSections = sections
      .filter(s => s.id !== sectionId)
      .map((s, index) => ({ ...s, position: index }));
    onSectionsChange(updatedSections);
    setSectionToDelete(null);
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    const updatedSections = [...sections];
    const [movedSection] = updatedSections.splice(fromIndex, 1);
    updatedSections.splice(toIndex, 0, movedSection);
    
    const reorderedSections = updatedSections.map((s, index) => ({ ...s, position: index }));
    onSectionsChange(reorderedSections);
  };

  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = sections.map(section => 
      section.id === sectionId 
        ? { ...section, isVisible: !section.isVisible }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const handleStartEdit = (section: Section) => {
    setEditingSection(section.id);
    setEditedTitle(section.title);
    setEditedContent(section.content);
  };

  const handleSaveEdit = () => {
    const updatedSections = sections.map(section => 
      section.id === editingSection
        ? { ...section, title: editedTitle, content: editedContent }
        : section
    );
    onSectionsChange(updatedSections);
    setEditingSection(null);
    setEditedTitle('');
    setEditedContent('');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditedTitle('');
    setEditedContent('');
  };

  const getSectionIcon = (type: string) => {
    const section = AVAILABLE_SECTIONS.find(s => s.id === type);
    return section?.icon || '📄';
  };

  const getSectionDescription = (type: string) => {
    const section = AVAILABLE_SECTIONS.find(s => s.id === type);
    return section?.description || 'Section';
  };

  if (!isEditMode) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Management Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Section Management</h3>
            <p className="text-sm text-muted-foreground">
              Add, remove, and reorder sections in your case study
            </p>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>
                Choose a section type to add to your case study.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {AVAILABLE_SECTIONS.map((section) => {
                const isAlreadyAdded = sections.some(s => s.type === section.id);
                return (
                  <Button
                    key={section.id}
                    variant="outline"
                    onClick={() => handleAddSection(section.id)}
                    disabled={isAlreadyAdded}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <span className="text-2xl">{section.icon}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-muted-foreground">{section.description}</div>
                        {isAlreadyAdded && (
                          <div className="text-xs text-amber-600 mt-1">Already added</div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No sections added yet</p>
          <p className="text-sm text-muted-foreground">
            Click "Add Section" to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections
            .sort((a, b) => a.position - b.position)
            .map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg">{getSectionIcon(section.type)}</span>
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {getSectionDescription(section.type)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Visibility Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(section.id)}
                      className="p-2"
                      title={section.isVisible ? 'Hide section' : 'Show section'}
                    >
                      {section.isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(section)}
                      className="p-2"
                      title="Edit section"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    {/* Move Up */}
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderSection(index, index - 1)}
                        className="p-2"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Move Down */}
                    {index < sections.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderSection(index, index + 1)}
                        className="p-2"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSectionToDelete(section.id)}
                      className="p-2 text-destructive hover:text-destructive"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit Form */}
                {editingSection === section.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3 border-t border-border pt-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Section Title</label>
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Enter section title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Section Content</label>
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Enter section content (Markdown supported)"
                        className="min-h-[200px]"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sectionToDelete && handleRemoveSection(sectionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
