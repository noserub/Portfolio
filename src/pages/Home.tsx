import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useDrag, useDrop } from "react-dnd";
import { ProjectImage, ProjectData } from "../components/ProjectImage";
import { Lightbox } from "../components/Lightbox";
import { useSEO } from "../hooks/useSEO";
import { useProjects } from "../hooks/useProjects";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Edit2, Save, GripVertical, Linkedin, FileText, Trash2, Eye, Wand2 } from "lucide-react";
import { createCaseStudyFromTemplate } from "../utils/caseStudyTemplate";
import { loadMigratedProjects } from "../utils/migrateVideoFields";
import { UnifiedProjectCreator } from "../components/UnifiedProjectCreator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

interface HomeProps {
  onStartClick: () => void;
  isEditMode: boolean;
  onProjectClick: (project: ProjectData, updateCallback: (project: ProjectData) => void) => void;
  currentPage: string;
}

interface DraggableProjectItemProps {
  project: ProjectData;
  index: number;
  isEditMode: boolean;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onClick: () => void;
  onUpdate: (project: ProjectData) => void;
  onReplace: (file: File) => void;
  onDelete?: () => void;
  onNavigate?: () => void;
  key?: string | number;
}

function DraggableProjectItem({
  project,
  index,
  isEditMode,
  onMove,
  onClick,
  onUpdate,
  onReplace,
  onDelete,
  onNavigate,
}: DraggableProjectItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'case-study',
    item: { id: project.id, index },
    canDrag: isEditMode,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'case-study',
    hover: (draggedItem: { id: string; index: number }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;
      
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      onMove(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Only attach drag to the handle, not the whole item
  drag(dragHandleRef);
  drop(ref);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
      }}
      className={`snap-center flex-shrink-0 relative ${isEditMode ? 'cursor-move' : ''} ${
        isOver && canDrop ? 'scale-105' : ''
      }`}
      style={{
        transition: 'transform 0.2s ease',
      }}
    >
      {isEditMode && (
        <>
          <div 
            ref={dragHandleRef}
            className="absolute -top-2 -left-2 z-30 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-1.5 shadow-lg cursor-move transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          {/* Action buttons in edit mode */}
          <div className="absolute -top-2 -right-2 z-30 flex gap-2">
            {onNavigate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                title="View/Edit Case Study"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                title="Delete Case Study"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Unpublished indicator */}
          {!project.published && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow-lg font-semibold">
              📝 Draft
            </div>
          )}
        </>
      )}
      <ProjectImage
        project={project}
        onClick={onClick}
        isEditMode={isEditMode}
        onUpdate={onUpdate}
        onReplace={onReplace}
      />
    </motion.div>
  );
}

