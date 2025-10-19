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
  Wand2
} from 'lucide-react';
import { 
  FlexibleCaseStudyTemplate, 
  createBlankCaseStudy,
  convertToLegacyFormat
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

  const handleTitleChange = (title: string) => {
    setCaseStudy(prev => ({ ...prev, title }));
  };

  const handleDescriptionChange = (description: string) => {
    setCaseStudy(prev => ({ ...prev, description }));
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

          {/* Sections Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sections</h3>
              <div className="text-sm text-muted-foreground">
                {caseStudy.sections.length} section{caseStudy.sections.length !== 1 ? 's' : ''} added
              </div>
            </div>
            
            {caseStudy.sections.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sections added yet</p>
                <p className="text-sm text-muted-foreground">
                  You can add sections after creating the project
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {caseStudy.sections
                  .sort((a, b) => a.position - b.position)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <span className="text-lg">
                        {section.type === 'markdown' ? '📄' : 
                         section.type === 'images' ? '🖼️' :
                         section.type === 'videos' ? '🎥' :
                         section.type === 'flowDiagrams' ? '📊' : '🎴'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">{section.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {section.type === 'markdown' ? 'Text content' :
                           section.type === 'images' ? 'Image gallery' :
                           section.type === 'videos' ? 'Video collection' :
                           section.type === 'flowDiagrams' ? 'Flow diagrams' : 'Solution cards'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {section.isVisible ? 'Visible' : 'Hidden'}
                      </div>
                    </div>
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
                  This creates a blank project that you can customize with any sections you need. 
                  You can add, remove, and reorder sections after creation.
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
