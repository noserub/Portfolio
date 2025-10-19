import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Plus, 
  Save, 
  X,
  FileText,
  Wand2,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  FlexibleCaseStudyTemplate, 
  CaseStudySection,
  createBlankCaseStudy,
  addSectionToCaseStudy,
  removeSectionFromCaseStudy,
  reorderCaseStudySections,
  convertToLegacyFormat,
  AVAILABLE_SECTIONS
} from '../utils/flexibleCaseStudyTemplate';

interface BlankProjectCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: any) => void;
  isEditMode: boolean;
}

export function BlankProjectCreator({ 
  isOpen, 
  onClose, 
  onCreateProject,
  isEditMode 
}: BlankProjectCreatorProps) {
  const [caseStudy, setCaseStudy] = useState<FlexibleCaseStudyTemplate>(createBlankCaseStudy());
  const [isCreating, setIsCreating] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const handleTitleChange = (title: string) => {
    setCaseStudy(prev => ({ ...prev, title }));
  };

  const handleDescriptionChange = (description: string) => {
    setCaseStudy(prev => ({ ...prev, description }));
  };

  const handleAddSection = (sectionId: string) => {
    const updatedCaseStudy = addSectionToCaseStudy(caseStudy, sectionId);
    setCaseStudy(updatedCaseStudy);
    setShowAddSection(false);
  };

  const handleRemoveSection = (sectionId: string) => {
    const updatedCaseStudy = removeSectionFromCaseStudy(caseStudy, sectionId);
    setCaseStudy(updatedCaseStudy);
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    const updatedCaseStudy = reorderCaseStudySections(caseStudy, fromIndex, toIndex);
    setCaseStudy(updatedCaseStudy);
  };

  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = caseStudy.sections.map(section => 
      section.id === sectionId 
        ? { ...section, isVisible: !section.isVisible }
        : section
    );
    setCaseStudy({ ...caseStudy, sections: updatedSections });
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
    setCaseStudy({ ...caseStudy, sections: updatedSections });
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

  const handleCreateProject = async () => {
    if (!caseStudy.title.trim()) {
      alert('Please enter a project title');
      return;
    }

    setIsCreating(true);
    try {
      const projectData = convertToLegacyFormat(caseStudy);
      await onCreateProject(projectData);
      onClose();
      // Reset form
      setCaseStudy(createBlankCaseStudy());
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setCaseStudy(createBlankCaseStudy());
    onClose();
  };

  if (!isOpen || !isEditMode) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-xl border border-border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create Blank Project</h2>
              <p className="text-sm text-muted-foreground">
                Start with a blank canvas and add sections as needed
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title</label>
                <Input
                  value={caseStudy.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={caseStudy.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Brief project description"
                />
              </div>
            </div>
          </div>

          {/* Sections Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sections</h3>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-muted-foreground">
                  {caseStudy.sections.length} section{caseStudy.sections.length !== 1 ? 's' : ''} added
                </div>
                <Button
                  onClick={() => setShowAddSection(!showAddSection)}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
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
            
            {caseStudy.sections.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sections added yet</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Section" to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {caseStudy.sections
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
                  ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Flexible Project Creation</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Add any sections you need, reorder them, and customize the content. 
                  You can edit section titles and content directly in this dialog.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            disabled={isCreating || !caseStudy.title.trim()}
            className="min-w-[120px]"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