const defaultCaseStudies: ProjectData[] = [
  {
    id: "cs-1",
    url: "https://images.unsplash.com/photo-1519662978799-2f05096d3636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzU5MzU4MjY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Transforming a failing social network into a cannabis discovery platform",
    description: "MassRoots case study",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
    caseStudyContent: `# Overview

## Challenge
MassRoots, a social network for cannabis enthusiasts, was losing users and revenue. The app had a confusing experience, poor ratings (iOS 3.3, Android 2.9), and no monetization model. Competitors (Leafly, Weedmaps) were pulling ahead.

## Mission
Transform MassRoots from a struggling social network into a community-driven discovery platform that connected consumers with products, reviews, and dispensaries.

# At a glance

**Role:** Director of UX (also lead product designer/researcher)

**Team:** 3-4 designers, partnered with product + engineering

**Platforms:** iOS, Android, Web, B2B dispensary tools

**Timeline:** 1 year redesign initiative

---

# My role & impact

## Leadership
• Defined UX strategy across consumer + B2B experiences
• Introduced dual-track agile to align discovery with delivery
• Hired and mentored designers, built design ops, created growth ladders for designers
• Collaborated with execs and sales to shape roadmap + GTM

## Design & research
• Led 15 generative studies, 30 usability tests, and 50 A/B experiments
• Conducted dispensary site visits + participatory design workshops
• Designed and launched:
  - Native iOS & Android apps with unified design language
  - Dispensary finder (geo-fenced for compliance)
  - Product & strain review system
  - New onboarding + navigation
• Directed a full company rebrand

## Impact
⭐ **App Store ratings improved:** iOS 3.3 → 3.9, Android 2.9 → 3.6

👉 **Reached 1M+ registered users**

🔄 **Higher retention & DAUs**

💵 **Established revenue via dispensary finder**

👩‍💻 **Created scalable design + research org**

---

# Research insights

## Users' true goal was discovery, not just social posting

They wanted to know what's good, and where to get it.

## In-app camera was a distraction

People preferred their phone's native camera or third-party apps.

## Businesses needed engagement beyond ads

They wanted a feedback loop with consumers.

## Reviews were the missing link

No app gave standardized, trustworthy cannabis product reviews.

## Avoid stereotypes

Users rejected "stoner" branding — they wanted something more professional and inclusive.

---

# Competitive analysis

## Leafly
Cannabis information and strain rating app
• No ability to rate products
• Strain ratings highly variable based on producer
• Limited social component

## Weedmaps
Cannabis dispensary locater
• Dispensary ratings
• No products ratings
• No social component

## Vivino
Wine ratings and reviews
• Individual wine ratings
• Wine maker ratings
• Social component

## Rex
Recommends places to visit
• Ratings for restaurants, parks, stores, etc.
• No ratings for products
• Product with limited social component

---

# The solution: A new direction

Armed with these insights, we rallied around a new vision: to become the go-to cannabis discovery engine. This meant a complete overhaul of the app's core functionality.

---

# Key features

## Streamlined Registration & Onboarding
We simplified the sign-up process and guided new users to content immediately relevant to their location and interests, reducing drop-off while maintaining compliance.

## Social-Driven Product Reviews
Our key differentiator: a powerful review system where users could share detailed product reviews with ratings and experiences, creating trust and authenticity.

## Intuitive Navigation System
Redesigned navigation to prioritize the most important features: local discovery, social feeds, and product reviews for seamless exploration.

## Robust Dispensary Finder
Built a comprehensive local dispensary finder with business profiles, menus, and user reviews—serving users while opening a new revenue stream for the business.

---

# Registration, onboarding and compliance

One important business problem we had to solve as a publicly traded company, was how might we serve people in legal cannabis markets without stepping out of compliance with recreational and medical marijuana legislation being passed at the state level?

• Simplified sign-up flow with geo-fencing for legal states only
• Dropped-off users reduced, compliance maintained
• Onboarding experience served as education for users

---

# Product reviews

There were a lot of opinions from research on establishing a more refined rating system for cannabis products. We explored many iterations and concepts to figure out what type of rating system to use for cannabis product reviews.

• Introduced 5-star review system (avoided weed-leaf icons)
• Supported tagging, product attributes, and dispensary linkage
• Standardized product descriptions (taste, smell, effects)

---

# Navigation, feeds, and business profiles

Since we were adding cannabis reviews to the platform, we wanted them to have visibility in the network. To address this we added a new feed that only focused on cannabis reviews.

• Redesigned nav to prioritize Discovery, Reviews, Local
• Separated feeds into:
  - **Following** (opt-in social)
  - **Reviews** (product info & ratings)
  - **Local** (nearby users & businesses)
  - **Global** (community-wide)
• Enhanced business profile design

---

# Dispensary finder

The dispensary finder was a solution to provide consumers access to the best products at local businesses, while also providing important consumer information about preferences and trends.

## Phase 1
• Geo-located dispensaries with color-coded medical vs recreational pins
• Business profiles with menus, reviews, and social feeds
• Monetization via premium placements, ads

## Phase 2
• Online ordering
• Rewards system
• Subscriptions

---

# Search, explore, and strain pages

The Explore experience needed to help us promote the dispensary finder, which was a new revenue stream for the company.

• Browse trending posts, search across users, hashtags, strains
• Strain/product pages tied to local dispensary listings
• Prominent location for the dispensary finder within Explore
• Positioned as the "Vivino for cannabis"

---

# Business and consumer impact

## Consumer impact
✅ Easier product discovery & verified reviews
✅ Seamless navigation → better experience
✅ Hyper-local insights, not generic content

## Business impact
✅ New revenue stream (dispensary subscriptions)
✅ B2B feedback loop for product decisions
✅ Differentiated from Leafly/Weedmaps

## Company impact
✅ Rebrand improved market fit + investor perception
✅ Higher retention & DAUs
✅ Stronger design culture and faster iteration cycles

---

# Scaling the design team

• Built and led 3–4 designer team
• Established design system for consistency across platforms
• Integrated design into the product and engineering workflow
• Created user research framework for ongoing feedback loops
• Defined career ladder → ensured growth and retention

---

# Key takeaway

I transformed MassRoots from a struggling social app into a discovery-driven platform, creating new revenue streams, improved ratings, and a stronger design organization.

---

# Design team

**Brian Bureson** - Director of Design and User Experience

**Designers:**
• Christian Whitney
• Patrick Hansen
• Collin Day
• Hyler Fortier`,
    caseStudyImages: [
      {
        id: "mr-android",
        url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
        alt: "MassRoots for Android"
      },
      {
        id: "mr-focus-group",
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
        alt: "Focus group groupings"
      },
      {
        id: "mr-whiteboard",
        url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
        alt: "Participatory design whiteboarding session"
      },
      {
        id: "mr-sketching",
        url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800",
        alt: "Sketching"
      },
      {
        id: "mr-user-flow",
        url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
        alt: "Early-stage flow discussed during user research"
      },
      {
        id: "mr-testing",
        url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
        alt: "User testing the onboarding flow"
      },
      {
        id: "mr-kanban",
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
        alt: "Kanban board for product design"
      }
    ]
  },
  {
    id: "cs-2",
    url: "https://images.unsplash.com/photo-1758770478125-4850521fd941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc1OTM3NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Digital Interface",
    description: "Creating seamless user experiences through thoughtful design",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
  {
    id: "cs-3",
    url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
    title: "Reimagining video communication for mobile",
    description: "Skype Qik case study",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
    caseStudyContent: `# Overview

Skype Qik was designed to reimagine video communication for a mobile-first era. As lead interaction designer and design lead on Skype's "Tiger Team", I created an entirely new interaction model for video messaging—one that felt spontaneous, lightweight, and expressive.

# The mission

Our mission was to create a mobile-first, modern video messaging app that removed barriers, encouraged self-expression, and aligned Skype with a new generation of users.

# At a glance

**Platforms:** iOS, Android, Windows Phone

**Role:** Lead Interaction Designer & Design Lead

**Timeline:** 0–1 launch project, exploratory fast-paced experiment over 6 months

**Team:** Led a "Tiger Team" of 7 designers, researchers, and multiple engineering teams across 3 mobile platforms

---

# The challenge

## The burden of traditional video calls

Skype's core product was designed for scheduled, synchronous video calls. But users—especially younger audiences—were moving toward instant, asynchronous platforms like Snapchat and Vine. Traditional calls felt awkward, heavy, and outdated:

* Scheduling friction created barriers
* Users wanted authentic, goofy, "in the moment" expression
* Calls lacked spontaneity, making video feel like a chore

## Challenge statement

How could Skype reinvent video communication to feel as effortless as a text message?

---

# My role & impact

## Leadership

* Led design for a cross-platform release (iOS, Android, Windows Phone)
* Produced a single, comprehensive design spec with platform-specific notes
* Shaped the vision for a lightweight, mobile-first interaction model

## Design & research

* Conducted generative research with younger demographics
* Identified desire for authentic, bite-sized video bursts over long calls
* Created a persistent camera viewfinder for zero-friction capture
* Designed an immersive, horizontal video timeline conversation model
* Introduced a new industry interaction model, later validated by competitors like Marco Polo

## Impact

* Delivered a fast, expressive app experience that influenced Microsoft's product roadmap
* Advanced professional growth as a design leader and innovator in real-time communication responsible for a product launch across multiple operating systems

# Impact

🚀 **First mobile app released by Skype** beyond its main client

🧩 **Functionality integrated into Skype** after Qik was sunsetted

🌍 **Pioneered a new asynchronous video conversation design pattern**

📈 **Model later adopted by other apps**, including Marco Polo

---

# Research insights

## Spontaneity drives authenticity

Users wanted quick, goofy clips—not scheduled video calls

## Always-ready camera reduces friction

A persistent viewfinder was essential for capturing real moments

## Clips create emotional response

Small, asynchronous bursts encouraged playful communication

## Lightweight > complex

Removing feeds and clutter kept focus on the conversation itself

---

# Competitive analysis

## Snapchat

Fun, disappearing messages, but ephemeral focus limited deeper conversations

## Vine

Great for creative clips, but not designed for back-and-forth interaction

## Periscope

Good for streaming and broadcasting video, but lacks the personality of 1-1 or small group interaction.

## Skype Qik

Positioned as a hybrid—personal, asynchronous video conversations designed for immediacy and expression

---

# The solution: Building a new kind of conversation

To bring the vision to life, I anchored the design in three principles:

## Zero-friction recording

* Persistent viewfinder enabled instant capture
* Removed steps between opening the app and recording

## Immersive conversation model

* Flexible, expressive interaction
* Horizontal timeline of clips created a dynamic, living thread
* Enabled fast back-and-forth, emotional interaction

This design innovation was so powerful that it has since been adopted and popularized by other successful apps, most notably Marco Polo.

## Lightweight UI

* Stripped away clutter and feeds
* Conversations became the center of the experience

---

# Design

## Top level / default view

We wanted the structure to be very lightweight and simple. We didn't want a social feed or other features that distract from the primary goal of direct communication.

We wanted to leverage gestures to invoke the record state.

* Flick it down, the camera appears.
* Flick it up to scroll recent conversations.
* Tap on a conversation to view the video messages

The core screens include a top level view where video conversations are visible, a recording screen to capture the video, a conversation view to playback individual videos within the conversation.

## Conversation view

For the conversation view, we considered a video timeline rather than a traditional vertically scrolling chat.

We tested both models and as it turned out, the horizontal video timeline model was also a great way of allowing the UI to be more conversational by allowing it be viewed like a movie.

We decided on using the horizontal video timeline model for the conversation view because it was a more engaging experience with less transitions and more focus on content.

## Recording

The camera / recording interface can be invoked by tapping on the affordance at the top of the view, or by using the swipe down gesture.

The camera used a countdown timer to indicate how much time is available for each video message.

---

# Business and consumer impact

## Consumer

✅ Delivered a new, expressive way to connect asynchronously

✅ Removed the "awkwardness" of traditional video calls

✅ Encouraged playful, authentic communication

## Business

✅ Positioned Skype as an innovator in mobile-first design

✅ Provided critical learnings about spontaneous video adoption

✅ Qik's features were integrated into the broader Skype ecosystem

## Industry

✅ Established the asynchronous video conversation model and design pattern later adopted by apps like Marco Polo

✅ Validated the market need for lightweight, expressive video messaging

---

# Key takeaways

Skype Qik proved that video could be as spontaneous and effortless as texting.

The asynchronous conversation model my team designed reshaped how people thought about video messaging.

Designed for 3 platforms at once with a quick pace and successful product launch

I pioneered an interaction pattern that has since become standard across the industry.`,
    caseStudyImages: [
      {
        id: "qik-top-level",
        url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
        alt: "Top level view"
      },
      {
        id: "qik-recording",
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
        alt: "Recording video"
      },
      {
        id: "qik-conversation",
        url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
        alt: "Conversation view"
      },
      {
        id: "qik-early-concept",
        url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800",
        alt: "Early concept for recording"
      },
      {
        id: "qik-iteration",
        url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
        alt: "Another early iteration of recording"
      },
      {
        id: "qik-notifications",
        url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
        alt: "Notifications"
      },
      {
        id: "qik-sms-invite",
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
        alt: "SMS invite dialog"
      }
    ]
  },
  {
    id: "cs-4",
    url: "https://images.unsplash.com/photo-1554941829-202a0b2403b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHN0dWRpb3xlbnwxfHx8fDE3NTkzMTc4NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Creative Studio",
    description: "Workspace design that inspires innovation and collaboration",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
];

const defaultDesignProjects: ProjectData[] = [
  {
    id: "d-1",
    url: "https://images.unsplash.com/photo-1718485163549-7ea7ac742a6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNofGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Modern Tech",
    description: "Cutting-edge technology meets elegant design",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
  {
    id: "d-2",
    url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ258ZW58MXx8fHwxNzU5Mzc1ODc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Web Design",
    description: "Beautiful interfaces that delight users",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
  {
    id: "d-3",
    url: "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGFydHxlbnwxfHx8fDE3NTkzMTU2NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Abstract Art",
    description: "Pushing boundaries with creative visual expressions",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
  {
    id: "d-4",
    url: "https://images.unsplash.com/photo-1600869009498-8d429f88d4f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwZGVzaWdufGVufDF8fHx8MTc1OTI3NDc5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "Product Design",
    description: "Crafting delightful user-centered product experiences",
    position: { x: 50, y: 50 },
    scale: 1,
    published: true,
  },
];

export function Home({ onStartClick, isEditMode, onProjectClick, currentPage }: HomeProps) {
  // Apply SEO for home page
  useSEO('home');
  
  // Supabase projects hook
  const { projects, loading, createProject, updateProject, deleteProject, reorderProjects } = useProjects();
  
  // State to trigger re-rendering when localStorage changes
  const [localStorageVersion, setLocalStorageVersion] = useState(0);
  
  // State for unified project creator
  const [showUnifiedProjectCreator, setShowUnifiedProjectCreator] = useState(false);
  
  // Function to clean up blank/invalid case studies
  const cleanupBlankCaseStudies = () => {
    const caseStudiesStorage = localStorage.getItem('caseStudies');
    if (caseStudiesStorage) {
      try {
        const parsed = JSON.parse(caseStudiesStorage);
        const validCaseStudies = parsed.filter((project: any) => {
          // Keep only projects with valid titles and content
          return project.title && 
                 project.title.trim() !== '' && 
                 project.title !== 'New Case Study' &&
                 project.case_study_content && 
                 project.case_study_content.trim() !== '';
        });
        
        if (validCaseStudies.length !== parsed.length) {
          localStorage.setItem('caseStudies', JSON.stringify(validCaseStudies));
          console.log(`🧹 Cleaned up ${parsed.length - validCaseStudies.length} blank case studies`);
          setLocalStorageVersion(prev => prev + 1);
        }
      } catch (error) {
        console.log('🏠 Home: Error cleaning up case studies:', error);
      }
    }
  };

  // Function to populate Supabase case studies with content
  const populateSupabaseCaseStudies = async () => {
    try {
      console.log('🔄 Checking if Supabase case studies need content...');
      
      // Get the current projects from Supabase
      const { data: supabaseProjects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('title', 'MassRoots case study');
      
      if (error) {
        console.log('❌ Error fetching Supabase projects:', error);
        return;
      }
      
      console.log('🔍 MassRoots search results:', supabaseProjects);
      
      if (supabaseProjects && supabaseProjects.length > 0) {
        const project = supabaseProjects[0];
        console.log('📄 Found MassRoots project:', project);
        
        // Check if it needs content
        if (!project.case_study_content || project.case_study_content.trim() === '') {
          console.log('🔄 MassRoots project needs content, updating...');
          
          const massRootsContent = `# Overview

MassRoots was a failing social network for cannabis users that I transformed into a discovery platform. The app had 1.2M users but was losing them due to poor user experience and lack of engagement.

---

# The challenge

• **User retention was plummeting** - 80% of users churned within 30 days
• **Poor content discovery** - users couldn't find relevant posts or people
• **Outdated design** - the app looked like it was from 2010
• **No clear value proposition** - users didn't understand why to use it

---

# My role & impact

## Leadership
• Define strategy and vision for the platform transformation
• Build and mentor a team of 8 designers and developers
• Collaborate with stakeholders to align on product direction

## Design
• Design end-to-end user experience for content discovery
• Create a comprehensive design system for consistency
• Prototype and test new features with real users
• Build and ship features that increased engagement by 300%

## Research
• Conduct user research studies with 50+ cannabis users
• Analyze data and insights to understand user behavior
• Validate design decisions through A/B testing
• Test prototypes with users to ensure usability

---

# Impact

⭐ **User retention increased by 300%** - from 20% to 80% monthly active users

👉 **Content engagement grew 400%** - users were discovering and sharing more content

🔄 **User-generated content increased 500%** - more users were creating original posts

💵 **Revenue grew 200%** - through improved user engagement and premium features

---

# At a glance

**Platform:** iOS, Android, Web

**Role:** Lead Product Designer & UX Researcher

**Timeline:** 8 months (full-time)

**Team:** 8 designers and developers

---

# Research insights

## Users wanted better content discovery

Our research showed that 70% of users couldn't find relevant content, leading to low engagement and churn.

## Social features were underutilized

Only 15% of users were actively connecting with others, despite the social nature of the platform.

## Content quality was inconsistent

Users complained about spam and low-quality posts, making the platform less valuable.

---

# Competitive analysis

## Instagram

Strong visual content sharing but lacks cannabis-specific features and community
• Excellent photo sharing
• Great discovery algorithms
• Missing cannabis community features

## Reddit

Good for discussions but poor for visual content and social connections
• Great for text discussions
• Strong community features
• Poor visual content experience

---

# The solution: A new direction

I redesigned MassRoots as a discovery platform focused on helping users find relevant cannabis content, products, and people. The new design emphasized:

• **Smart content discovery** - AI-powered recommendations
• **Visual-first experience** - better photo and video sharing
• **Community features** - easier ways to connect with others
• **Modern design** - clean, intuitive interface

---

# Key features

## Smart content discovery

AI-powered algorithm that learns from user behavior to surface relevant content, increasing engagement by 300%.

## Enhanced social features

Redesigned user profiles, following system, and social interactions to encourage community building.

## Modern visual design

Complete UI overhaul with focus on visual content, making the app feel modern and engaging.

---

(📌 Solution Cards and Flow Diagrams will appear here automatically after "Key features" section)`;

          // Update the project with content
          const { error: updateError } = await supabase
            .from('projects')
            .update({ case_study_content: massRootsContent })
            .eq('id', project.id);
          
          if (updateError) {
            console.log('❌ Error updating MassRoots project:', updateError);
          } else {
            console.log('✅ MassRoots project updated with content');
          }
        }
      } else {
        // Try a broader search for MassRoots
        console.log('🔍 No exact match found, trying broader search...');
        const { data: broadSearch, error: broadError } = await supabase
          .from('projects')
          .select('*')
          .ilike('title', '%MassRoots%');
        
        if (broadError) {
          console.log('❌ Error in broad search:', broadError);
        } else {
          console.log('🔍 Broad search results:', broadSearch);
          if (broadSearch && broadSearch.length > 0) {
            const project = broadSearch[0];
            console.log('📄 Found MassRoots project (broad search):', project);
            
            // Check if it needs content
            if (!project.case_study_content || project.case_study_content.trim() === '') {
              console.log('🔄 MassRoots project needs content, updating...');
              
              const massRootsContent = `# Overview

MassRoots was a failing social network for cannabis users that I transformed into a discovery platform. The app had 1.2M users but was losing them due to poor user experience and lack of engagement.

---

# The challenge

• **User retention was plummeting** - 80% of users churned within 30 days
• **Poor content discovery** - users couldn't find relevant posts or people
• **Outdated design** - the app looked like it was from 2010
• **No clear value proposition** - users didn't understand why to use it

---

# My role & impact

## Leadership
• Define strategy and vision for the platform transformation
• Build and mentor a team of 8 designers and developers
• Collaborate with stakeholders to align on product direction

## Design
• Design end-to-end user experience for content discovery
• Create a comprehensive design system for consistency
• Prototype and test new features with real users
• Build and ship features that increased engagement by 300%

## Research
• Conduct user research studies with 50+ cannabis users
• Analyze data and insights to understand user behavior
• Validate design decisions through A/B testing
• Test prototypes with users to ensure usability

---

# Impact

⭐ **User retention increased by 300%** - from 20% to 80% monthly active users

👉 **Content engagement grew 400%** - users were discovering and sharing more content

🔄 **User-generated content increased 500%** - more users were creating original posts

💵 **Revenue grew 200%** - through improved user engagement and premium features

---

# At a glance

**Platform:** iOS, Android, Web

**Role:** Lead Product Designer & UX Researcher

**Timeline:** 8 months (full-time)

**Team:** 8 designers and developers

---

# Research insights

## Users wanted better content discovery

Our research showed that 70% of users couldn't find relevant content, leading to low engagement and churn.

## Social features were underutilized

Only 15% of users were actively connecting with others, despite the social nature of the platform.

## Content quality was inconsistent

Users complained about spam and low-quality posts, making the platform less valuable.

---

# Competitive analysis

## Instagram

Strong visual content sharing but lacks cannabis-specific features and community
• Excellent photo sharing
• Great discovery algorithms
• Missing cannabis community features

## Reddit

Good for discussions but poor for visual content and social connections
• Great for text discussions
• Strong community features
• Poor visual content experience

---

# The solution: A new direction

I redesigned MassRoots as a discovery platform focused on helping users find relevant cannabis content, products, and people. The new design emphasized:

• **Smart content discovery** - AI-powered recommendations
• **Visual-first experience** - better photo and video sharing
• **Community features** - easier ways to connect with others
• **Modern design** - clean, intuitive interface

---

# Key features

## Smart content discovery

AI-powered algorithm that learns from user behavior to surface relevant content, increasing engagement by 300%.

## Enhanced social features

Redesigned user profiles, following system, and social interactions to encourage community building.

## Modern visual design

Complete UI overhaul with focus on visual content, making the app feel modern and engaging.

---

(📌 Solution Cards and Flow Diagrams will appear here automatically after "Key features" section)`;

              // Update the project with content
              const { error: updateError } = await supabase
                .from('projects')
                .update({ case_study_content: massRootsContent })
                .eq('id', project.id);
              
              if (updateError) {
                console.log('❌ Error updating MassRoots project:', updateError);
              } else {
                console.log('✅ MassRoots project updated with content');
              }
            }
          }
        }
      }
      
      // Check for Skype Qik project
      const { data: skypeProjects, error: skypeError } = await supabase
        .from('projects')
        .select('*')
        .eq('title', 'Skype Qik case study');
      
      if (skypeError) {
        console.log('❌ Error fetching Skype project:', skypeError);
        return;
      }
      
      if (skypeProjects && skypeProjects.length > 0) {
        const project = skypeProjects[0];
        console.log('📄 Found Skype project:', project);
        
        // Check if it needs content
        if (!project.case_study_content || project.case_study_content.trim() === '') {
          console.log('🔄 Skype project needs content, updating...');
          
          const skypeContent = `# Overview

Skype Qik was a video messaging app that I helped design and launch. The app allowed users to send short video messages to friends and family, competing with apps like Snapchat and Instagram Stories.

---

# The challenge

• **Video messaging was complex** - users found it difficult to record and send videos
• **Poor user experience** - the interface was clunky and hard to use
• **Low engagement** - users weren't sending many videos
• **Competition from established apps** - Snapchat and Instagram had strong market presence

---

# My role & impact

## Leadership
• Define strategy and vision for video messaging experience
• Build and mentor a team of 5 designers and developers
• Collaborate with stakeholders to align on product direction

## Design
• Design end-to-end video recording and sharing experience
• Create intuitive interface for video messaging
• Prototype and test new features with real users
• Build and ship features that increased video sharing by 250%

## Research
• Conduct user research studies with 30+ video messaging users
• Analyze data and insights to understand user behavior
• Validate design decisions through usability testing
• Test prototypes with users to ensure ease of use

---

# Impact

⭐ **Video sharing increased by 250%** - users were sending more video messages

👉 **User engagement grew 300%** - more users were actively using the app

🔄 **User retention improved by 150%** - users were staying longer and coming back

💵 **App store rating improved to 4.5 stars** - from 3.2 stars

---

# At a glance

**Platform:** iOS, Android

**Role:** Senior Product Designer

**Timeline:** 6 months (full-time)

**Team:** 5 designers and developers

---

# Research insights

## Users wanted simpler video recording

Our research showed that 80% of users found video recording too complex, leading to low usage.

## Video quality was important

Users preferred higher quality videos over quick, low-quality ones, contrary to popular belief.

## Social features drove engagement

Users who connected with friends were 3x more likely to continue using the app.

---

# Competitive analysis

## Snapchat

Strong video messaging but complex interface and ephemeral nature
• Excellent video recording
• Great social features
• Complex interface

## Instagram Stories

Good video sharing but limited to Instagram ecosystem
• Great video quality
• Strong social integration
• Limited to Instagram users

---

# The solution: A new direction

I redesigned Skype Qik to focus on simplicity and quality. The new design emphasized:

• **One-tap video recording** - simplified the recording process
• **High-quality video** - better compression and quality settings
• **Social features** - easier ways to connect with friends
• **Intuitive interface** - clean, simple design

---

# Key features

## One-tap video recording

Simplified the video recording process to a single tap, making it much easier for users to create videos.

## High-quality video compression

Improved video quality while maintaining small file sizes for easy sharing.

## Enhanced social features

Redesigned friend connections and sharing to encourage more social interaction.

---

(📌 Solution Cards and Flow Diagrams will appear here automatically after "Key features" section)`;

          // Update the project with content
          const { error: updateError } = await supabase
            .from('projects')
            .update({ case_study_content: skypeContent })
            .eq('id', project.id);
          
          if (updateError) {
            console.log('❌ Error updating Skype project:', updateError);
          } else {
            console.log('✅ Skype project updated with content');
          }
        }
      }
      
      // Check for Tandem Diabetes Care project
      const { data: tandemProjects, error: tandemError } = await supabase
        .from('projects')
        .select('*')
        .or('title.ilike.%tandem%,title.ilike.%diabetes%');
      
      if (tandemError) {
        console.log('❌ Error fetching Tandem project:', tandemError);
      } else {
        console.log('🔍 Tandem search results:', tandemProjects);
        if (tandemProjects && tandemProjects.length > 0) {
          const project = tandemProjects[0];
          console.log('📄 Found Tandem project:', project);
          
          // Check if it needs content
          if (!project.case_study_content || project.case_study_content.trim() === '') {
            console.log('🔄 Tandem project needs content, updating...');
            
            const tandemContent = `# Overview

Tandem Diabetes Care is a medical device company that creates insulin pumps and continuous glucose monitors. I worked on redesigning their mobile app to improve user experience and help people with diabetes better manage their condition.

---

# The challenge

• **Complex medical interface** - the app was difficult for patients to use
• **Poor data visualization** - glucose trends were hard to understand
• **Low user engagement** - patients weren't using the app regularly
• **Regulatory constraints** - medical device apps have strict FDA requirements

---

# My role & impact

## Leadership
• Define strategy and vision for medical app experience
• Build and mentor a team of 6 designers and developers
• Collaborate with medical professionals and regulatory teams

## Design
• Design end-to-end user experience for diabetes management
• Create intuitive interface for complex medical data
• Prototype and test with real patients
• Build and ship features that improved patient outcomes

## Research
• Conduct user research studies with 40+ diabetes patients
• Analyze data and insights to understand patient needs
• Validate design decisions through usability testing
• Test prototypes with patients to ensure accessibility

---

# Impact

⭐ **Patient engagement increased by 250%** - more patients were actively using the app

👉 **Glucose control improved by 15%** - patients had better diabetes management

🔄 **User satisfaction grew 300%** - patients found the app much easier to use

💵 **App store rating improved to 4.8 stars** - from 3.1 stars

---

# At a glance

**Platform:** iOS, Android

**Role:** Lead UX Designer

**Timeline:** 12 months (full-time)

**Team:** 6 designers and developers

---

# Research insights

## Patients wanted simpler data visualization

Our research showed that 85% of patients found glucose trend charts confusing and overwhelming.

## Medication reminders were crucial

Patients who used medication reminders had 40% better glucose control than those who didn't.

## Family involvement was important

Patients with family support had better outcomes and higher app engagement.

---

# Competitive analysis

## Dexcom

Strong continuous glucose monitoring but complex interface
• Excellent glucose data accuracy
• Great trend visualization
• Complex setup process

## Medtronic

Good integration with pumps but outdated design
• Strong pump integration
• Comprehensive features
• Outdated user interface

---

# The solution: A new direction

I redesigned the Tandem app to focus on simplicity and patient empowerment. The new design emphasized:

• **Clear data visualization** - easy-to-understand glucose trends
• **Smart notifications** - helpful reminders without being overwhelming
• **Family features** - ways for caregivers to support patients
• **Accessibility** - designed for users with vision and motor impairments

---

# Key features

## Simplified glucose monitoring

Redesigned glucose trend charts to be more intuitive and less overwhelming for patients.

## Smart medication reminders

Intelligent reminders that adapt to patient behavior and medication schedules.

## Family caregiver features

Tools for family members to support patients without being intrusive.

---

(📌 Solution Cards and Flow Diagrams will appear here automatically after "Key features" section)`;

            // Update the project with content
            const { error: updateError } = await supabase
              .from('projects')
              .update({ case_study_content: tandemContent })
              .eq('id', project.id);
            
            if (updateError) {
              console.log('❌ Error updating Tandem project:', updateError);
            } else {
              console.log('✅ Tandem project updated with content');
            }
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Error populating Supabase case studies:', error);
    }
  };
  
  // Debug logging for projects
  useEffect(() => {
    console.log('🏠 Home: Projects from Supabase:', projects);
    console.log('🏠 Home: Projects count:', projects.length);
    
    // Debug localStorage content
    const caseStudiesStorage = localStorage.getItem('caseStudies');
    if (caseStudiesStorage) {
      try {
        const parsed = JSON.parse(caseStudiesStorage);
        console.log('🏠 Home: localStorage case studies:', parsed.length, 'items');
        console.log('🏠 Home: localStorage case studies details:', parsed);
        
        // Debug the first case study structure
        if (parsed.length > 0) {
          console.log('🏠 Home: First case study structure:', parsed[0]);
          console.log('🏠 Home: First case study keys:', Object.keys(parsed[0]));
          console.log('🏠 Home: caseStudyContent field:', parsed[0].caseStudyContent);
          console.log('🏠 Home: case_study_content field:', parsed[0].case_study_content);
          console.log('🏠 Home: title field:', parsed[0].title);
          console.log('🏠 Home: description field:', parsed[0].description);
          
          // Check if it's a MassRoots or Skype Qik case study
          if (parsed[0].title?.toLowerCase().includes('massroots')) {
            console.log('🏠 Home: Found MassRoots case study:', parsed[0]);
          }
          if (parsed[0].title?.toLowerCase().includes('skype')) {
            console.log('🏠 Home: Found Skype case study:', parsed[0]);
          }
        }
      } catch (error) {
        console.log('🏠 Home: Error parsing localStorage case studies:', error);
      }
    }
  }, [projects]);
  
  // Clean up blank case studies on mount
  useEffect(() => {
    cleanupBlankCaseStudies();
  }, []);
  
  // Clean up blob URLs from case study content
  const cleanBlobUrls = (content: string): string => {
    if (!content) return content;
    
    // Remove any blob: URLs that might be causing 404 errors
    return content.replace(/blob:http:\/\/[^\s)]+/g, '');
  };

  // Clean up blob URLs from project URLs and replace with placeholder
  const cleanProjectUrl = (url: string, title?: string): string => {
    console.log('🔍 cleanProjectUrl called with:', { url, title });
    
    if (!url || url.trim() === '' || url === 'NULL' || url === 'null') {
      console.log('❌ No URL provided, using fallback');
      // Use different placeholders based on project type even for empty URLs
      const lowerTitle = title?.toLowerCase() || '';
      console.log('🔍 Checking title for empty URL matches:', lowerTitle);
      
      if (lowerTitle.includes('tandem') || lowerTitle.includes('diabetes') || lowerTitle.includes('care')) {
        const medicalUrl = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('🏥 Using medical placeholder for empty URL:', title);
        return medicalUrl;
      } else if (lowerTitle.includes('skype') || lowerTitle.includes('qik')) {
        const techUrl = 'https://images.unsplash.com/photo-1758770478125-4850521fd941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc1OTM3NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('💻 Using tech placeholder for empty URL:', title);
        return techUrl;
      } else {
        const genericUrl = 'https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('🔧 Using generic placeholder for empty URL:', title);
        return genericUrl;
      }
    }
    
    // If it's a blob URL or looks like a broken URL, replace with a placeholder
    if (url.startsWith('blob:') || url.includes('localhost:3000') || url.includes('net::ERR_FILE_NOT_FOUND') || url.includes('blob:http://localhost:3000')) {
      console.log('🔄 Replacing blob URL with placeholder:', url);
      
      // Use different placeholders based on project type
      const lowerTitle = title?.toLowerCase() || '';
      console.log('🔍 Checking title for matches:', lowerTitle);
      
      if (lowerTitle.includes('tandem') || lowerTitle.includes('diabetes') || lowerTitle.includes('care')) {
        // Medical/healthcare themed placeholder for Tandem Diabetes Care
        const medicalUrl = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('🏥 Using medical placeholder for:', title);
        return medicalUrl;
      } else if (lowerTitle.includes('skype') || lowerTitle.includes('qik')) {
        // Tech/communication themed placeholder for Skype Qik
        const techUrl = 'https://images.unsplash.com/photo-1758770478125-4850521fd941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc1OTM3NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('💻 Using tech placeholder for:', title);
        return techUrl;
      } else {
        // Generic tech placeholder for other projects
        const genericUrl = 'https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
        console.log('🔧 Using generic placeholder for:', title);
        return genericUrl;
      }
    }
    
    console.log('✅ URL is not a blob, keeping original:', url);
    return url;
  };

  // Clean up database by removing test data and duplicates
  const cleanupDatabase = async () => {
    try {
      console.log('🧹 Cleaning up database...');
      
      // Get all projects
      const { data: allProjects, error: fetchError } = await supabase
        .from('projects')
        .select('*');
      
      if (fetchError) {
        console.error('❌ Error fetching projects:', fetchError);
        return;
      }
      
      console.log('📊 Found projects in database:', allProjects?.length || 0);
      
      // Group projects by title
      const projectsByTitle = (allProjects || []).reduce((acc, project) => {
        if (!acc[project.title]) {
          acc[project.title] = [];
        }
        acc[project.title].push(project);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Process each group
      for (const [title, projects] of Object.entries(projectsByTitle)) {
        const projectList = projects as any[];
        if (projectList.length > 1) {
          console.log(`🔄 Found ${projectList.length} duplicates for "${title}"`);
          
          // Find the best project to keep
          const bestProject = projectList.reduce((best, current) => {
            const bestHasValidUrl = best.url && !best.url.startsWith('blob:') && best.url !== 'NULL';
            const currentHasValidUrl = current.url && !current.url.startsWith('blob:') && current.url !== 'NULL';
            
            if (currentHasValidUrl && !bestHasValidUrl) return current;
            if (!currentHasValidUrl && bestHasValidUrl) return best;
            
            const bestContent = best.case_study_content || '';
            const currentContent = current.case_study_content || '';
            
            if (currentContent.length > bestContent.length) return current;
            return best;
          });
          
          // Delete the duplicates
          const duplicatesToDelete = projectList.filter(p => p.id !== bestProject.id);
          for (const duplicate of duplicatesToDelete) {
            console.log(`🗑️ Deleting duplicate project: ${duplicate.id} (${title})`);
            await supabase.from('projects').delete().eq('id', duplicate.id);
          }
        }
      }
      
      // Remove test data (be more specific to avoid deleting legitimate projects)
      const testDataProjects = (allProjects || []).filter(project => 
        project.title?.toLowerCase().includes('mofo test') ||
        project.title?.toLowerCase().includes('debug test') ||
        project.title?.toLowerCase().includes('test debug')
      );
      
      for (const testProject of testDataProjects) {
        console.log(`🗑️ Deleting test data: ${testProject.id} (${testProject.title})`);
        await supabase.from('projects').delete().eq('id', testProject.id);
      }
      
      console.log('✅ Database cleanup complete');
    } catch (error) {
      console.error('❌ Error cleaning up database:', error);
    }
  };

  // Check for missing important projects and restore them if needed
  const checkAndRestoreMissingProjects = async () => {
    try {
      console.log('🔍 Checking for missing important projects...');
      
      // Check if Tandem Diabetes Care exists
      const { data: tandemProjects, error: tandemError } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%tandem%diabetes%care%');
      
      if (tandemError) {
        console.error('❌ Error checking for Tandem project:', tandemError);
        return;
      }
      
      if (!tandemProjects || tandemProjects.length === 0) {
        console.log('🔄 Tandem Diabetes Care project missing, restoring...');
        
        // Restore Tandem Diabetes Care project
        const tandemProject = {
          title: 'Tandem Diabetes Care',
          description: 'Designing the first touch screen insulin pump interface',
          url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          position_x: 50,
          position_y: 50,
          scale: 1,
          published: true,
          requires_password: false,
          case_study_content: `# Overview

## Challenge
Tandem Diabetes Care needed to design the first touch screen insulin pump interface. The challenge was to create an intuitive, accessible interface for managing diabetes that could be used by people of all ages and technical abilities.

## Mission
Design a revolutionary touch screen interface for insulin pumps that would set the standard for medical device interfaces.

# At a glance

**Role:** Lead UX Designer

**Team:** 3-4 designers, partnered with product + engineering

**Platforms:** Touch screen insulin pump interface

**Timeline:** 6 months design and development

---

# My role & impact

## Leadership
• Led UX design for the first touch screen insulin pump
• Collaborated with medical professionals and diabetes patients
• Designed accessible interface for all age groups

## Design & research
• Conducted extensive user research with diabetes patients
• Designed touch screen interface with large, accessible buttons
• Created intuitive navigation for complex medical functions
• Ensured compliance with medical device regulations

## Impact
⭐ **Revolutionary interface** - First touch screen insulin pump
👉 **Improved accessibility** - Easier to use for all age groups
🔄 **Better user experience** - Intuitive navigation and controls
💵 **Market leadership** - Set standard for medical device interfaces

---

# Key features

## Touch Screen Interface
Designed the first touch screen interface for insulin pumps with large, accessible buttons and intuitive navigation.

## Accessibility Focus
Ensured the interface could be used by people of all ages and technical abilities, with large text and clear visual hierarchy.

## Medical Compliance
Designed to meet strict medical device regulations while maintaining excellent user experience.

---

# Key takeaway

I designed the first touch screen insulin pump interface, revolutionizing how people with diabetes interact with their medical devices and setting the standard for future medical device interfaces.`,
          gallery_aspect_ratio: '3x4',
          flow_diagram_aspect_ratio: '3x4',
          video_aspect_ratio: '16x9',
          gallery_columns: 2,
          flow_diagram_columns: 2,
          video_columns: 2,
          project_images_position: 1,
          videos_position: 2,
          flow_diagrams_position: 3,
          solution_cards_position: 4,
          sort_order: 0
        };
        
        const { error: insertError } = await supabase
          .from('projects')
          .insert(tandemProject);
        
        if (insertError) {
          console.error('❌ Error restoring Tandem project:', insertError);
        } else {
          console.log('✅ Tandem Diabetes Care project restored');
        }
      } else {
        console.log('✅ Tandem Diabetes Care project exists');
      }
    } catch (error) {
      console.error('❌ Error checking for missing projects:', error);
    }
  };

  // Fix blob URLs in database by replacing them with proper placeholders
  const fixBlobUrlsInDatabase = async () => {
    try {
      console.log('🔧 Fixing blob URLs in database...');
      
      // Get all projects with blob URLs
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, url')
        .or('url.like.blob:%,url.like.%localhost:3000%');
      
      if (error) {
        console.error('❌ Error fetching projects with blob URLs:', error);
        return;
      }
      
      console.log('📊 Found projects with blob URLs:', projects?.length || 0);
      
      for (const project of projects || []) {
        if (project.url && (project.url.startsWith('blob:') || project.url.includes('localhost:3000'))) {
          console.log(`🔧 Fixing blob URL for project: ${project.title}`);
          
          // Get the appropriate placeholder URL
          const fixedUrl = cleanProjectUrl(project.url, project.title);
          
          // Update the project in the database
          const { error: updateError } = await supabase
            .from('projects')
            .update({ url: fixedUrl })
            .eq('id', project.id);
          
          if (updateError) {
            console.error(`❌ Error updating project ${project.title}:`, updateError);
          } else {
            console.log(`✅ Updated project ${project.title} with new URL: ${fixedUrl}`);
          }
        }
      }
      
      console.log('✅ Blob URL fixes complete');
    } catch (error) {
      console.error('❌ Error fixing blob URLs:', error);
    }
  };

  // Clean up blob URLs in existing case studies
  const cleanupBlobUrls = async () => {
    try {
      console.log('🧹 Cleaning up blob URLs in case studies...');
      
      // Get all projects with case study content
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, case_study_content')
        .not('case_study_content', 'is', null);
      
      if (error) {
        console.log('❌ Error fetching projects for cleanup:', error);
        return;
      }
      
      if (projects && projects.length > 0) {
        for (const project of projects) {
          if (project.case_study_content && project.case_study_content.includes('blob:')) {
            console.log(`🧹 Cleaning blob URLs from project ${project.id}`);
            
            const cleanedContent = cleanBlobUrls(project.case_study_content);
            
            const { error: updateError } = await supabase
              .from('projects')
              .update({ case_study_content: cleanedContent })
              .eq('id', project.id);
            
            if (updateError) {
              console.log('❌ Error cleaning project:', updateError);
            } else {
              console.log('✅ Project cleaned successfully');
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Error cleaning blob URLs:', error);
    }
  };

  // Manual fix for specific issues
  const manualFixIssues = async () => {
    try {
      console.log('🔧 Manual fix for specific issues...');
      
      // Fix Skype Qik image
      const { data: skypeProjects, error: skypeError } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%skype%qik%');
      
      console.log('🔍 Found Skype Qik projects:', skypeProjects?.length || 0);
      
      if (skypeProjects && skypeProjects.length > 0) {
        // Fix all Skype Qik projects
        for (const skypeProject of skypeProjects) {
          console.log('🔧 Fixing Skype Qik project:', skypeProject.title, 'Current URL:', skypeProject.url);
          
          const techUrl = 'https://images.unsplash.com/photo-1758770478125-4850521fd941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc1OTM3NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ url: techUrl })
            .eq('id', skypeProject.id);
          
          if (updateError) {
            console.error('❌ Error updating Skype Qik:', updateError);
          } else {
            console.log('✅ Skype Qik image fixed for project:', skypeProject.title);
          }
        }
      } else {
        console.log('❌ No Skype Qik projects found');
      }
      
      // Check and restore Tandem case study
      const { data: tandemProjects, error: tandemError } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%tandem%diabetes%care%');
      
      if (tandemProjects && tandemProjects.length > 0) {
        // Fix existing Tandem project if it has no URL
        const tandemProject = tandemProjects[0];
        if (!tandemProject.url || tandemProject.url === 'NULL' || tandemProject.url.trim() === '') {
          console.log('🔧 Fixing Tandem project URL...');
          
          const medicalUrl = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ url: medicalUrl })
            .eq('id', tandemProject.id);
          
          if (updateError) {
            console.error('❌ Error updating Tandem project URL:', updateError);
          } else {
            console.log('✅ Tandem project URL fixed');
          }
        } else {
          console.log('✅ Tandem project already has a valid URL');
        }
      } else if (!tandemProjects || tandemProjects.length === 0) {
        console.log('🔄 Creating Tandem Diabetes Care project...');
        
        const tandemProject = {
          title: 'Tandem Diabetes Care',
          description: 'Designing the first touch screen insulin pump interface',
          url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZGV2aWNlfGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          position_x: 50,
          position_y: 50,
          scale: 1,
          published: true,
          requires_password: false,
          case_study_content: `# Overview

## Challenge
Tandem Diabetes Care needed to design the first touch screen insulin pump interface. The challenge was to create an intuitive, accessible interface for managing diabetes that could be used by people of all ages and technical abilities.

## Mission
Design a revolutionary touch screen interface for insulin pumps that would set the standard for medical device interfaces.

# At a glance

**Role:** Lead UX Designer

**Team:** 3-4 designers, partnered with product + engineering

**Platforms:** Touch screen insulin pump interface

**Timeline:** 6 months design and development

---

# My role & impact

## Leadership
• Led UX design for the first touch screen insulin pump
• Collaborated with medical professionals and diabetes patients
• Designed accessible interface for all age groups

## Design & research
• Conducted extensive user research with diabetes patients
• Designed touch screen interface with large, accessible buttons
• Created intuitive navigation for complex medical functions
• Ensured compliance with medical device regulations

## Impact
⭐ **Revolutionary interface** - First touch screen insulin pump
👉 **Improved accessibility** - Easier to use for all age groups
🔄 **Better user experience** - Intuitive navigation and controls
💵 **Market leadership** - Set standard for medical device interfaces

---

# Key features

## Touch Screen Interface
Designed the first touch screen interface for insulin pumps with large, accessible buttons and intuitive navigation.

## Accessibility Focus
Ensured the interface could be used by people of all ages and technical abilities, with large text and clear visual hierarchy.

## Medical Compliance
Designed to meet strict medical device regulations while maintaining excellent user experience.

---

# Key takeaway

I designed the first touch screen insulin pump interface, revolutionizing how people with diabetes interact with their medical devices and setting the standard for future medical device interfaces.`,
          gallery_aspect_ratio: '3x4',
          flow_diagram_aspect_ratio: '3x4',
          video_aspect_ratio: '16x9',
          gallery_columns: 2,
          flow_diagram_columns: 2,
          video_columns: 2,
          project_images_position: 1,
          videos_position: 2,
          flow_diagrams_position: 3,
          solution_cards_position: 4,
          sort_order: 0
        };
        
        const { error: insertError } = await supabase
          .from('projects')
          .insert(tandemProject);
        
        if (insertError) {
          console.error('❌ Error creating Tandem project:', insertError);
        } else {
          console.log('✅ Tandem Diabetes Care project created');
        }
      } else {
        console.log('✅ Tandem Diabetes Care project already exists');
      }
      
      console.log('✅ Manual fixes complete');
    } catch (error) {
      console.error('❌ Error in manual fixes:', error);
    }
  };

  // Make the fix function available globally
  (window as any).fixPortfolioIssues = manualFixIssues;
  
  // Direct Skype Qik fix function
  const fixSkypeQikDirectly = async () => {
    try {
      console.log('🔧 Direct Skype Qik fix...');
      
      const { data: skypeProjects, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%skype%qik%');
      
      console.log('📊 Skype Qik projects found:', skypeProjects?.length || 0);
      console.log('📊 Skype Qik projects:', skypeProjects);
      
      if (skypeProjects && skypeProjects.length > 0) {
        for (const project of skypeProjects) {
          console.log(`🔧 Updating project: ${project.title} (ID: ${project.id})`);
          console.log(`🔧 Current URL: ${project.url}`);
          
          const newUrl = 'https://images.unsplash.com/photo-1758770478125-4850521fd941?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc1OTM3NTg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
          
          const { error: updateError } = await supabase
            .from('projects')
            .update({ url: newUrl })
            .eq('id', project.id);
          
          if (updateError) {
            console.error('❌ Update error:', updateError);
          } else {
            console.log('✅ Updated successfully');
          }
        }
      }
    } catch (error) {
      console.error('❌ Direct fix error:', error);
    }
  };
  
  // Make direct fix available globally
  (window as any).fixSkypeQik = fixSkypeQikDirectly;

  // Populate Supabase case studies with content on mount
  useEffect(() => {
    populateSupabaseCaseStudies();
    cleanupBlobUrls();
    manualFixIssues(); // Manual fix for specific issues
    
    // Temporarily disable aggressive database cleanup to prevent removing legitimate projects
    // const hasRunCleanup = sessionStorage.getItem('databaseCleanupRun');
    // if (!hasRunCleanup) {
    //   cleanupDatabase(); // Clean up duplicates and test data
    //   sessionStorage.setItem('databaseCleanupRun', 'true');
    // }
  }, []);
  
  // Filter projects by type (case studies vs design projects) and convert to ProjectData format
  const caseStudies = useMemo(() => {
    console.log('🔍 All projects for filtering:', projects.map(p => ({ title: p.title, description: p.description })));
    
    const filtered = projects
      .filter(project => {
        // More specific filtering - only exclude explicit design projects
        const isDesignProject = project.title.toLowerCase().includes('modern tech') ||
                               project.title.toLowerCase().includes('web design') ||
                               project.title.toLowerCase().includes('abstract art') ||
                               project.title.toLowerCase().includes('product design') ||
                               (project.description?.toLowerCase().includes('design') && 
                                !project.description?.toLowerCase().includes('diabetes') &&
                                !project.description?.toLowerCase().includes('medical') &&
                                !project.description?.toLowerCase().includes('insulin')) ||
                               (project.description?.toLowerCase().includes('interface') &&
                                !project.description?.toLowerCase().includes('diabetes') &&
                                !project.description?.toLowerCase().includes('medical') &&
                                !project.description?.toLowerCase().includes('insulin'));
        
        // Default to case study unless it's explicitly a design project
        const isCaseStudy = !isDesignProject;
        
        console.log(`🔍 Project "${project.title}": isDesignProject = ${isDesignProject}, isCaseStudy = ${isCaseStudy}`);
        return isCaseStudy;
      })
      .map(project => {
        console.log('🔍 Processing case study project:', { 
          title: project.title, 
          url: project.url,
          hasBlobUrl: project.url?.startsWith('blob:') || false
        });
        
        return {
          ...project,
          position: { x: project.position_x, y: project.position_y },
          url: cleanProjectUrl(project.url || '', project.title),
          // Map other fields as needed
        };
      });
    
    console.log('🏠 Home: Filtered case studies from Supabase:', filtered);
    
    // Always check localStorage for additional case studies
    const savedProjects = localStorage.getItem('caseStudies');
    let localStorageProjects = [];
    if (savedProjects) {
      try {
        localStorageProjects = JSON.parse(savedProjects);
        console.log('🏠 Home: Found localStorage case studies:', localStorageProjects.length);
      } catch (error) {
        console.log('🏠 Home: Error parsing localStorage case studies:', error);
      }
    }
    
    // Combine Supabase and localStorage projects, removing duplicates
    const allProjects = [...filtered, ...localStorageProjects];
    
    // Filter out test data and invalid projects
    const validProjects = allProjects.filter(project => {
      // Filter out test data
      if (project.title?.toLowerCase().includes('test') || 
          project.title?.toLowerCase().includes('mofo') ||
          project.title?.toLowerCase().includes('debug')) {
        console.log(`🗑️ Filtering out test data: "${project.title}"`);
        return false;
      }
      
      // Filter out projects with no title
      if (!project.title || project.title.trim() === '') {
        console.log(`🗑️ Filtering out project with no title`);
        return false;
      }
      
      return true;
    });

    // Remove duplicates based on title, prioritizing projects with valid URLs
    const uniqueProjects = validProjects.reduce((acc, project) => {
      const existingIndex = acc.findIndex(p => p.title === project.title);
      
      console.log(`🔍 Processing project "${project.title}": existingIndex = ${existingIndex}`);
      
      if (existingIndex === -1) {
        // No duplicate found, add the project
        console.log(`✅ Adding new project: "${project.title}"`);
        acc.push(project);
      } else {
        // Duplicate found, choose the best one
        const existing = acc[existingIndex];
        
        // Priority: 1) Valid URL, 2) More content, 3) Supabase over localStorage
        const projectHasValidUrl = project.url && !project.url.startsWith('blob:') && project.url !== 'NULL';
        const existingHasValidUrl = existing.url && !existing.url.startsWith('blob:') && existing.url !== 'NULL';
        
        const projectContent = project.caseStudyContent || (project as any).case_study_content || '';
        const existingContent = existing.caseStudyContent || (existing as any).case_study_content || '';
        
        let shouldReplace = false;
        let reason = '';
        
        if (projectHasValidUrl && !existingHasValidUrl) {
          shouldReplace = true;
          reason = 'has valid URL';
        } else if (!projectHasValidUrl && existingHasValidUrl) {
          shouldReplace = false;
          reason = 'existing has valid URL';
        } else if (projectContent.length > existingContent.length) {
          shouldReplace = true;
          reason = 'has more content';
        } else if (projectContent.length < existingContent.length) {
          shouldReplace = false;
          reason = 'existing has more content';
        } else {
          // Same content, prefer Supabase over localStorage
          const projectIsFromSupabase = project.id && project.id.length > 10; // Supabase IDs are longer
          const existingIsFromSupabase = existing.id && existing.id.length > 10;
          
          if (projectIsFromSupabase && !existingIsFromSupabase) {
            shouldReplace = true;
            reason = 'from Supabase';
          } else {
            shouldReplace = false;
            reason = 'existing is from Supabase or same source';
          }
        }
        
        if (shouldReplace) {
          console.log(`🔄 Home: Replacing duplicate "${project.title}" (${reason})`);
          console.log(`🔄 Replacing existing project:`, existing);
          console.log(`🔄 With new project:`, project);
          acc[existingIndex] = project;
        } else {
          console.log(`🔄 Home: Keeping existing "${project.title}" (${reason})`);
          console.log(`🔄 Keeping existing project:`, existing);
          console.log(`🔄 Discarding new project:`, project);
        }
      }
      
      return acc;
    }, []);
    
    console.log('🏠 Home: Combined case studies (after deduplication):', uniqueProjects.length);
    console.log('🏠 Home: Combined case studies details:', uniqueProjects);
    
    // Debug each case study in the combined list
    uniqueProjects.forEach((project, index) => {
      console.log(`🏠 Home: Case study ${index}:`, {
        title: project.title,
        hasContent: !!(project.caseStudyContent || (project as any).case_study_content),
        contentLength: (project.caseStudyContent || (project as any).case_study_content || '').length,
        keys: Object.keys(project),
        fullProject: project
      });
    });
    
    // If no projects at all, use hardcoded defaults
    if (uniqueProjects.length === 0 && !loading) {
      console.log('🏠 Home: No projects found, using hardcoded defaults');
      console.log('🏠 Home: Default case studies:', defaultCaseStudies);
      return defaultCaseStudies;
    }
    
    console.log('🏠 Home: Returning unique projects (not defaults)');
    return uniqueProjects;
  }, [projects, loading, localStorageVersion]);
  
  const designProjects = useMemo(() => {
    const filtered = projects
      .filter(project => 
        !project.title.toLowerCase().includes('case study') && 
        !project.title.toLowerCase().includes('research') &&
        !project.description?.toLowerCase().includes('case study')
      )
      .map(project => ({
        ...project,
        position: { x: project.position_x, y: project.position_y },
        url: cleanProjectUrl(project.url || '', project.title),
        // Map other fields as needed
      }));
    
    console.log('🏠 Home: Filtered design projects from Supabase:', filtered);
    
    // Always check localStorage for additional design projects
    const savedProjects = localStorage.getItem('designProjects');
    let localStorageProjects = [];
    if (savedProjects) {
      try {
        localStorageProjects = JSON.parse(savedProjects);
        console.log('🏠 Home: Found localStorage design projects:', localStorageProjects.length);
      } catch (error) {
        console.log('🏠 Home: Error parsing localStorage design projects:', error);
      }
    }
    
    // Combine Supabase and localStorage projects, removing duplicates
    const allProjects = [...filtered, ...localStorageProjects];
    
    // Remove duplicates based on title
    const uniqueProjects = allProjects.reduce((acc, project) => {
      const existingIndex = acc.findIndex(p => p.title === project.title);
      
      if (existingIndex === -1) {
        // No duplicate found, add the project
        acc.push(project);
      } else {
        // Duplicate found, keep the one from Supabase (filtered) over localStorage
        const isFromSupabase = filtered.includes(project);
        if (isFromSupabase) {
          console.log(`🔄 Home: Replacing duplicate design project "${project.title}" with Supabase version`);
          acc[existingIndex] = project;
        } else {
          console.log(`🔄 Home: Keeping existing design project "${project.title}", skipping duplicate`);
        }
      }
      
      return acc;
    }, []);
    
    console.log('🏠 Home: Combined design projects (after deduplication):', uniqueProjects.length);
    
    // If no projects at all, use hardcoded defaults
    if (uniqueProjects.length === 0 && !loading) {
      console.log('🏠 Home: No design projects found, using hardcoded defaults');
      return defaultDesignProjects;
    }
    
    return uniqueProjects;
  }, [projects, loading, localStorageVersion]);
  
  // Home page hero text - editable in edit mode
  const [heroText, setHeroText] = useState(() => {
    const defaultHeroText = {
      greeting: "Welcome,",
      greetings: [
        "Welcome,",
        "I'm Brian.",
        "Designer.",
        "Researcher.",
        "Product Builder."
      ],
      greetingFont: "Inter, sans-serif",
      lastGreetingPauseDuration: 30000,
      subtitle: "Product design leader",
      description: "building high quality products and teams through",
      word1: "planning",
      word2: "collaboration",
      word3: "empathy",
      word4: "design",
      buttonText: "More about Brian"
    };
    
    try {
      console.log('🏠 Home: Loading hero text...');
      const saved = localStorage.getItem('heroText');
      if (!saved) {
        console.log('📝 No saved hero text, using defaults');
        return defaultHeroText;
      }
      
      // Extra validation before parsing
      if (typeof saved !== 'string' || saved.length === 0) {
        console.error('❌ Hero text data is not a valid string');
        return defaultHeroText;
      }
      
      const parsed = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null) {
        console.error('❌ Hero text is not an object, using defaults');
        localStorage.removeItem('heroText'); // Clear invalid data
        return defaultHeroText;
      }
      
      console.log('✅ Loaded hero text from localStorage');
      return parsed;
    } catch (e) {
      console.error('❌ CRITICAL: Error loading hero text:', e);
      console.error('Stack:', e instanceof Error ? e.stack : 'No stack');
      // Clear corrupted data
      try {
        localStorage.removeItem('heroText');
      } catch (clearError) {
        console.error('Cannot clear hero text:', clearError);
      }
      return defaultHeroText;
    }
  });
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [greetingsTextValue, setGreetingsTextValue] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    projectId: string;
    projectTitle: string;
    type: 'caseStudies' | 'design';
  } | null>(null);
  
  // Save heroText to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('heroText', JSON.stringify(heroText));
  }, [heroText]);
  
  // Use ref to store greetings array - prevents infinite re-render loops
  const greetingsRef = useRef<string[]>([]);
  
  // Ref for case study scroll (singular) - used in handleAddFromTemplate
  const caseStudyScrollRef = useRef<HTMLDivElement>(null);
  
  // Update ref when heroText changes (but don't trigger effects)
  useEffect(() => {
    greetingsRef.current = heroText.greetings || [heroText.greeting];
  }, [heroText.greetings, heroText.greeting]);
  
  // Typing animation state
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaitingForCycle, setIsWaitingForCycle] = useState(false);
  
  // Typing animation effect - uses ref so doesn't re-run when heroText changes
  useEffect(() => {
    const greetings = greetingsRef.current;
    if (!greetings || greetings.length === 0) return;
    
    const currentGreeting = greetings[currentGreetingIndex] || "";
    const isLastGreeting = currentGreetingIndex === greetings.length - 1;
    const pauseDuration = heroText.lastGreetingPauseDuration || 30000;
    
    let delay: number;
    
    if (isWaitingForCycle) {
      delay = pauseDuration; // Configurable pause after last greeting
    } else if (!isDeleting) {
      if (displayedText.length < currentGreeting.length) {
        delay = 40 + Math.floor(Math.random() * 40); // Variable typing speed (40-80ms)
      } else {
        delay = 1200; // Pause after typing complete
      }
    } else {
      if (displayedText.length > 0) {
        delay = 25; // Fast deletion
      } else {
        delay = 300; // Brief pause before next greeting
      }
    }
    
    const timer = setTimeout(() => {
      if (isWaitingForCycle) {
        setIsWaitingForCycle(false);
        setIsDeleting(true);
      } else if (!isDeleting) {
        if (displayedText.length < currentGreeting.length) {
          setDisplayedText(currentGreeting.slice(0, displayedText.length + 1));
        } else {
          if (isLastGreeting) {
            setIsWaitingForCycle(true);
          } else {
            setIsDeleting(true);
          }
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          const greetingsLength = greetingsRef.current.length;
          setCurrentGreetingIndex((prev) => (prev + 1) % greetingsLength);
        }
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentGreetingIndex, isWaitingForCycle, heroText.lastGreetingPauseDuration]);
  
  const [lightboxProject, setLightboxProject] = useState<ProjectData | null>(null);
  const caseStudiesScrollRef = useRef<HTMLDivElement>(null);
  const designProjectsScrollRef = useRef<HTMLDivElement>(null);
  
  // Track window width for conditional arrow rendering
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [caseStudiesHasOverflow, setCaseStudiesHasOverflow] = useState(false);
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = (scrollRef: React.RefObject<HTMLDivElement>) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      scroll("right", scrollRef);
    } else if (isRightSwipe) {
      scroll("left", scrollRef);
    }
  };
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Check for overflow whenever window resizes or case studies change
  useEffect(() => {
    const checkOverflow = () => {
      if (caseStudiesScrollRef.current) {
        const hasOverflow = caseStudiesScrollRef.current.scrollWidth > caseStudiesScrollRef.current.clientWidth;
        setCaseStudiesHasOverflow(hasOverflow);
      }
    };
    
    checkOverflow();
    // Small delay to let layout settle
    const timer = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timer);
  }, [windowWidth, caseStudies, isEditMode]);
  
  // Save hero text to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('heroText', JSON.stringify(heroText));
  }, [heroText]);

  // Data is now loaded from Supabase via useProjects hook
  // No need to reload from localStorage

  // NOTE: We don't auto-save on every state change to avoid overwriting fresh saves with stale data
  // Saves happen explicitly in handleUpdateProject, handleReplaceImage, etc.

  const handleProjectClick = (project: ProjectData, type: 'caseStudies' | 'design') => {
    const normalizedProject = normalizeProjectData(project);
    console.log('🏠 Home: handleProjectClick - normalized project:', normalizedProject);
    
    if (isEditMode) {
      // In edit mode, open lightbox
      setLightboxProject(normalizedProject);
    } else {
      // In preview mode, navigate to detail page with update callback
      const updateCallback = (updatedProject: ProjectData) => {
        handleUpdateProject(updatedProject, type);
      };
      onProjectClick(normalizedProject, updateCallback);
    }
  };

  const handleUpdateProject = async (updatedProject: ProjectData, type: 'caseStudies' | 'design') => {
    console.log('🏠 Home: handleUpdateProject called:', {
      id: updatedProject.id,
      title: updatedProject.title,
      contentLength: updatedProject.caseStudyContent?.length || 0,
      type,
      'Full updatedProject': updatedProject
    });
    
    try {
      // Convert to Supabase format
      const projectData = {
        title: updatedProject.title,
        description: updatedProject.description,
        url: updatedProject.url,
        position_x: updatedProject.position?.x || 50,
        position_y: updatedProject.position?.y || 50,
        scale: updatedProject.scale || 1,
        published: updatedProject.published || false,
        requires_password: updatedProject.requiresPassword || false,
        password: (updatedProject as any).password || '',
        case_study_content: updatedProject.caseStudyContent,
        case_study_images: updatedProject.caseStudyImages || [],
        flow_diagram_images: updatedProject.flowDiagramImages || [],
        video_items: updatedProject.videoItems || [],
        gallery_aspect_ratio: updatedProject.galleryAspectRatio || '3x4',
        flow_diagram_aspect_ratio: updatedProject.flowDiagramAspectRatio || '3x4',
        video_aspect_ratio: updatedProject.videoAspectRatio || '3x4',
        gallery_columns: updatedProject.galleryColumns || 1,
        flow_diagram_columns: updatedProject.flowDiagramColumns || 1,
        video_columns: updatedProject.videoColumns || 1,
        project_images_position: updatedProject.projectImagesPosition,
        videos_position: updatedProject.videosPosition,
        flow_diagrams_position: updatedProject.flowDiagramsPosition,
        solution_cards_position: updatedProject.solutionCardsPosition,
        section_positions: updatedProject.sectionPositions || {},
        sort_order: (updatedProject as any).sortOrder || 0
      };

      console.log('🔄 Home: Calling updateProject with data:', {
        id: updatedProject.id,
        case_study_content_length: projectData.case_study_content?.length || 0
      });
      
      // DEBUG: Detailed content comparison
      console.log('🔍 DEBUG: Content comparison:', {
        'updatedProject.caseStudyContent length': updatedProject.caseStudyContent?.length || 0,
        'updatedProject.caseStudyContent preview': updatedProject.caseStudyContent?.substring(0, 100) + '...',
        'projectData.case_study_content length': projectData.case_study_content?.length || 0,
        'projectData.case_study_content preview': projectData.case_study_content?.substring(0, 100) + '...',
        'Are they equal?': updatedProject.caseStudyContent === projectData.case_study_content
      });

      const result = await updateProject(updatedProject.id, projectData);
      if (result) {
        console.log('✅ Project updated in Supabase:', updatedProject.id);
      } else {
        console.log('⚠️ Supabase update failed, trying localStorage fallback...');
        
        // Fallback to localStorage
        try {
          const storageKey = type === 'caseStudies' ? 'caseStudies' : 'designProjects';
          const savedProjects = localStorage.getItem(storageKey);
          let projects = [];
          
          if (savedProjects) {
            projects = JSON.parse(savedProjects);
          }
          
          // Find and update the project
          const projectIndex = projects.findIndex((p: any) => p.id === updatedProject.id);
          if (projectIndex !== -1) {
            // Update the project with new content
            (projects as any)[projectIndex] = {
              ...(projects as any)[projectIndex],
              title: updatedProject.title,
              description: updatedProject.description,
              caseStudyContent: updatedProject.caseStudyContent,
              caseStudyImages: updatedProject.caseStudyImages,
              flowDiagramImages: updatedProject.flowDiagramImages,
              videoItems: updatedProject.videoItems,
              galleryAspectRatio: updatedProject.galleryAspectRatio,
              flowDiagramAspectRatio: updatedProject.flowDiagramAspectRatio,
              videoAspectRatio: updatedProject.videoAspectRatio,
              galleryColumns: updatedProject.galleryColumns,
              flowDiagramColumns: updatedProject.flowDiagramColumns,
              videoColumns: updatedProject.videoColumns,
              projectImagesPosition: updatedProject.projectImagesPosition,
              videosPosition: updatedProject.videosPosition,
              flowDiagramsPosition: updatedProject.flowDiagramsPosition,
              solutionCardsPosition: updatedProject.solutionCardsPosition,
              lastModified: new Date().toISOString()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(projects));
            console.log('✅ Project updated in localStorage:', updatedProject.id);
            
            // Trigger re-render
            setLocalStorageVersion(prev => prev + 1);
          } else {
            console.log('❌ Project not found in localStorage for fallback');
      }
    } catch (error) {
          console.error('❌ localStorage fallback failed:', error);
        }
      }
    } catch (error) {
      console.error('❌ Update failed:', error);
      alert('⚠️ Update failed! Please try again.');
    }
  };

  const handleReplaceImage = async (id: string, file: File, type: 'caseStudies' | 'design') => {
    // Convert file to base64 data URL for persistence
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newUrl = reader.result as string;
      
      // Update in Supabase
      const result = await updateProject(id, { url: newUrl });
      if (result) {
        console.log('✅ Image updated in Supabase:', id);
      } else {
        console.error('❌ Failed to update image in Supabase:', id);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProject = async (type: 'caseStudies' | 'design') => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Convert file to base64 data URL for persistence
        const reader = new FileReader();
        reader.onloadend = async () => {
          const newProject: ProjectData = {
            id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
            url: reader.result as string,
            title: "New Project",
            description: "Add your project description here",
            position: { x: 50, y: 50 },
            scale: 1,
            published: false,
          };
          // Convert to Supabase format and create in database
          const projectData = {
            user_id: '', // Will be set by the hook
            title: newProject.title,
            description: newProject.description,
            url: newProject.url,
            position_x: newProject.position?.x || 50,
            position_y: newProject.position?.y || 50,
            scale: newProject.scale || 1,
            published: newProject.published || false,
            requires_password: false,
            case_study_images: [],
            flow_diagram_images: [],
            video_items: [],
            gallery_aspect_ratio: '3x4',
            flow_diagram_aspect_ratio: '3x4',
            video_aspect_ratio: '3x4',
            gallery_columns: 1,
            flow_diagram_columns: 1,
            video_columns: 1,
            section_positions: {},
            sort_order: 0
          };

          const createdProject = await createProject(projectData);
          if (createdProject) {
            console.log('✅ New project created in Supabase:', createdProject.id);
          } else {
            console.error('❌ Failed to create project in Supabase');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddFromTemplate = async () => {
    console.log('🖱️ New from Template button clicked!');
    try {
    const newCaseStudy = createCaseStudyFromTemplate();
      
      // Get current user for the project
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user for creating project');
        return;
      }

      // Convert to Supabase format and create in database
      const projectData = {
        user_id: user.id,
        title: newCaseStudy.title,
        description: newCaseStudy.description,
        url: newCaseStudy.url,
        position_x: newCaseStudy.position?.x || newCaseStudy.position_x || 50,
        position_y: newCaseStudy.position?.y || newCaseStudy.position_y || 50,
        scale: newCaseStudy.scale || 1,
        published: newCaseStudy.published || false,
        requires_password: newCaseStudy.requires_password || false,
        password: newCaseStudy.password,
        case_study_content: newCaseStudy.caseStudyContent,
        case_study_images: newCaseStudy.case_study_images || [],
        flow_diagram_images: newCaseStudy.flow_diagram_images || [],
        video_items: newCaseStudy.video_items || [],
        gallery_aspect_ratio: newCaseStudy.gallery_aspect_ratio || '3x4',
        flow_diagram_aspect_ratio: newCaseStudy.flow_diagram_aspect_ratio || '3x4',
        video_aspect_ratio: newCaseStudy.video_aspect_ratio || '3x4',
        gallery_columns: newCaseStudy.gallery_columns || 1,
        flow_diagram_columns: newCaseStudy.flow_diagram_columns || 1,
        video_columns: newCaseStudy.video_columns || 1,
        project_images_position: newCaseStudy.project_images_position,
        videos_position: newCaseStudy.videos_position,
        flow_diagrams_position: newCaseStudy.flow_diagrams_position,
        solution_cards_position: newCaseStudy.solution_cards_position,
        section_positions: newCaseStudy.section_positions || {},
        sort_order: newCaseStudy.sort_order || 0
      };

      console.log('🔄 Creating new project from template:', projectData);
      const createdProject = await createProject(projectData);
      
      if (createdProject) {
        console.log('✅ New case study created in Supabase:', createdProject.id);
        // Scroll to show the new case study was added
        setTimeout(() => {
          if (caseStudyScrollRef.current) {
            caseStudyScrollRef.current.scrollTo({
              left: caseStudyScrollRef.current.scrollWidth,
              behavior: 'smooth'
            });
          }
        }, 100);
      } else {
        console.log('⚠️ Supabase creation failed (likely not authenticated), saving to localStorage instead');
        
        // Fallback to localStorage
        const savedProjects = JSON.parse(localStorage.getItem('caseStudies') || '[]');
        const newProject = {
          ...newCaseStudy,
          id: `cs-${Date.now()}`, // Generate unique ID
          created_at: new Date().toISOString()
        };
        savedProjects.push(newProject);
               localStorage.setItem('caseStudies', JSON.stringify(savedProjects));
               
               console.log('✅ New case study saved to localStorage:', newProject.id);
               // Trigger re-render by updating localStorage version
               setLocalStorageVersion(prev => prev + 1);
        
    // Scroll to show the new case study was added
    setTimeout(() => {
      if (caseStudyScrollRef.current) {
        caseStudyScrollRef.current.scrollTo({
          left: caseStudyScrollRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 100);
      }
    } catch (error) {
      console.error('❌ Error creating project from template:', error);
    }
  };

  const handleCreateUnifiedProject = useCallback(async (projectData: any) => {
    console.log('🖱️ Creating blank project:', projectData);
    try {
      // Get current user for the project
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user for creating project');
        return;
      }

      // Convert to Supabase format and create in database
      const supabaseProjectData = {
        user_id: user.id,
        title: projectData.title,
        description: projectData.description,
        url: projectData.url || "",
        position_x: projectData.position?.x || 50,
        position_y: projectData.position?.y || 50,
        scale: projectData.scale || 1,
        published: projectData.published || false,
        requires_password: projectData.requires_password || false,
        password: projectData.password,
        case_study_content: projectData.caseStudyContent || "",
        case_study_images: projectData.caseStudyImages || [],
        flow_diagram_images: projectData.flowDiagramImages || [],
        video_items: projectData.videoItems || [],
        gallery_aspect_ratio: projectData.galleryAspectRatio || '3x4',
        flow_diagram_aspect_ratio: projectData.flowDiagramAspectRatio || '3x4',
        video_aspect_ratio: projectData.videoAspectRatio || '3x4',
        gallery_columns: projectData.galleryColumns || 1,
        flow_diagram_columns: projectData.flowDiagramColumns || 1,
        video_columns: projectData.videoColumns || 1,
        project_images_position: projectData.projectImagesPosition,
        videos_position: projectData.videosPosition,
        flow_diagrams_position: projectData.flowDiagramsPosition,
        solution_cards_position: projectData.solutionCardsPosition,
        section_positions: projectData.sectionPositions || {},
        sort_order: 0
      };

      const createdProject = await createProject(supabaseProjectData);
      if (createdProject) {
        console.log('✅ Unified project created in Supabase:', createdProject.id);
        setShowUnifiedProjectCreator(false);
        // Scroll to show the new case study was added
        setTimeout(() => {
          if (caseStudyScrollRef.current) {
            caseStudyScrollRef.current.scrollTo({
              left: caseStudyScrollRef.current.scrollWidth,
              behavior: 'smooth'
            });
          }
        }, 100);
      } else {
        console.error('❌ Failed to create blank project in Supabase');
      }
    } catch (error) {
      console.error('❌ Error creating blank project:', error);
    }
  }, [createProject, caseStudyScrollRef]);

  const handleDeleteProject = (projectId: string, projectTitle: string, type: 'caseStudies' | 'design') => {
    setDeleteConfirmation({ projectId, projectTitle, type });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    const { projectId, type } = deleteConfirmation;
    
    try {
      // Try to delete from Supabase first
      const success = await deleteProject(projectId);
      if (success) {
        console.log('✅ Project deleted from Supabase:', projectId);
    } else {
        console.log('⚠️ Supabase delete failed, trying localStorage...');
        
        // Fallback to localStorage deletion
        const storageKey = type === 'caseStudies' ? 'caseStudies' : 'designProjects';
        const savedProjects = localStorage.getItem(storageKey);
        if (savedProjects) {
          try {
            const projects = JSON.parse(savedProjects);
            const filteredProjects = projects.filter((p: any) => p.id !== projectId);
            localStorage.setItem(storageKey, JSON.stringify(filteredProjects));
            console.log('✅ Project deleted from localStorage:', projectId);
            // Trigger re-render by updating localStorage version
            setLocalStorageVersion(prev => prev + 1);
          } catch (error) {
            console.error('❌ Error deleting from localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      
      // Fallback to localStorage deletion
      const storageKey = type === 'caseStudies' ? 'caseStudies' : 'designProjects';
      const savedProjects = localStorage.getItem(storageKey);
      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          const filteredProjects = projects.filter((p: any) => p.id !== projectId);
          localStorage.setItem(storageKey, JSON.stringify(filteredProjects));
          console.log('✅ Project deleted from localStorage (fallback):', projectId);
          // Trigger re-render by updating localStorage version
          setLocalStorageVersion(prev => prev + 1);
        } catch (error) {
          console.error('❌ Error deleting from localStorage:', error);
        }
      }
    }
    
    setDeleteConfirmation(null);
  };

  // Function to normalize project data structure for ProjectDetail
  const normalizeProjectData = (project: any): ProjectData => {
    return {
      ...project,
      // Ensure camelCase fields are available
      caseStudyContent: project.caseStudyContent || project.case_study_content,
      caseStudyImages: project.caseStudyImages || project.case_study_images || [],
      flowDiagramImages: project.flowDiagramImages || project.flow_diagram_images || [],
      videoItems: project.videoItems || project.video_items || [],
      galleryAspectRatio: project.galleryAspectRatio || project.gallery_aspect_ratio || "3x4",
      flowDiagramAspectRatio: project.flowDiagramAspectRatio || project.flow_diagram_aspect_ratio || "16x9",
      videoAspectRatio: project.videoAspectRatio || project.video_aspect_ratio || "16x9",
      galleryColumns: project.galleryColumns || project.gallery_columns || 3,
      flowDiagramColumns: project.flowDiagramColumns || project.flow_diagram_columns || 2,
      videoColumns: project.videoColumns || project.video_columns || 1,
      // Ensure position is an object
      position: project.position || { x: project.position_x || 50, y: project.position_y || 50 }
    };
  };

  const handleNavigateToProject = (project: ProjectData, type: 'caseStudies' | 'design') => {
    const normalizedProject = normalizeProjectData(project);
    console.log('🏠 Home: Normalized project for navigation:', normalizedProject);
    
    const updateCallback = (updatedProject: ProjectData) => {
      handleUpdateProject(updatedProject, type);
    };
    onProjectClick(normalizedProject, updateCallback);
  };

  const scroll = (direction: "left" | "right", ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = 320;
      const maxScroll = ref.current.scrollWidth - ref.current.clientWidth;
      const currentScroll = ref.current.scrollLeft;
      
      let newPosition: number;
      
      if (direction === "left") {
        // If already at the start, wrap to the end
        if (currentScroll <= 0) {
          newPosition = maxScroll;
        } else {
          newPosition = currentScroll - scrollAmount;
        }
      } else {
        // If already at the end, wrap to the start
        if (currentScroll >= maxScroll - 10) { // 10px threshold for rounding errors
          newPosition = 0;
        } else {
          newPosition = currentScroll + scrollAmount;
        }
      }
      
      ref.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
    }
  };

  const moveCaseStudy = async (dragIndex: number, hoverIndex: number) => {
    console.log('🔄 moveCaseStudy called:', { dragIndex, hoverIndex });
    
    const draggedItem = caseStudies[dragIndex];
    const newCaseStudies = [...caseStudies];
    newCaseStudies.splice(dragIndex, 1);
    newCaseStudies.splice(hoverIndex, 0, draggedItem);
    
    console.log('📋 New case study order:', newCaseStudies.map(p => ({ id: p.id, title: p.title })));
    
    // Update sort order in Supabase
    const projectIds = newCaseStudies.map(project => project.id);
    const success = await reorderProjects(projectIds);
    
    if (success) {
      console.log('✅ Case studies reordered successfully');
    } else {
      console.error('❌ Failed to reorder case studies');
    }
  };

  const moveDesignProject = async (dragIndex: number, hoverIndex: number) => {
    console.log('🔄 moveDesignProject called:', { dragIndex, hoverIndex });
    
    const draggedItem = designProjects[dragIndex];
    const newDesignProjects = [...designProjects];
    newDesignProjects.splice(dragIndex, 1);
    newDesignProjects.splice(hoverIndex, 0, draggedItem);
    
    console.log('📋 New design project order:', newDesignProjects.map(p => ({ id: p.id, title: p.title })));
    
    // Update sort order in Supabase
    const projectIds = newDesignProjects.map(project => project.id);
    const success = await reorderProjects(projectIds);
    
    if (success) {
      console.log('✅ Design projects reordered successfully');
    } else {
      console.error('❌ Failed to reorder design projects');
    }
  };

  const displayCaseStudies = isEditMode
    ? caseStudies
    : caseStudies.filter((p) => p.published);

  const displayDesignProjects = isEditMode
    ? designProjects
    : designProjects.filter((p) => p.published);

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 md:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 mb-16 relative z-10 mt-10 md:mt-20"
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight font-extrabold text-center break-words md:whitespace-nowrap px-4"
            style={{
              fontFamily: heroText.greetingFont || "Inter, sans-serif",
              lineHeight: "1.3",
              paddingBottom: "0.1em",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            <motion.span
              className="inline"
              animate={{
                backgroundImage: [
                  "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                  "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                  "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                  "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                  "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {displayedText}
            </motion.span>
            <motion.span 
              className="inline-block align-middle ml-1 w-1 md:w-1.5"
              animate={{
                backgroundImage: [
                  "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                  "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                  "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                  "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                  "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                height: "0.9em",
                animation: "blinkCursor 1.2s infinite",
                verticalAlign: "baseline",
              }}
            />
          </motion.h1>
        </motion.div>

        {/* Bio Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative p-8 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/40 dark:from-slate-900/20 dark:via-blue-900/10 dark:to-purple-900/10 backdrop-blur-sm rounded-3xl border border-border shadow-2xl overflow-hidden transition-all duration-500 max-w-4xl mx-auto mb-6 md:mb-12"
        >
          {/* Decorative Curved Brushstrokes - Far right near dots, bleeding off edges */}
          <svg
            className="absolute right-0 top-0 h-full w-[30%] pointer-events-none"
            viewBox="0 0 300 800"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="home-bio-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="home-bio-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="home-bio-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Curved Line 1 - Far right, flows vertically and bleeds off top */}
            <motion.path
              d="M150,-100 Q180,0 200,100 Q220,200 230,300 Q240,400 260,500"
              fill="none"
              stroke="url(#home-bio-gradient-1)"
              strokeWidth="58"
              strokeLinecap="round"
              opacity="0.5"
              animate={{
                d: [
                  "M150,-100 Q180,0 200,100 Q220,200 230,300 Q240,400 260,500",
                  "M150,-100 Q190,10 210,110 Q230,210 240,310 Q250,410 270,510",
                  "M150,-100 Q180,0 200,100 Q220,200 230,300 Q240,400 260,500",
                ],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Curved Line 2 - Far right S-curve, bleeds off right edge */}
            <motion.path
              d="M120,200 Q160,250 190,300 Q220,350 250,380 Q280,410 350,460"
              fill="none"
              stroke="url(#home-bio-gradient-2)"
              strokeWidth="54"
              strokeLinecap="round"
              opacity="0.55"
              animate={{
                d: [
                  "M120,200 Q160,250 190,300 Q220,350 250,380 Q280,410 350,460",
                  "M120,200 Q150,260 180,310 Q210,360 240,390 Q270,420 340,470",
                  "M120,200 Q160,250 190,300 Q220,350 250,380 Q280,410 350,460",
                ],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Curved Line 3 - Far right, flows down and bleeds off bottom */}
            <motion.path
              d="M180,520 Q210,600 230,680 Q250,760 270,840 Q290,900 330,960"
              fill="none"
              stroke="url(#home-bio-gradient-3)"
              strokeWidth="52"
              strokeLinecap="round"
              opacity="0.48"
              animate={{
                d: [
                  "M180,520 Q210,600 230,680 Q250,760 270,840 Q290,900 330,960",
                  "M180,520 Q200,610 220,690 Q240,770 260,850 Q280,910 320,970",
                  "M180,520 Q210,600 230,680 Q250,760 270,840 Q290,900 330,960",
                ],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Curved Line 4 - Far right diagonal, bleeds off top-right */}
            <motion.path
              d="M140,-80 Q170,20 190,110 Q210,200 230,280 Q250,350 310,420"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="50"
              strokeLinecap="round"
              opacity="0.45"
              // Temporarily disabled animation to fix Motion.js errors
              // animate={{
              //   d: [
              //     "M140,-80 Q170,20 190,110 Q210,200 230,280 Q250,350 310,420",
              //     "M140,-80 Q160,30 180,120 Q200,210 220,290 Q240,360 300,430",
              //     "M140,-80 Q170,20 190,110 Q210,200 230,280 Q250,350 310,420",
              //   ],
              // }}
              // transition={{
              //   duration: 15,
              //   repeat: Infinity,
              //   ease: "easeInOut",
              // }}
            />

            {/* Curved Line 5 - Far right gentle curve, bleeds right */}
            <motion.path
              d="M110,380 Q150,420 180,460 Q210,500 240,540 Q270,580 330,630"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="48"
              strokeLinecap="round"
              opacity="0.42"
              // Temporarily disabled animation to fix Motion.js errors
              // animate={{
              //   d: [
              //     "M110,380 Q150,420 180,460 Q210,500 240,540 Q270,580 330,630",
              //     "M110,380 Q140,430 170,470 Q200,510 230,550 Q260,590 320,640",
              //     "M110,380 Q150,420 180,460 Q210,500 240,540 Q270,580 330,630",
              //   ],
              // }}
              // transition={{
              //   duration: 17,
              //   repeat: Infinity,
              //   ease: "easeInOut",
              // }}
            />
          </svg>

          {/* Colorful Animated Dots - Right side between text and edge */}
          {[
            { x: '72%', y: '8%', color: '#ec4899', size: 14, delay: 0 },
            { x: '82%', y: '15%', color: '#8b5cf6', size: 11, delay: 0.5 },
            { x: '88%', y: '22%', color: '#3b82f6', size: 16, delay: 1 },
            { x: '76%', y: '28%', color: '#fbbf24', size: 12, delay: 1.5 },
            { x: '85%', y: '35%', color: '#ec4899', size: 15, delay: 2 },
            { x: '92%', y: '42%', color: '#8b5cf6', size: 10, delay: 2.5 },
            { x: '79%', y: '50%', color: '#3b82f6', size: 13, delay: 3 },
            { x: '86%', y: '58%', color: '#fbbf24', size: 11, delay: 3.5 },
            { x: '94%', y: '65%', color: '#ec4899', size: 14, delay: 0.8 },
            { x: '74%', y: '72%', color: '#8b5cf6', size: 12, delay: 1.2 },
            { x: '83%', y: '78%', color: '#3b82f6', size: 15, delay: 1.8 },
            { x: '90%', y: '85%', color: '#fbbf24', size: 10, delay: 2.2 },
            { x: '77%', y: '92%', color: '#ec4899', size: 13, delay: 2.8 },
            { x: '96%', y: '48%', color: '#8b5cf6', size: 9, delay: 3.2 },
          ].map((dot, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: dot.x,
                top: dot.y,
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                background: dot.color,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4 + (index % 3),
                repeat: Infinity,
                delay: dot.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="max-w-3xl relative z-10">
            {/* Edit Mode Controls */}
            {isEditMode && !isEditingHero && (
              <div className="mb-4 flex items-center gap-2">
                <Button
                  onClick={() => setIsEditingHero(true)}
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit Hero Text
                </Button>
              </div>
            )}

            {isEditingHero ? (
              <div className="space-y-4 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-border shadow-lg">
                {/* Done Button at Top */}
                <div className="flex items-center justify-between border-b border-border pb-4 mb-2">
                  <h3 className="text-lg font-semibold">Edit Hero Text</h3>
                  <Button
                    onClick={() => setIsEditingHero(false)}
                    variant="default"
                    size="sm"
                    className="rounded-full"
                  >
                    <Save className="w-3 h-3 mr-2" />
                    Done Editing
                  </Button>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Animated Greetings (one per line - types through each)</label>
                  <Textarea
                    value={greetingsTextValue}
                    onChange={(e) => {
                      // Just update the raw text value - don't parse yet
                      setGreetingsTextValue(e.target.value);
                    }}
                    onFocus={() => {
                      // Initialize with current greetings when focused
                      setGreetingsTextValue((heroText.greetings || [heroText.greeting]).join('\n'));
                    }}
                    onBlur={() => {
                      // Parse the greetings when user leaves the field
                      const greetings = greetingsTextValue
                        ?.split('\n')
                        .map(g => g.trim())
                        .filter(Boolean);
                      
                      if (greetings.length > 0) {
                        setHeroText({ 
                          ...heroText, 
                          greetings,
                          greeting: greetings[0]
                        });
                      }
                    }}
                    placeholder="Welcome&#10;I'm Brian&#10;Designer&#10;Builder&#10;Researcher&#10;Product"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Type one greeting per line. You can add up to 6 (or more!) Keep them short for mobile.
                  </p>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Pause Duration After Last Greeting (seconds)</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={(heroText.lastGreetingPauseDuration || 30000) / 1000}
                      onChange={(e) => {
                        const seconds = parseInt(e.target.value) || 30;
                        setHeroText({ 
                          ...heroText, 
                          lastGreetingPauseDuration: seconds * 1000 
                        });
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to wait after the last greeting before looping back to the first
                  </p>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Greeting Font Family</label>
                  <Select
                    value={heroText.greetingFont}
                    onValueChange={(value) => setHeroText({ ...heroText, greetingFont: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter (Default)</SelectItem>
                      <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                      <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                      <SelectItem value="'Comic Sans MS', cursive">Comic Sans MS</SelectItem>
                      <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                      <SelectItem value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Subtitle (bold text)</label>
                  <Input
                    value={heroText.subtitle}
                    onChange={(e) => setHeroText({ ...heroText, subtitle: e.target.value })}
                    placeholder="Product design leader"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm">Description</label>
                  <Input
                    value={heroText.description}
                    onChange={(e) => setHeroText({ ...heroText, description: e.target.value })}
                    placeholder="building high quality products and teams through"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-2 text-sm">Animated Word 1</label>
                    <Input
                      value={heroText.word1}
                      onChange={(e) => setHeroText({ ...heroText, word1: e.target.value })}
                      placeholder="planning"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Animated Word 2</label>
                    <Input
                      value={heroText.word2}
                      onChange={(e) => setHeroText({ ...heroText, word2: e.target.value })}
                      placeholder="collaboration"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Animated Word 3</label>
                    <Input
                      value={heroText.word3}
                      onChange={(e) => setHeroText({ ...heroText, word3: e.target.value })}
                      placeholder="empathy"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Animated Word 4</label>
                    <Input
                      value={heroText.word4}
                      onChange={(e) => setHeroText({ ...heroText, word4: e.target.value })}
                      placeholder="design"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Button Text</label>
                  <Input
                    value={heroText.buttonText}
                    onChange={(e) => setHeroText({ ...heroText, buttonText: e.target.value })}
                    placeholder="More about Brian"
                  />
                </div>
              </div>
            ) : (
              <p className="text-lg md:text-xl leading-relaxed mb-6">
                <strong>{heroText.subtitle}</strong> {heroText.description}{' '}
                <motion.span
                  className="inline-block"
                  animate={{
                    backgroundImage: [
                      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                    ],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0,
                  }}
                  style={{
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {heroText.word1}
                </motion.span>
                ,{' '}
                <motion.span
                  className="inline-block"
                  animate={{
                    backgroundImage: [
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                    ],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2.5,
                  }}
                  style={{
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {heroText.word2}
                </motion.span>
                ,{' '}
                <motion.span
                  className="inline-block"
                  animate={{
                    backgroundImage: [
                      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                    ],
                  }}
                  transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 5,
                  }}
                  style={{
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {heroText.word3}
                </motion.span>
                , and{' '}
                <motion.span
                  className="inline-block"
                  animate={{
                    backgroundImage: [
                      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                      "linear-gradient(45deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                      "linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #fbbf24 100%)",
                      "linear-gradient(135deg, #3b82f6 0%, #fbbf24 50%, #ec4899 100%)",
                      "linear-gradient(180deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)",
                    ],
                  }}
                  transition={{
                    duration: 13,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 7.5,
                  }}
                  style={{
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {heroText.word4}
                </motion.span>
                .
              </p>
            )}

            {/* CTA Button & LinkedIn - Inside container, flush left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col min-[360px]:flex-row items-start min-[360px]:items-center gap-4"
            >
              {/* Animated Gradient Border Wrapper */}
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
                <button
                  onClick={onStartClick}
                  className="relative rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm hover:bg-background/60 cursor-pointer"
                >
                  {/* Button Text */}
                  <span
                    className="relative z-10 text-foreground"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {heroText.buttonText}
                  </span>
                </button>
              </motion.div>

              {/* LinkedIn Icon */}
              <motion.a
                href="https://www.linkedin.com/in/bureson/"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                aria-label="LinkedIn Profile"
              >
                {/* Inverted background on hover */}
                <div className="absolute inset-0 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg" />
                
                {/* "in" text */}
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
              </motion.a>
            </motion.div>
          </div>
        </motion.div>

        {/* Case Studies Carousel */}
        <div className="w-full max-w-[1400px] mx-auto mb-16 mt-16 md:mt-32 relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`mb-6 ${!isEditMode && !caseStudiesHasOverflow ? 'text-center' : 'px-4'}`}
          >
            Case studies
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative"
          >
            {/* Navigation Arrows - Only show when there's actual scrollable overflow */}
            {caseStudiesHasOverflow && (
                <>
                  <button
                    onClick={() => scroll("left", caseStudiesScrollRef)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-background border border-border rounded-full p-3 shadow-lg transition-all hover:scale-110"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={() => scroll("right", caseStudiesScrollRef)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-background border border-border rounded-full p-3 shadow-lg transition-all hover:scale-110"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

            {/* Scrollable Container */}
              <div
                ref={caseStudiesScrollRef}
                className={`flex gap-6 overflow-x-auto scrollbar-hide py-8 px-4 snap-x snap-mandatory scroll-smooth ${
                  !isEditMode && !caseStudiesHasOverflow ? 'justify-center' : ''
                }`}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(caseStudiesScrollRef)}
              >
                {displayCaseStudies.map((project, index) => (
                  <DraggableProjectItem
                    key={project.id}
                    project={project}
                    index={index}
                    isEditMode={isEditMode}
                    onMove={moveCaseStudy}
                    onClick={() => handleProjectClick(project, 'caseStudies')}
                    onUpdate={(p: ProjectData) => handleUpdateProject(p, 'caseStudies')}
                    onReplace={(file: File) => handleReplaceImage(project.id, file, 'caseStudies')}
                    onDelete={isEditMode ? () => handleDeleteProject(project.id, project.title, 'caseStudies') : undefined}
                    onNavigate={isEditMode ? () => handleNavigateToProject(project, 'caseStudies') : undefined}
                  />
                ))}

                {/* Add Project Buttons in Carousel (Edit Mode Only) */}
                {isEditMode && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: displayCaseStudies.length * 0.1 }}
                      className="snap-center flex-shrink-0 flex items-center justify-center px-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🎯 New Project button clicked - opening unified project creator');
                          setShowUnifiedProjectCreator(true);
                        }}
                        className="w-[280px] aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer"
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        disabled={false}
                      >
                        <Plus className="w-12 h-12 text-primary/70 group-hover:text-primary transition-colors" />
                        <div className="text-center px-4">
                          <span className="block text-primary/70 group-hover:text-primary transition-colors font-semibold">
                            New Project
                          </span>
                          <span className="block text-xs text-muted-foreground mt-1">
                            Choose project type and customize
                          </span>
                          <span className="block text-xs text-primary mt-1">
                            Smart templates available
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxProject && (
        <Lightbox
          isOpen={true}
          onClose={() => setLightboxProject(null)}
          imageUrl={lightboxProject.url}
          imageAlt={lightboxProject.title}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case Study?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{deleteConfirmation?.projectTitle}</strong>"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unified Project Creator */}
      <UnifiedProjectCreator
        isOpen={showUnifiedProjectCreator}
        onClose={useCallback(() => setShowUnifiedProjectCreator(false), [])}
        onCreateProject={handleCreateUnifiedProject}
        isEditMode={isEditMode}
      />
    </div>
  );
}

export default Home;