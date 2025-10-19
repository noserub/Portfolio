import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit2, 
  Save, 
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  FlexibleCaseStudyTemplate, 
  CaseStudySection, 
  AVAILABLE_SECTIONS,
  addSectionToCaseStudy,
  removeSectionFromCaseStudy,
  reorderCaseStudySections
} from '../utils/flexibleCaseStudyTemplate';

interface CaseStudySectionManagerProps {
  caseStudy: FlexibleCaseStudyTemplate;
  onUpdate: (updatedCaseStudy: FlexibleCaseStudyTemplate) => void;
  isEditMode: boolean;
}

export function CaseStudySectionManager({ 
  caseStudy, 
  onUpdate, 
  isEditMode 
}: CaseStudySectionManagerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  const handleAddSection = (sectionId: string) => {
    const updatedCaseStudy = addSectionToCaseStudy(caseStudy, sectionId);
    onUpdate(updatedCaseStudy);
    setShowAddSection(false);
  };

  const handleRemoveSection = (sectionId: string) => {
    const updatedCaseStudy = removeSectionFromCaseStudy(caseStudy, sectionId);
    onUpdate(updatedCaseStudy);
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    const updatedCaseStudy = reorderCaseStudySections(caseStudy, fromIndex, toIndex);
    onUpdate(updatedCaseStudy);
  };

  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = caseStudy.sections.map(section => 
      section.id === sectionId 
        ? { ...section, isVisible: !section.isVisible }
        : section
    );
    onUpdate({ ...caseStudy, sections: updatedSections });
  };

  const handleStartEdit = (section: CaseStudySection) => {
    setEditingSection(section.id);
    setEditedTitle(section.title);
    setEditedContent(section.content);
  };

  const handleSaveEdit = () => {
    const updatedSections = caseStudy.sections.map(section => 
      section.id === editingSection
        ? { ...section, title: editedTitle, content: editedContent }
        : section
    );
    onUpdate({ ...caseStudy, sections: updatedSections });
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
    const section = AVAILABLE_SECTIONS.find(s => s.type === type);
    return section?.icon || '📄';
  };

  const getSectionDescription = (type: string) => {
    const section = AVAILABLE_SECTIONS.find(s => s.type === type);
    return section?.description || 'Section';
  };

  if (!isEditMode) {
    return null;
  }

  return (
    <div className="space-y-4 p-6 bg-card/50 rounded-xl border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Case Study Sections</h3>
        <Button
          onClick={() => setShowAddSection(!showAddSection)}
          size="sm"
          className="rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Add Section Panel */}
      {showAddSection && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/50 p-4 rounded-lg border border-border"
        >
          <h4 className="font-medium mb-3">Choose a section to add:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AVAILABLE_SECTIONS.map((section) => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                onClick={() => handleAddSection(section.id)}
                className="justify-start h-auto p-3"
              >
                <span className="mr-2">{section.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{section.title}</div>
                  <div className="text-xs text-muted-foreground">{section.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sections List */}
      <div className="space-y-2">
        {caseStudy.sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sections added yet.</p>
            <p className="text-sm">Click "Add Section" to get started.</p>
          </div>
        ) : (
          caseStudy.sections
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
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
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
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Move Down */}
                    {index < caseStudy.sections.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorderSection(index, index + 1)}
                        className="p-2"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSection(section.id)}
                      className="p-2 text-destructive hover:text-destructive"
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
            ))
        )}
      </div>
    </div>
  );
}
