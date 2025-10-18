import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Moon, Sun, Edit2, Trash2, ArrowUp, ArrowDown, Search, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { motion } from 'motion/react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { AnimatedBackground } from './AnimatedBackground';
import { Card3D } from './Card3D';
import { AbstractPattern } from './AbstractPattern';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComponentSection {
  name: string;
  components: {
    name: string;
    description: string;
    render: () => React.ReactNode;
  }[];
}

// Error boundary wrapper for safe rendering
function SafeRender({ children }: { children: () => React.ReactNode }) {
  try {
    return <>{children()}</>;
  } catch (error) {
    console.error('Component render error:', error);
    return (
      <div className="text-sm text-red-500 p-4 border border-red-500/30 rounded-lg bg-red-500/10">
        Error rendering component preview. Check console for details.
      </div>
    );
  }
}

export function ComponentLibrary({ isOpen, onClose }: ComponentLibraryProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Buttons', 'Display Components']));
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'both'>('both');

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  const componentSections: ComponentSection[] = [
    {
      name: 'Buttons',
      components: [
        {
          name: 'Button Variants',
          description: 'Primary, secondary, outline, ghost, destructive, and link button styles',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          ),
        },
        {
          name: 'Button Sizes',
          description: 'Different button sizes: sm, default, lg, icon',
          render: () => (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ),
        },
        {
          name: 'Button States',
          description: 'Disabled and loading states',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button>
                <span className="animate-spin mr-2">⏳</span>
                Loading...
              </Button>
            </div>
          ),
        },
        {
          name: 'Rounded Full Buttons',
          description: 'Custom rounded-full button styles used throughout the site',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full">Rounded Small</Button>
              <Button size="sm" variant="outline" className="rounded-full">
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" className="rounded-full">
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full p-2">
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          ),
        },
        {
          name: 'Custom Colored Buttons',
          description: 'Buttons with custom background colors used in Edit/Preview modes',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                📥 Export Now
              </Button>
              <Button size="sm" variant="outline" className="rounded-full bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-500/50">
                💾 Verify Saved
              </Button>
              <Button size="sm" variant="outline" className="rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-500/50">
                <Search className="w-3 h-3 mr-1" />
                SEO Settings
              </Button>
            </div>
          ),
        },
        {
          name: 'Animated Gradient Border Button',
          description: 'Custom button with animated gradient border (used on Home, About, Contact)',
          render: () => (
            <motion.div
              className="rounded-full p-[2px] inline-block"
              animate={{
                background: [
                  "linear-gradient(0deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(45deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(180deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(225deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(270deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(315deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                  "linear-gradient(360deg, #ec4899, #8b5cf6, #3b82f6, #fbbf24)",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <button className="relative rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm hover:bg-background/60">
                <span className="relative z-10 text-foreground font-bold">
                  Button Text
                </span>
              </button>
            </motion.div>
          ),
        },
        {
          name: 'LinkedIn "in" Button',
          description: 'Custom LinkedIn button with hover inversion effect',
          render: () => (
            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                aria-label="LinkedIn Profile"
              >
                <div className="absolute inset-0 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" />
                <span
                  className="relative z-10 text-foreground group-hover:text-background font-semibold transition-colors duration-300"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                  }}
                >
                  in
                </span>
              </a>
              <span className="text-sm text-muted-foreground">Hover to see effect</span>
            </div>
          ),
        },
        {
          name: 'Theme Toggle Button',
          description: 'Animated theme switcher with icon transition',
          render: () => (
            <Button
              variant="secondary"
              className="rounded-full shadow-lg backdrop-blur-sm p-2.5 md:px-4 md:py-2"
            >
              <Moon className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Dark Mode</span>
            </Button>
          ),
        },
        {
          name: 'Overflow Menu Button',
          description: 'Three-dot menu button used in top right corner',
          render: () => (
            <button className="rounded-full shadow-lg backdrop-blur-sm p-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          ),
        },
      ],
    },
    {
      name: 'Form Inputs',
      components: [
        {
          name: 'Input',
          description: 'Text input field',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="demo-input">Email</Label>
              <Input id="demo-input" type="email" placeholder="Enter your email" />
            </div>
          ),
        },
        {
          name: 'Textarea',
          description: 'Multi-line text input',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="demo-textarea">Description</Label>
              <Textarea id="demo-textarea" placeholder="Enter description" rows={3} />
            </div>
          ),
        },
        {
          name: 'Select',
          description: 'Dropdown selection',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Label>Select Option</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ),
        },
        {
          name: 'Checkbox',
          description: 'Boolean checkbox input',
          render: () => (
            <div className="flex items-center space-x-2">
              <Checkbox id="demo-checkbox" />
              <Label htmlFor="demo-checkbox">Accept terms and conditions</Label>
            </div>
          ),
        },
        {
          name: 'Switch',
          description: 'Toggle switch',
          render: () => (
            <div className="flex items-center space-x-2">
              <Switch id="demo-switch" />
              <Label htmlFor="demo-switch">Enable notifications</Label>
            </div>
          ),
        },
        {
          name: 'Radio Group',
          description: 'Single choice selection',
          render: () => (
            <RadioGroup defaultValue="option1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="r1" />
                <Label htmlFor="r1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="r2" />
                <Label htmlFor="r2">Option 2</Label>
              </div>
            </RadioGroup>
          ),
        },
        {
          name: 'Slider',
          description: 'Range slider input',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Label>Volume</Label>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
          ),
        },
      ],
    },
    {
      name: 'Display Components',
      components: [
        {
          name: 'Badge',
          description: 'Status indicators and labels',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          ),
        },
        {
          name: 'Status Indicators',
          description: 'Custom status badges used in Edit mode',
          render: () => (
            <div className="flex flex-wrap gap-2">
              <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-900 dark:text-yellow-100 px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                ✏️ Editing Mode Active
              </div>
              <div className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-green-400 text-sm">
                ✓ Changes saved!
              </div>
            </div>
          ),
        },
        {
          name: 'Info Cards',
          description: 'Colored informational cards with borders',
          render: () => (
            <div className="space-y-2 max-w-md">
              <div className="bg-amber-500/30 border-2 border-amber-500 text-amber-900 dark:text-amber-100 px-4 py-3 rounded-xl text-xs backdrop-blur-sm">
                <strong className="block mb-1">💾 Save Your Work!</strong>
                <div>Remember to export your changes regularly.</div>
              </div>
            </div>
          ),
        },
        {
          name: 'Avatar',
          description: 'User profile image with fallback',
          render: () => (
            <div className="flex gap-2">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          ),
        },
        {
          name: 'Progress',
          description: 'Progress indicator',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Progress value={65} />
            </div>
          ),
        },
        {
          name: 'Skeleton',
          description: 'Loading placeholder',
          render: () => (
            <div className="space-y-2 max-w-sm">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          ),
        },
        {
          name: 'Separator',
          description: 'Visual divider',
          render: () => (
            <div className="w-full max-w-sm space-y-4">
              <div>Above separator</div>
              <Separator />
              <div>Below separator</div>
            </div>
          ),
        },
      ],
    },
    {
      name: 'Feedback & Notifications',
      components: [
        {
          name: 'Alert',
          description: 'Informational messages',
          render: () => (
            <div className="space-y-2 max-w-md">
              <Alert>
                <AlertDescription>
                  This is a default alert message.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertDescription>
                  This is a destructive alert message.
                </AlertDescription>
              </Alert>
            </div>
          ),
        },
        {
          name: 'Toast',
          description: 'Temporary notification (click button to see)',
          render: () => (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => toast.success('Success! This is a toast notification.')}
              >
                Show Success Toast
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => toast.error('Error! Something went wrong.')}
              >
                Show Error Toast
              </Button>
            </div>
          ),
        },
        {
          name: 'Alert Dialog',
          description: 'Modal confirmation dialog (visual preview only - cannot demo inside modal)',
          render: () => (
            <div className="space-y-3">
              <Button variant="outline" disabled>
                Open Dialog (Demo Only)
              </Button>
              <div className="text-xs text-muted-foreground border border-border rounded-lg p-4 space-y-2">
                <div className="font-semibold">Dialog Content Preview:</div>
                <div className="space-y-1">
                  <div className="text-sm">Title: "Are you sure?"</div>
                  <div className="text-xs opacity-70">Description: "This action cannot be undone."</div>
                  <div className="flex gap-2 mt-2">
                    <div className="px-3 py-1.5 bg-muted rounded text-xs">Cancel Button</div>
                    <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs">Continue Button</div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      name: 'Layout Components',
      components: [
        {
          name: 'Card',
          description: 'Container with header, content, and optional footer',
          render: () => (
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This is the card content area.</p>
              </CardContent>
            </Card>
          ),
        },
        {
          name: 'Tabs',
          description: 'Tabbed content sections',
          render: () => (
            <Tabs defaultValue="tab1" className="max-w-md">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">Content for tab 1</TabsContent>
              <TabsContent value="tab2">Content for tab 2</TabsContent>
              <TabsContent value="tab3">Content for tab 3</TabsContent>
            </Tabs>
          ),
        },
        {
          name: 'Accordion',
          description: 'Collapsible content sections',
          render: () => (
            <Accordion type="single" collapsible className="max-w-md">
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>
                  Content for section 1
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>
                  Content for section 2
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ),
        },
        {
          name: 'Table',
          description: 'Data table',
          render: () => (
            <div className="max-w-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>John Doe</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Jane Smith</TableCell>
                    <TableCell>Inactive</TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ),
        },
      ],
    },
    {
      name: 'Custom Components',
      components: [
        {
          name: 'AnimatedBackground',
          description: 'Van Gogh-inspired swirly background animation with brushstrokes, organic shapes, and floating dots',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
              <div className="mb-2 font-semibold">Animated Background Component</div>
              <div className="space-y-1 text-xs">
                <div>• Full-screen Van Gogh-inspired background</div>
                <div>• Swirling brushstrokes with smooth animations</div>
                <div>• Floating organic shapes and colorful dots</div>
                <div>• Pink, purple, blue, and yellow gradients</div>
                <div>• Used as main background throughout site</div>
              </div>
            </div>
          ),
        },
        {
          name: 'Card3D',
          description: 'Interactive 3D card with tilt and hover effects - wraps content with 3D transform effects',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Card3D Component</div>
              <div className="space-y-1 text-xs">
                <div>• Wrapper component with 3D tilt effects</div>
                <div>• Responds to mouse movement for parallax</div>
                <div>• Uses Motion for smooth animations</div>
                <div>• Used for case study preview cards</div>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="italic">Example: Wraps content with children prop</div>
                </div>
              </div>
            </div>
          ),
        },
        {
          name: 'AbstractPattern',
          description: 'Decorative abstract pattern background used in various sections',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg bg-gradient-to-br from-pink-500/10 via-yellow-500/10 to-blue-500/10">
              <div className="mb-2 font-semibold">Abstract Pattern Component</div>
              <div className="space-y-1 text-xs">
                <div>• Full-screen decorative SVG pattern</div>
                <div>• Animated swirling paths with gradients</div>
                <div>• Complementary design to AnimatedBackground</div>
                <div>• Used in hero sections and page backgrounds</div>
              </div>
            </div>
          ),
        },
        {
          name: 'MarkdownRenderer',
          description: 'Converts markdown to styled HTML with support for headings, lists, links, bold, italic, and more',
          render: () => (
            <div className="max-w-md">
              <MarkdownRenderer 
                content={`## Heading 2
                
**Bold text** and *italic text*

- List item 1
- List item 2
- List item 3

[Link example](#)`}
              />
            </div>
          ),
        },
        {
          name: 'AtAGlanceSidebar',
          description: 'Case study metadata sidebar (visual description - requires case study context)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">At a Glance Sidebar</div>
              <div>Displays project metadata including role, team, timeline, and tools used in case study pages.</div>
            </div>
          ),
        },
        {
          name: 'ImpactSidebar',
          description: 'Project impact metrics sidebar (visual description - requires case study context)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Impact Sidebar</div>
              <div>Shows quantitative and qualitative project impact metrics with icon support in case study pages.</div>
            </div>
          ),
        },
        {
          name: 'ImageGallery',
          description: 'Masonry grid gallery with lightbox viewing (visual description - requires images)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Masonry Grid Gallery</div>
              <div>Responsive image gallery with lightbox viewing. Used in case studies for project images with drag-to-reorder in edit mode.</div>
            </div>
          ),
        },
        {
          name: 'FlowDiagramGallery',
          description: 'Specialized gallery for user flows and diagrams (visual description - requires images)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Flow Diagram Gallery</div>
              <div>Gallery optimized for displaying user flows and process diagrams with lightbox and drag-to-reorder capabilities.</div>
            </div>
          ),
        },
        {
          name: 'Lightbox',
          description: 'Full-screen image viewer with keyboard navigation (visual description only)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Lightbox Viewer</div>
              <div>Full-screen image viewer with prev/next navigation, fullscreen mode, and keyboard shortcuts (ESC, arrows).</div>
            </div>
          ),
        },
        {
          name: 'CaseStudyPasswordPrompt',
          description: 'Password protection modal for individual case studies (visual description only)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">Password Protection</div>
              <div>Modal dialog for protecting case studies with password authentication (default: "0p3n").</div>
            </div>
          ),
        },
        {
          name: 'SEOEditor',
          description: 'Comprehensive SEO optimization tool (visual description only)',
          render: () => (
            <div className="text-sm text-muted-foreground max-w-md p-4 border border-border rounded-lg">
              <div className="mb-2 font-semibold">SEO Editor</div>
              <div>Edit meta tags, Open Graph data, Twitter cards, and structured data for all pages and case studies.</div>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background text-foreground rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl mb-1">Component Library</h2>
            <p className="text-sm text-muted-foreground">
              {componentSections.reduce((total, section) => total + section.components.length, 0)} UI components available
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
              <button
                onClick={() => setPreviewTheme('light')}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  previewTheme === 'light' 
                    ? 'bg-background shadow-sm' 
                    : 'hover:bg-background/50'
                }`}
                title="Light mode preview"
              >
                <Sun className="w-3 h-3 inline mr-1" />
                Light
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  previewTheme === 'dark' 
                    ? 'bg-background shadow-sm' 
                    : 'hover:bg-background/50'
                }`}
                title="Dark mode preview"
              >
                <Moon className="w-3 h-3 inline mr-1" />
                Dark
              </button>
              <button
                onClick={() => setPreviewTheme('both')}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  previewTheme === 'both' 
                    ? 'bg-background shadow-sm' 
                    : 'hover:bg-background/50'
                }`}
                title="Show both themes"
              >
                Both
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted transition-colors"
              aria-label="Close component library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {componentSections.map((section) => (
            <div key={section.name} className="space-y-4">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.name)}
                className="flex items-center gap-2 w-full text-left group"
              >
                {expandedSections.has(section.name) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <h3 className="text-xl group-hover:text-primary transition-colors">
                  {section.name}
                </h3>
                <span className="text-sm text-muted-foreground ml-auto">
                  {section.components.length} components
                </span>
              </button>

              {/* Section Components */}
              {expandedSections.has(section.name) && (
                <div className="ml-7 space-y-6">
                  {section.components.map((component) => (
                    <div
                      key={component.name}
                      className="p-6 bg-card rounded-xl border border-border space-y-4"
                    >
                      <div>
                        <h4 className="text-lg mb-1">{component.name}</h4>
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                      </div>
                      
                      {/* Render preview based on theme selection */}
                      {previewTheme === 'both' ? (
                        <div className="space-y-4">
                          {/* Light Mode Preview */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Sun className="w-3 h-3" />
                              Light Mode
                            </div>
                            <div className="p-6 bg-white text-gray-900 rounded-lg border border-gray-200">
                              <div className="light">
                                <SafeRender>{component.render}</SafeRender>
                              </div>
                            </div>
                          </div>
                          {/* Dark Mode Preview */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Moon className="w-3 h-3" />
                              Dark Mode
                            </div>
                            <div className="p-6 bg-gray-950 text-gray-100 rounded-lg border border-gray-800">
                              <div className="dark">
                                <SafeRender>{component.render}</SafeRender>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : previewTheme === 'light' ? (
                        <div className="p-6 bg-white text-gray-900 rounded-lg border border-gray-200">
                          <div className="light">
                            <SafeRender>{component.render}</SafeRender>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-950 text-gray-100 rounded-lg border border-gray-800">
                          <div className="dark">
                            <SafeRender>{component.render}</SafeRender>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComponentLibrary;
