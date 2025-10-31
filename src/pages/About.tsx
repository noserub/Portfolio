import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { PageLayout } from "../components/layout/PageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Sparkles, Target, Users, Rocket, Zap, Award, Lightbulb, TrendingUp, Boxes, BarChart3, PenTool, BrainCircuit, GraduationCap, Wrench, FileText, Edit2, Save, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useSEO } from "../hooks/useSEO";
import { useProfiles } from "../hooks/useProfiles";

interface AboutProps {
  onBack: () => void;
  onHoverChange?: (isHovering: boolean) => void;
  isEditMode?: boolean;
}

export function About({ onBack, onHoverChange, isEditMode }: AboutProps) {
  // Apply SEO for about page
  useSEO('about');
  
  // Supabase profile hook
  const { getCurrentUserProfile, updateCurrentUserProfile, loading: profileLoading } = useProfiles();
  
  // Track if data has been loaded from Supabase - prevents saving defaults
  const [dataLoadedFromSupabase, setDataLoadedFromSupabase] = useState(false);
  
  // Editable content state
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [bioParagraph1, setBioParagraph1] = useState(
    "Brian Bureson is a Colorado-based product designer and strategic design leader with 20+ years of experience delivering 0–1, research-backed digital products across enterprise, mid-size, and startup environments."
  );
  const [bioParagraph2, setBioParagraph2] = useState(
    "Currently at Oracle (formerly at Skype, Microsoft, Motorola, NBCUniversal), leading design and research initiatives across complex enterprise systems and AI-powered products. Brian brings deep craft, collaborative leadership, and a proven track record of product innovation."
  );
  const [superPowersTitle, setSuperPowersTitle] = useState("Super powers");
  const [superPowers, setSuperPowers] = useState([
    "Interaction and UI design, user research",
    "Translating business strategy into intuitive digital products",
    "Bridging the gap between development, product, and stakeholders",
    "Driving product-market fit through iterative discovery and design",
    "Scaling and mentoring UX teams"
  ]);
  
  // Highlights section state
  const [highlightsTitle, setHighlightsTitle] = useState("Highlights");
  const [highlights, setHighlights] = useState([
    {
      title: "Awards & Patents",
      text: "6 U.S. patents and 2 medical device excellence awards for the t:slim insulin pump"
    },
    {
      title: "Product Launches",
      text: "Launched 0–1 products: Skype for Android Tablet, Skype Qik, t:slim insulin pump"
    }
  ]);
  
  // Leadership & Impact section state
  const [leadershipTitle, setLeadershipTitle] = useState("Leadership & Impact");
  const [leadershipItems, setLeadershipItems] = useState([
    {
      title: "Executive Leadership",
      text: "Trusted to lead cross-functional teams, influence at the exec level, and deliver results that increase user happiness and business value"
    },
    {
      title: "Strategic Partner",
      text: "Deep contributor and mentor in product strategy, product design, research, and design systems"
    },
    {
      title: "Versatile Skillset",
      text: "Skilled across multiple design disciplines: UX, UI, research, prototyping, systems thinking"
    }
  ]);
  
  // Expertise section state
  const [expertiseTitle, setExpertiseTitle] = useState("Expertise");
  const [expertiseItems, setExpertiseItems] = useState([
    {
      title: "Product Design",
      text: "Problem framing, wireframes, flows, prototypes, UI design"
    },
    {
      title: "Research",
      text: "Usability testing, card sorting, tree testing, quantitative data collection, KPIs"
    },
    {
      title: "Generative AI",
      text: "LLMs, RAG, MCP integrations"
    },
    {
      title: "Conversational Interfaces",
      text: "Chatbots, instant messaging, digital assistants"
    },
    {
      title: "Multi-Platform",
      text: "Desktop, responsive web, iOS/Android, wearables"
    },
    {
      title: "Enterprise Search",
      text: "Generative AI integrations, search architecture"
    }
  ]);
  
  // How I use AI section state
  const [howIUseAITitle, setHowIUseAITitle] = useState("How I use AI");
  const [howIUseAIItems, setHowIUseAIItems] = useState([
    {
      title: "Rapid Prototyping",
      text: "Use AI to quickly generate multiple design iterations, explore different UI patterns, and validate concepts before investing significant time in detailed mockups."
    },
    {
      title: "Research Analysis",
      text: "Leverage AI to analyze user research data, identify patterns in feedback, and extract actionable insights from large datasets more efficiently."
    },
    {
      title: "Content Generation",
      text: "Generate placeholder content, microcopy, and UX writing suggestions that align with brand voice and user needs."
    },
    {
      title: "Accessibility Testing",
      text: "Use AI tools to identify accessibility issues, suggest WCAG-compliant alternatives, and ensure inclusive design practices."
    },
    {
      title: "Design Systems",
      text: "Maintain consistency across products by using AI to suggest component usage, identify design token inconsistencies, and automate documentation."
    }
  ]);
  
  // Process section state
  const [processTitle, setProcessTitle] = useState("Process");
  const [processSubheading, setProcessSubheading] = useState("My process is dependent on the project needs, but ultimately involves");
  const [processItems, setProcessItems] = useState([
    {
      num: "1",
      title: "Discovery",
      items: ["Align on initial requirements: audience needs, business value, and tech constraints", "Audit current-state products or services"]
    },
    {
      num: "2",
      title: "Prototype",
      items: ["Low fidelity sketches", "Notes detailing potential structure and flow", "Vibe coding to create basic interactive prototypes", "Think through the basic requirements and flow", "Feed into AI tools like Lovable, Subframe, Cursor", "Iterate until a point of view is established for the concept"]
    },
    {
      num: "3",
      title: "Research",
      items: ["Talk to customers and review the prototype concepts", "Conduct competitive analysis", "Run user testing and/or benchmark studies", "Define and track success metrics (e.g., SEQ, task completion)"]
    },
    {
      num: "4",
      title: "Design",
      items: ["Define flows, IA, and wireframes at a more detailed level", "Visual and UI design", "Evolve prototypes and front end experience", "Deliver detailed designs and specifications"]
    },
    {
      num: "5",
      title: "Evaluate",
      items: ["Partner with developers and stakeholders during implementation", "Ensure expected behavior", "Conduct user acceptance testing (UAT)", "Conduct user testing if needed", "Measure impact post-launch and iterate based on feedback"]
    }
  ]);
  
  // Certifications & Tools section state
  const [certificationsTitle, setCertificationsTitle] = useState("Certifications");
  const [certificationsItems, setCertificationsItems] = useState([
    {
      badge: "SAFe",
      title: "Certified SAFe 4 Practitioner (SP)",
      org: "Scaled Agile"
    },
    {
      badge: "CSPO",
      title: "Certified Scrum Product Owner",
      org: "Scrum Alliance"
    }
  ]);
  
  const [toolsTitle, setToolsTitle] = useState("Tools");
  const [toolsCategories, setToolsCategories] = useState([
    {
      category: "Design and prototyping",
      tools: ["Pencil and paper", "Whiteboards", "Figma", "Figma Make", "Adobe CC", "Lovable", "Subframe", "Cursor", "MidJourney", "Google AI Studio"]
    },
    {
      category: "Research and analysis",
      tools: ["dScout", "UserZoom", "usertesting.com", "Optimal Workshop", "Gemini", "Perplexity", "ChatGPT", "Claude"]
    }
  ]);
  
  // Section order state
  const [sectionOrder, setSectionOrder] = useState([
    'bio',
    'superPowers',
    'highlights',
    'leadership',
    'expertise',
    'howIUseAI',
    'process',
    'certifications'
  ]);
  
  const [editedText, setEditedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [editedCardTitle, setEditedCardTitle] = useState("");
  const [editedCardText, setEditedCardText] = useState("");
  const [editedBadge, setEditedBadge] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  
  // Show more/less state for AI cards
  const [expandedAICards, setExpandedAICards] = useState(new Set());
  
  // Show more/less state for Highlights cards
  // Default Product Launches (idx 1) to expanded so content is visible
  const [expandedHighlights, setExpandedHighlights] = useState<Set<number>>(new Set([1]));

  // Debug logging for About page state
  useEffect(() => {
    console.log('📄 About page state check:');
    console.log('📄 bioParagraph1:', bioParagraph1);
    console.log('📄 bioParagraph2:', bioParagraph2);
    console.log('📄 superPowersTitle:', superPowersTitle);
    console.log('📄 superPowers:', superPowers);
    console.log('📄 highlightsTitle:', highlightsTitle);
    console.log('📄 highlights:', highlights);
    console.log('📄 leadershipTitle:', leadershipTitle);
    console.log('📄 leadershipItems:', leadershipItems);
  }, [bioParagraph1, bioParagraph2, superPowersTitle, superPowers, highlightsTitle, highlights, leadershipTitle, leadershipItems]);

  // Load profile data from Supabase (with fallback to hardcoded content)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('📥 Loading profile data from Supabase...');
        
        // Check authentication status
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();
        const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
        
        let profile = null;
        
        if (user || isBypassAuth) {
          // Authenticated user - load user-specific data
          const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055';
          console.log('📥 About page: Loading profile for authenticated user:', userId);
          profile = await getCurrentUserProfile();
        } else {
          // Not authenticated - load public data (most recent profile with data)
          console.log('📥 About page: Loading public profile data...');
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .not('bio_paragraph_1', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (error) {
            console.log('⚠️ About page: Error loading public profile:', error);
          } else {
            profile = data;
            console.log('📥 About page: Public profile data received:', profile);
          }
        }
        
        console.log('📥 Profile data received:', profile);
        
        if (profile) {
          console.log('✅ Profile found, updating state...');
          
          // Only update fields that have meaningful data (not empty strings or null)
          if (profile.bio_paragraph_1 && profile.bio_paragraph_1.trim()) {
            console.log('✅ Updating bio_paragraph_1');
            setBioParagraph1(profile.bio_paragraph_1);
          }
          
          if (profile.bio_paragraph_2 && profile.bio_paragraph_2.trim()) {
            console.log('✅ Updating bio_paragraph_2');
            setBioParagraph2(profile.bio_paragraph_2);
          }
          
          if (profile.super_powers_title && profile.super_powers_title.trim()) {
            setSuperPowersTitle(profile.super_powers_title);
          }
          
          if (profile.super_powers && Array.isArray(profile.super_powers) && profile.super_powers.length > 0) {
            setSuperPowers(profile.super_powers);
          }
          
          if (profile.highlights_title && profile.highlights_title.trim()) {
            setHighlightsTitle(profile.highlights_title);
          }
          
          if (profile.highlights && Array.isArray(profile.highlights) && profile.highlights.length > 0) {
            setHighlights(profile.highlights);
          }
          
          if (profile.leadership_title && profile.leadership_title.trim()) {
            setLeadershipTitle(profile.leadership_title);
          }
          
          if (profile.leadership_items && Array.isArray(profile.leadership_items) && profile.leadership_items.length > 0) {
            setLeadershipItems(profile.leadership_items);
          }
          
          if (profile.expertise_title && profile.expertise_title.trim()) {
            setExpertiseTitle(profile.expertise_title);
          }
          
          if (profile.expertise_items && Array.isArray(profile.expertise_items) && profile.expertise_items.length > 0) {
            setExpertiseItems(profile.expertise_items);
          }
          
          if (profile.how_i_use_ai_title && profile.how_i_use_ai_title.trim()) {
            setHowIUseAITitle(profile.how_i_use_ai_title);
          }
          
          if (profile.how_i_use_ai_items && Array.isArray(profile.how_i_use_ai_items) && profile.how_i_use_ai_items.length > 0) {
            setHowIUseAIItems(profile.how_i_use_ai_items);
          }
          
          if (profile.process_title && profile.process_title.trim()) {
            setProcessTitle(profile.process_title);
          }
          
          if (profile.process_subheading && profile.process_subheading.trim()) {
            setProcessSubheading(profile.process_subheading);
          }
          
          if (profile.process_items && Array.isArray(profile.process_items) && profile.process_items.length > 0) {
            setProcessItems(profile.process_items);
          }
          
          if (profile.certifications_title && profile.certifications_title.trim()) {
            setCertificationsTitle(profile.certifications_title);
          }
          
          if (profile.certifications_items && Array.isArray(profile.certifications_items) && profile.certifications_items.length > 0) {
            setCertificationsItems(profile.certifications_items);
          }
          
          if (profile.tools_title && profile.tools_title.trim()) {
            setToolsTitle(profile.tools_title);
          }
          
          if (profile.tools_categories && Array.isArray(profile.tools_categories) && profile.tools_categories.length > 0) {
            setToolsCategories(profile.tools_categories);
          }
          
          if (profile.section_order && Array.isArray(profile.section_order) && profile.section_order.length > 0) {
            setSectionOrder(profile.section_order);
          }
          
          console.log('✅ Profile state updated from Supabase');
          setDataLoadedFromSupabase(true); // Mark data as loaded, safe to save now
        } else {
          console.log('ℹ️ No profile found in Supabase, checking localStorage...');
          
          // Try to load from localStorage as fallback
          const savedProfile = localStorage.getItem('aboutPageProfile');
          if (savedProfile) {
            try {
              const profileData = JSON.parse(savedProfile);
              console.log('📥 Loading from localStorage:', profileData);
              
              // Update state with saved data
              if (profileData.bio_paragraph_1) setBioParagraph1(profileData.bio_paragraph_1);
              if (profileData.bio_paragraph_2) setBioParagraph2(profileData.bio_paragraph_2);
              if (profileData.super_powers_title) setSuperPowersTitle(profileData.super_powers_title);
              if (profileData.super_powers) setSuperPowers(profileData.super_powers);
              if (profileData.highlights_title) setHighlightsTitle(profileData.highlights_title);
              if (profileData.highlights) setHighlights(profileData.highlights);
              if (profileData.leadership_title) setLeadershipTitle(profileData.leadership_title);
              if (profileData.leadership_items) setLeadershipItems(profileData.leadership_items);
              if (profileData.expertise_title) setExpertiseTitle(profileData.expertise_title);
              if (profileData.expertise_items) setExpertiseItems(profileData.expertise_items);
              if (profileData.how_i_use_ai_title) setHowIUseAITitle(profileData.how_i_use_ai_title);
              if (profileData.how_i_use_ai_items) setHowIUseAIItems(profileData.how_i_use_ai_items);
              if (profileData.process_title) setProcessTitle(profileData.process_title);
              if (profileData.process_subheading) setProcessSubheading(profileData.process_subheading);
              if (profileData.process_items) setProcessItems(profileData.process_items);
              if (profileData.certifications_title) setCertificationsTitle(profileData.certifications_title);
              if (profileData.certifications_items) setCertificationsItems(profileData.certifications_items);
              if (profileData.tools_title) setToolsTitle(profileData.tools_title);
              if (profileData.tools_categories) setToolsCategories(profileData.tools_categories);
              if (profileData.section_order) setSectionOrder(profileData.section_order);
              
              console.log('✅ Loaded from localStorage');
              setDataLoadedFromSupabase(true); // Mark data as loaded (from localStorage), safe to save now
            } catch (parseError) {
              console.log('❌ Error parsing localStorage data:', parseError);
              setDataLoadedFromSupabase(true); // Even if parse fails, don't save defaults
            }
          } else {
            console.log('ℹ️ No localStorage data found, using hardcoded defaults');
            // If no data exists anywhere, allow saves (for first-time setup)
            setDataLoadedFromSupabase(true);
          }
        }
      } catch (error) {
        console.log('ℹ️ Error loading from Supabase, checking localStorage...', error);
        
        // Try to load from localStorage as fallback
        const savedProfile = localStorage.getItem('aboutPageProfile');
        if (savedProfile) {
          try {
            const profileData = JSON.parse(savedProfile);
            console.log('📥 Loading from localStorage:', profileData);
            
            // Update state with saved data
            if (profileData.bio_paragraph_1) setBioParagraph1(profileData.bio_paragraph_1);
            if (profileData.bio_paragraph_2) setBioParagraph2(profileData.bio_paragraph_2);
            if (profileData.super_powers_title) setSuperPowersTitle(profileData.super_powers_title);
            if (profileData.super_powers) setSuperPowers(profileData.super_powers);
            if (profileData.highlights_title) setHighlightsTitle(profileData.highlights_title);
            if (profileData.highlights) setHighlights(profileData.highlights);
            if (profileData.leadership_title) setLeadershipTitle(profileData.leadership_title);
            if (profileData.leadership_items) setLeadershipItems(profileData.leadership_items);
            if (profileData.expertise_title) setExpertiseTitle(profileData.expertise_title);
            if (profileData.expertise_items) setExpertiseItems(profileData.expertise_items);
            if (profileData.how_i_use_ai_title) setHowIUseAITitle(profileData.how_i_use_ai_title);
            if (profileData.how_i_use_ai_items) setHowIUseAIItems(profileData.how_i_use_ai_items);
            if (profileData.process_title) setProcessTitle(profileData.process_title);
            if (profileData.process_subheading) setProcessSubheading(profileData.process_subheading);
            if (profileData.process_items) setProcessItems(profileData.process_items);
            if (profileData.certifications_title) setCertificationsTitle(profileData.certifications_title);
            if (profileData.certifications_items) setCertificationsItems(profileData.certifications_items);
            if (profileData.tools_title) setToolsTitle(profileData.tools_title);
            if (profileData.tools_categories) setToolsCategories(profileData.tools_categories);
            if (profileData.section_order) setSectionOrder(profileData.section_order);
            
            console.log('✅ Loaded from localStorage');
            setDataLoadedFromSupabase(true); // Mark data as loaded (from localStorage), safe to save now
          } catch (parseError) {
            console.log('❌ Error parsing localStorage data:', parseError);
            setDataLoadedFromSupabase(true); // Even if parse fails, don't save defaults
          }
        } else {
          console.log('ℹ️ No localStorage data found, using hardcoded defaults');
          // If no data exists anywhere, allow saves (for first-time setup)
          setDataLoadedFromSupabase(true);
        }
      }
    };
    
    loadProfile();
  }, [getCurrentUserProfile]); // Now safe to include getCurrentUserProfile since it's memoized

  // Auto-save when state changes (debounced)
  // IMPORTANT: Only save if:
  // 1. Data has been loaded from Supabase/localStorage (prevents saving defaults)
  // 2. We're in production mode (prevents branch work from affecting production database)
  useEffect(() => {
    // Don't auto-save until data has been loaded - prevents saving defaults
    if (!dataLoadedFromSupabase) {
      console.log('⏸️ Auto-save paused: Waiting for data to load from Supabase/localStorage');
      return;
    }
    
    // Only auto-save in production mode - prevents branch work from affecting database
    // In development/branch mode, changes won't be saved to Supabase until merged to main
    const isProduction = import.meta.env.MODE === 'production';
    if (!isProduction) {
      console.log('⏸️ Auto-save disabled: Not in production mode. Changes on branches won\'t affect Supabase.');
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveToSupabase();
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [
    dataLoadedFromSupabase, // Include this in dependencies
    bioParagraph1, bioParagraph2, superPowersTitle, superPowers, 
    highlightsTitle, highlights, leadershipTitle, leadershipItems,
    expertiseTitle, expertiseItems, howIUseAITitle, howIUseAIItems,
    processTitle, processSubheading, processItems, certificationsTitle,
    certificationsItems, toolsTitle, toolsCategories, sectionOrder
  ]);

  // Save to Supabase
  const saveToSupabase = async () => {
    try {
      console.log('💾 About page: Attempting to save profile data to Supabase...');
      
      // Try to save to Supabase first
      const result = await updateCurrentUserProfile({
        bio_paragraph_1: bioParagraph1,
        bio_paragraph_2: bioParagraph2,
        super_powers_title: superPowersTitle,
        super_powers: superPowers,
        highlights_title: highlightsTitle,
        highlights: highlights,
        leadership_title: leadershipTitle,
        leadership_items: leadershipItems,
        expertise_title: expertiseTitle,
        expertise_items: expertiseItems,
        how_i_use_ai_title: howIUseAITitle,
        how_i_use_ai_items: howIUseAIItems,
        process_title: processTitle,
        process_subheading: processSubheading,
        process_items: processItems,
        certifications_title: certificationsTitle,
        certifications_items: certificationsItems,
        tools_title: toolsTitle,
        tools_categories: toolsCategories,
        section_order: sectionOrder
      });
      
      if (result) {
        console.log('✅ About page: Successfully saved to Supabase');
      } else {
        throw new Error('Supabase save failed');
      }
    } catch (error) {
      console.log('⚠️ About page: Supabase save failed, saving to localStorage instead:', error);
      
      // Fallback to localStorage
      const profileData = {
        bio_paragraph_1: bioParagraph1,
        bio_paragraph_2: bioParagraph2,
        super_powers_title: superPowersTitle,
        super_powers: superPowers,
        highlights_title: highlightsTitle,
        highlights: highlights,
        leadership_title: leadershipTitle,
        leadership_items: leadershipItems,
        expertise_title: expertiseTitle,
        expertise_items: expertiseItems,
        how_i_use_ai_title: howIUseAITitle,
        how_i_use_ai_items: howIUseAIItems,
        process_title: processTitle,
        process_subheading: processSubheading,
        process_items: processItems,
        certifications_title: certificationsTitle,
        certifications_items: certificationsItems,
        tools_title: toolsTitle,
        tools_categories: toolsCategories,
        section_order: sectionOrder,
      lastModified: new Date().toISOString()
    };
      
      localStorage.setItem('aboutPageProfile', JSON.stringify(profileData));
      console.log('✅ About page: Saved to localStorage as fallback');
    }
  };

  const handleEdit = (section: string, currentText: string) => {
    setEditingSection(section);
    setEditedText(currentText);
    setOriginalText(currentText);
  };

  const handleSave = (section: string) => {
    if (section === 'bio1') {
      setBioParagraph1(editedText);
    } else if (section === 'bio2') {
      setBioParagraph2(editedText);
    } else if (section === 'superPowersTitle') {
      setSuperPowersTitle(editedText);
    } else if (section === 'highlightsTitle') {
      setHighlightsTitle(editedText);
    } else if (section === 'leadershipTitle') {
      setLeadershipTitle(editedText);
    } else if (section === 'expertiseTitle') {
      setExpertiseTitle(editedText);
    } else if (section === 'howIUseAITitle') {
      setHowIUseAITitle(editedText);
    } else if (section === 'processTitle') {
      setProcessTitle(editedText);
    } else if (section === 'processSubheading') {
      setProcessSubheading(editedText);
    } else if (section === 'certificationsTitle') {
      setCertificationsTitle(editedText);
    } else if (section === 'toolsTitle') {
      setToolsTitle(editedText);
    } else if (section?.startsWith('power-')) {
      const index = parseInt(section?.replace('power-', '') || '0');
      const updated = [...superPowers];
      updated[index] = editedText;
      setSuperPowers(updated);
    }
    setEditingSection(null);
    setEditedText("");
    setOriginalText("");
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedText("");
    setOriginalText("");
  };

  const handleEditCard = (section: string, index: number, card: any) => {
    setEditingSection(`${section}-${index}`);
    setEditedCardTitle(card.title || card.category || "");
    if (card.text) {
      setEditedCardText(card.text);
    }
    if (card.org) {
      setEditedCardText(card.org);
    }
    if (card.badge) {
      setEditedBadge(card.badge);
    }
    if (card.items) {
      setEditedItems([...card.items]);
    }
    if (card.tools) {
      setEditedItems([...card.tools]);
    }
  };

  const handleSaveCard = (section: string, index: number) => {
    if (section === 'highlight') {
      const updated = [...highlights];
      updated[index] = {
        title: editedCardTitle,
        text: editedCardText
      };
      setHighlights(updated);
    } else if (section === 'leadership') {
      const updated = [...leadershipItems];
      updated[index] = {
        title: editedCardTitle,
        text: editedCardText
      };
      setLeadershipItems(updated);
    } else if (section === 'expertise') {
      const updated = [...expertiseItems];
      updated[index] = {
        title: editedCardTitle,
        text: editedCardText
      };
      setExpertiseItems(updated);
    } else if (section === 'ai') {
      const updated = [...howIUseAIItems];
      updated[index] = {
        title: editedCardTitle,
        text: editedCardText
      };
      setHowIUseAIItems(updated);
    } else if (section === 'process') {
      const updated = [...processItems];
      updated[index] = {
        ...updated[index],
        title: editedCardTitle,
        items: editedItems
      };
      setProcessItems(updated);
    } else if (section === 'certification') {
      const updated = [...certificationsItems];
      updated[index] = {
        badge: editedBadge,
        title: editedCardTitle,
        org: editedCardText
      };
      setCertificationsItems(updated);
    } else if (section === 'tools') {
      const updated = [...toolsCategories];
      updated[index] = {
        category: editedCardTitle,
        tools: editedItems
      };
      setToolsCategories(updated);
    }
    
    setEditingSection(null);
    setEditedCardTitle("");
    setEditedCardText("");
    setEditedBadge("");
    setEditedItems([]);
  };

  const handleCancelCard = () => {
    setEditingSection(null);
    setEditedCardTitle("");
    setEditedCardText("");
    setEditedBadge("");
    setEditedItems([]);
  };

  const toggleAICard = (index: number) => {
    const newExpanded = new Set(expandedAICards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedAICards(newExpanded);
  };

  // Helper to check if text needs truncation (more than 4 lines)
  const shouldTruncateText = (text: string | undefined): boolean => {
    // Approximate: ~60 chars per line, 4 lines = ~240 chars
    return Boolean(text && text.length > 240);
  };

  // Process items management
  const handleProcessItemChange = (index: number, value: string) => {
    const updated = [...editedItems];
    updated[index] = value;
    setEditedItems(updated);
  };

  const handleAddProcessItem = () => {
    setEditedItems([...editedItems, ""]);
  };

  const handleRemoveProcessItem = (index: number) => {
    const updated = editedItems.filter((_, i) => i !== index);
    setEditedItems(updated);
  };

  // Section reordering functions
  const moveSectionUp = (sectionId: string) => {
    const index = sectionOrder?.indexOf(sectionId) ?? -1;
    if (index > 0) {
      const newOrder = [...sectionOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setSectionOrder(newOrder);
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const index = sectionOrder?.indexOf(sectionId) ?? -1;
    if (index < (sectionOrder?.length ?? 0) - 1) {
      const newOrder = [...sectionOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setSectionOrder(newOrder);
    }
  };

  const handleResumeClick = () => {
    window.open('https://drive.google.com/file/d/1hg8kZdI88t0a3XP2sb-VhQCHy0KhzTfR/view?usp=drive_link', '_blank');
  };

  // Section Reorder Controls Component
  const SectionControls = ({ 
    sectionId,
    label
  }: { 
    sectionId: string;
    label: string;
  }) => {
    if (!isEditMode) return null;
    
    const index = sectionOrder?.indexOf(sectionId) ?? -1;
    const isFirst = index === 0;
    const isLast = index === (sectionOrder?.length ?? 0) - 1;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm"
      >
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveSectionUp(sectionId)}
            disabled={isFirst}
            className="rounded-full p-2"
            title="Move section up"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveSectionDown(sectionId)}
            disabled={isLast}
            className="rounded-full p-2"
            title="Move section down"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            {label} Section - Position {index + 1} of {sectionOrder?.length ?? 0}
          </span>
        </div>
      </motion.div>
    );
  };

  const resumeButton = (
    <motion.div
      className="rounded-full p-[2px] w-full lg:w-auto"
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
        onClick={(e) => {
          handleResumeClick();
          e.currentTarget.blur(); // Remove focus after click
        }}
        className="relative rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm hover:bg-background/60 cursor-pointer w-full lg:w-auto h-[52px] flex items-center justify-center"
      >
        <span className="relative z-10 text-foreground font-bold flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          Resume
        </span>
      </button>
    </motion.div>
  );

  return (
    <PageLayout 
      title="About" 
      onBack={onBack}
    >
      <div 
        className="space-y-16 flex flex-col"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingLeft: '24px',
          paddingRight: '24px',
          marginTop: '60px'
        }}
      >
        {/* Bio Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onMouseEnter={() => {
            console.log('🖱️ Bio section hover enter - triggering background blur');
            onHoverChange?.(true);
          }}
          onMouseLeave={() => {
            console.log('🖱️ Bio section hover leave - removing background blur');
            onHoverChange?.(false);
          }}
          className="relative p-10 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/40 dark:from-black/15 dark:via-slate-950/12 dark:to-black/10 backdrop-blur-md hover:backdrop-blur-lg rounded-3xl border border-border shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]"
          style={{ order: sectionOrder?.indexOf('bio') ?? 0 }}
        >
          {/* Decorative Curved Brushstrokes - Far right near dots, bleeding off edges */}
          <svg
            className="absolute right-0 top-0 h-full w-[30%] pointer-events-none"
            viewBox="0 0 300 800"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bio-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="bio-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="bio-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Curved Line 1 - Far right, flows vertically and bleeds off top */}
            <motion.path
              d="M150,-100 Q180,0 200,100 Q220,200 230,300 Q240,400 260,500"
              fill="none"
              stroke="url(#bio-gradient-1)"
              strokeWidth="58"
              strokeLinecap="round"
              opacity="0.5"
              initial={{ d: "M150,-100 Q180,0 200,100 Q220,200 230,300 Q240,400 260,500" }}
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
              stroke="url(#bio-gradient-2)"
              strokeWidth="54"
              strokeLinecap="round"
              opacity="0.55"
              initial={{ d: "M120,200 Q160,250 190,300 Q220,350 250,380 Q280,410 350,460" }}
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
              stroke="url(#bio-gradient-3)"
              strokeWidth="52"
              strokeLinecap="round"
              opacity="0.48"
              initial={{ d: "M180,520 Q210,600 230,680 Q250,760 270,840 Q290,900 330,960" }}
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
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
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
              transition={{
                duration: 17,
                repeat: Infinity,
                ease: "easeInOut",
              }}
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

          <div className="max-w-4xl relative z-10">
            <SectionControls sectionId="bio" label="Bio" />
            
            {/* Edit buttons for bio paragraphs */}
            {isEditMode && editingSection !== 'bio1' && editingSection !== 'bio2' && (
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit('bio1', bioParagraph1)}
                  className="rounded-full"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit Bio Intro
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit('bio2', bioParagraph2)}
                  className="rounded-full"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit Bio Details
                </Button>
              </div>
            )}

            {/* First paragraph - editable */}
            {editingSection === 'bio1' ? (
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium">Bio Introduction</label>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[120px] text-lg"
                  placeholder="Enter bio introduction..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('bio1')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xl leading-relaxed mb-6">
                {bioParagraph1}
              </p>
            )}

            {/* Second paragraph - editable */}
            {editingSection === 'bio2' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium">Bio Details</label>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[120px] text-lg"
                  placeholder="Enter bio details..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('bio2')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xl leading-relaxed text-muted-foreground">
                {bioParagraph2}
              </p>
            )}
            
            {/* Resume Button - All screen sizes, below text */}
            <div className="mt-8 flex justify-start">
              {resumeButton}
            </div>
          </div>
        </motion.div>

        {/* Super Powers - Grid Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ order: sectionOrder?.indexOf('superPowers') ?? 1 }}
        >
          <SectionControls sectionId="superPowers" label="Super Powers" />
          
          <div className="mb-8 flex items-center gap-4">
            {isEditMode && editingSection === 'superPowersTitle' ? (
              <div className="flex-1 space-y-4">
                <label className="block text-sm font-medium">Section Title</label>
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Enter section title..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('superPowersTitle')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="flex-1">{superPowersTitle}</h2>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('superPowersTitle', superPowersTitle)}
                    className="flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {superPowers?.map((powerText, index) => {
              const icons = [Zap, Target, Users, Rocket, Sparkles];
              const colors = [
                "text-yellow-600 dark:text-yellow-400",
                "text-blue-600 dark:text-blue-400",
                "text-purple-600 dark:text-purple-400",
                "text-green-600 dark:text-green-400",
                "text-pink-600 dark:text-pink-400"
              ];
              const PowerIcon = icons[index % icons.length];
              const iconColor = colors[index % colors.length];
              
              return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ 
                  y: -12, 
                  scale: 1.05,
                  rotate: index % 2 === 0 ? 1 : -1,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25 
                  }
                }}
                whileTap={{ scale: 0.98 }}
                className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md hover:backdrop-blur-lg rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                style={{
                  transform: 'translateZ(0)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Fun animated decorative elements */}
                <svg
                  className="absolute right-0 top-0 h-full w-[35%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  viewBox="0 0 100 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Playful curved line */}
                  <motion.path
                    d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                    fill="none"
                    stroke={iconColor.includes('yellow') ? '#fbbf24' : 
                           iconColor.includes('blue') ? '#3b82f6' :
                           iconColor.includes('purple') ? '#8b5cf6' :
                           iconColor.includes('green') ? '#10b981' :
                           '#ec4899'}
                    strokeWidth="18"
                    strokeLinecap="round"
                    className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                    style={{
                      opacity: 0,
                      strokeDasharray: 1000,
                      strokeDashoffset: 1000,
                    }}
                  />
                </svg>

                {/* Bouncy decorative dots */}
                {[
                  { x: '75%', y: '20%', size: 6, delay: 0 },
                  { x: '85%', y: '45%', size: 5, delay: 0.1 },
                  { x: '80%', y: '75%', size: 7, delay: 0.2 },
                  { x: '90%', y: '30%', size: 5, delay: 0.15 },
                  { x: '78%', y: '60%', size: 6, delay: 0.25 },
                ].map((dot, dotIndex) => (
                  <motion.div
                    key={dotIndex}
                    className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                    style={{
                      left: dot.x,
                      top: dot.y,
                      width: `${dot.size}px`,
                      height: `${dot.size}px`,
                      background: iconColor.includes('yellow') ? '#fbbf24' : 
                                 iconColor.includes('blue') ? '#3b82f6' :
                                 iconColor.includes('purple') ? '#8b5cf6' :
                                 iconColor.includes('green') ? '#10b981' :
                                 '#ec4899',
                      boxShadow: `0 0 ${dot.size * 2}px ${iconColor.includes('yellow') ? '#fbbf24' : 
                                 iconColor.includes('blue') ? '#3b82f6' :
                                 iconColor.includes('purple') ? '#8b5cf6' :
                                 iconColor.includes('green') ? '#10b981' :
                                 '#ec4899'}40`,
                      animationDelay: `${dot.delay}s`,
                    }}
                  />
                ))}

                {/* Gradient glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${
                      iconColor.includes('yellow') ? '#fbbf2420' : 
                      iconColor.includes('blue') ? '#3b82f620' :
                      iconColor.includes('purple') ? '#8b5cf620' :
                      iconColor.includes('green') ? '#10b98120' :
                      '#ec489920'
                    }, transparent 70%)`,
                  }}
                />

                {/* Content with z-depth */}
                <div className="relative z-10">
                  {isEditMode && editingSection === `power-${index}` ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium">Edit Super Power</label>
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="min-h-[80px]"
                        placeholder="Describe this super power..."
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSave(`power-${index}`)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className={`p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl ${iconColor} shadow-md transition-all duration-300 group-hover:shadow-xl flex-shrink-0 group-hover:animate-[wiggleIcon_0.5s_ease-in-out_forwards]`}
                        style={{ transform: 'translateZ(10px)' }}
                      >
                        <PowerIcon className="w-6 h-6" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="leading-relaxed">{powerText}</p>
                      </div>
                      {isEditMode && editingSection !== `power-${index}` && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(`power-${index}`, powerText)}
                          className="ml-auto flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
            })}
          </div>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ order: sectionOrder?.indexOf('highlights') ?? 2 }}
        >
          <SectionControls sectionId="highlights" label="Highlights" />
          
          <motion.div 
            whileHover={{ 
              y: -12, 
              scale: 1.05,
              rotate: 0.5,
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 25 
              }
            }}
            whileTap={{ scale: 0.98 }}
            className="relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md hover:backdrop-blur-lg rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            style={{
              transform: 'translateZ(0)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Animated decorative elements */}
            <svg
              className="absolute right-0 top-0 h-full w-[25%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              viewBox="0 0 100 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="18"
                strokeLinecap="round"
                className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                style={{
                  opacity: 0,
                  strokeDasharray: 1000,
                  strokeDashoffset: 1000,
                }}
              />
            </svg>

            {/* Bouncy dots */}
            {[
              { x: '85%', y: '20%', size: 6, delay: 0 },
              { x: '90%', y: '50%', size: 7, delay: 0.1 },
              { x: '88%', y: '80%', size: 5, delay: 0.2 },
            ].map((dot, dotIndex) => (
              <motion.div
                key={dotIndex}
                className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                style={{
                  left: dot.x,
                  top: dot.y,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  background: '#fbbf24',
                  boxShadow: `0 0 ${dot.size * 2}px #fbbf2440`,
                  animationDelay: `${dot.delay}s`,
                }}
              />
            ))}

            {/* Gradient glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #fbbf2420, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              {/* Section Title - Editable */}
              <div className="flex items-center gap-3 mb-6">
                {isEditMode && editingSection === 'highlightsTitle' ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="text-2xl font-bold"
                      placeholder="Section title..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('highlightsTitle')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3>{highlightsTitle}</h3>
                    {isEditMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit('highlightsTitle', highlightsTitle)}
                        className="ml-auto"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highlights?.map((item, idx) => {
                // Check if content is long enough to need "show more"
                // Count lines in markdown content (accounting for bullets, headers, etc.)
                const contentLines = item.text?.split('\n').filter(line => line.trim()).length || 0;
                // Only Product Launches card (idx 1) needs expansion if it has more than ~6 lines
                // This accounts for markdown formatting (bullets, sections, etc.)
                const needsExpansion = contentLines > 6 && idx === 1;
                // Check if this card is expanded (Product Launches defaults to expanded)
                const isExpanded = expandedHighlights.has(idx);
                
                const toggleHighlight = () => {
                  setExpandedHighlights(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(idx)) {
                      newSet.delete(idx);
                    } else {
                      newSet.add(idx);
                    }
                    return newSet;
                  });
                };
                
                return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="flex flex-col gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-border/30 hover:border-border/50 transition-all duration-300"
                >
                  {isEditMode && editingSection === `highlight-${idx}` ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Title</label>
                        <Input
                          value={editedCardTitle}
                          onChange={(e) => setEditedCardTitle(e.target.value)}
                          placeholder="Card title..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Content</label>
                        <Textarea
                          value={editedCardText}
                          onChange={(e) => setEditedCardText(e.target.value)}
                          className="min-h-[100px] font-mono text-sm"
                          placeholder="Card content... (Markdown supported: * bullets, ** bold **, * italic *)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tip: Use * or - for bullet points, ** for bold text
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancelCard}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveCard('highlight', idx)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 ${idx === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'} flex-shrink-0`}>
                        {idx === 0 ? <Award className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-2">{item.title}</h4>
                        <div className={`text-muted-foreground leading-relaxed ${needsExpansion && !isExpanded ? 'line-clamp-6' : ''}`}>
                          <MarkdownRenderer content={item.text} variant="compact" />
                        </div>
                        {needsExpansion && (
                          <button
                            onClick={(e) => {
                              toggleHighlight();
                              e.currentTarget.blur();
                            }}
                            className="mt-3 flex items-center gap-1 text-sm font-medium transition-all relative cursor-pointer hover:translate-x-0.5 text-primary hover:text-primary/80"
                          >
                            <motion.span
                              className="inline-block"
                              animate={{
                                backgroundImage: [
                                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                  "linear-gradient(180deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)",
                                  "linear-gradient(225deg, #ec4899 0%, #3b82f6 50%, #8b5cf6 100%)",
                                  "linear-gradient(270deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                ],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              style={{
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </motion.span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCard('highlight', idx, item)}
                          className="flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>
          </div>
          </motion.div>
        </motion.div>

        {/* Leadership & Impact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{ order: sectionOrder?.indexOf('leadership') ?? 3 }}
        >
          <SectionControls sectionId="leadership" label="Leadership & Impact" />
          
          <motion.div 
              whileHover={{ 
                y: -12, 
                scale: 1.05,
                rotate: 0.5,
                transition: { 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }
              }}
              whileTap={{ scale: 0.98 }}
              className="lg:col-span-2 relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md hover:backdrop-blur-lg rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              style={{
                transform: 'translateZ(0)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Animated decorative elements */}
              <svg
                className="absolute right-0 top-0 h-full w-[25%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                viewBox="0 0 100 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="18"
                  strokeLinecap="round"
                  className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                  style={{
                    opacity: 0,
                    strokeDasharray: 1000,
                    strokeDashoffset: 1000,
                  }}
                />
              </svg>

              {/* Bouncy dots */}
              {[
                { x: '85%', y: '20%', size: 6, delay: 0 },
                { x: '90%', y: '50%', size: 7, delay: 0.1 },
                { x: '88%', y: '80%', size: 5, delay: 0.2 },
              ].map((dot, dotIndex) => (
                <motion.div
                  key={dotIndex}
                  className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                  style={{
                    left: dot.x,
                    top: dot.y,
                    width: `${dot.size}px`,
                    height: `${dot.size}px`,
                    background: '#8b5cf6',
                    boxShadow: `0 0 ${dot.size * 2}px #8b5cf640`,
                    animationDelay: `${dot.delay}s`,
                  }}
                />
              ))}

              {/* Gradient glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #8b5cf620, transparent 70%)',
                }}
              />

              <div className="relative z-10">
                {/* Section Title - Editable */}
                <div className="flex items-center gap-3 mb-6">
                  {isEditMode && editingSection === 'leadershipTitle' ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="text-2xl font-bold"
                        placeholder="Section title..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSave('leadershipTitle')}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{leadershipTitle}</h3>
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit('leadershipTitle', leadershipTitle)}
                          className="ml-auto"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {leadershipItems?.map((item, idx) => {
                    const icons = [TrendingUp, Lightbulb, Boxes];
                    const colors = [
                      "text-green-600 dark:text-green-400",
                      "text-yellow-600 dark:text-yellow-400",
                      "text-purple-600 dark:text-purple-400"
                    ];
                    const Icon = icons[idx % icons.length];
                    const colorClass = colors[idx % colors.length];
                    
                    return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                      className="flex flex-col gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-border/30 hover:border-border/50 transition-all duration-300"
                    >
                      {isEditMode && editingSection === `leadership-${idx}` ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Card Title</label>
                            <Input
                              value={editedCardTitle}
                              onChange={(e) => setEditedCardTitle(e.target.value)}
                              placeholder="Card title..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Card Content</label>
                            <Textarea
                              value={editedCardText}
                              onChange={(e) => setEditedCardText(e.target.value)}
                              className="min-h-[120px] font-mono text-sm"
                              placeholder="Card content... (Markdown supported: * bullets, ** bold **, * italic *)"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Tip: Use * or - for bullet points, ** for bold text
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={handleCancelCard}>
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => handleSaveCard('leadership', idx)}>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 ${colorClass} flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-2">{item.title}</h4>
                            <div className="text-muted-foreground leading-relaxed">
                              <MarkdownRenderer content={item.text} variant="compact" />
                            </div>
                          </div>
                          {isEditMode && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCard('leadership', idx, item)}
                              className="flex-shrink-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>

        {/* Expertise - Clean Grid Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ order: sectionOrder?.indexOf('expertise') ?? 4 }}
        >
          <SectionControls sectionId="expertise" label="Expertise" />
          
          {/* Section Title - Editable */}
          <div className="mb-8 flex items-center gap-4">
            {isEditMode && editingSection === 'expertiseTitle' ? (
              <div className="flex-1 space-y-4">
                <label className="block text-sm font-medium">Section Title</label>
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Section title..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('expertiseTitle')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="flex-1">{expertiseTitle}</h2>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('expertiseTitle', expertiseTitle)}
                    className="flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {expertiseItems?.map((item, idx) => {
              const gradients = [
                "linear-gradient(135deg, #ec4899, #8b5cf6)",
                "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                "linear-gradient(135deg, #3b82f6, #fbbf24)",
                "linear-gradient(135deg, #fbbf24, #ec4899)",
                "linear-gradient(135deg, #ec4899, #3b82f6)",
                "linear-gradient(135deg, #8b5cf6, #fbbf24)"
              ];
              const gradient = gradients[idx % gradients.length];
              
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.05 }}
                  whileHover={{ 
                    x: 4,
                    transition: { 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }
                  }}
                  className="relative pl-5 pr-5 py-5 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  {/* Gradient color strip on the left */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{
                      background: gradient
                    }}
                  />
                  
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none rounded-lg"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
                      backgroundSize: '24px 24px'
                    }}
                  />
                  
                  {isEditMode && editingSection === `expertise-${idx}` ? (
                    <div className="relative space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Title</label>
                        <Input
                          value={editedCardTitle}
                          onChange={(e) => setEditedCardTitle(e.target.value)}
                          placeholder="Card title..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Content</label>
                        <Textarea
                          value={editedCardText}
                          onChange={(e) => setEditedCardText(e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Card content..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancelCard}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveCard('expertise', idx)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <h4 className="mb-2 group-hover:translate-x-1 transition-transform duration-300">{item.title}</h4>
                          <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                        </div>
                        {isEditMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCard('expertise', idx, item)}
                            className="flex-shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient accent dot */}
                  <div 
                    className="absolute top-5 right-5 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: gradient
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How I use AI - Uniform Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ order: sectionOrder?.indexOf('howIUseAI') ?? 5 }}
        >
          <SectionControls sectionId="howIUseAI" label="How I Use AI" />
          
          {/* Section Title - Editable */}
          <div className="mb-8 flex items-center gap-4">
            {isEditMode && editingSection === 'howIUseAITitle' ? (
              <div className="flex-1 space-y-4">
                <label className="block text-sm font-medium">Section Title</label>
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Section title..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('howIUseAITitle')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="flex-1">{howIUseAITitle}</h2>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('howIUseAITitle', howIUseAITitle)}
                    className="flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
            {howIUseAIItems?.map((item, index) => {
              const icons = [Lightbulb, TrendingUp, Boxes, BarChart3, PenTool];
              const iconColors = [
                "text-yellow-600 dark:text-yellow-400",
                "text-blue-600 dark:text-blue-400",
                "text-purple-600 dark:text-purple-400",
                "text-green-600 dark:text-green-400",
                "text-pink-600 dark:text-pink-400"
              ];
              
              const Icon = icons[index % icons.length];
              const iconColor = iconColors[index % iconColors.length];
              
              // Check if text needs truncation (more than 4 lines ~ 240 chars)
              const needsTruncate = shouldTruncateText(item.text);
              const isExpanded = expandedAICards.has(index);
              
              // Truncate to approximately 4 lines (240 chars)
              const displayText = !needsTruncate || isExpanded 
                ? item.text 
                : item.text.substring(0, 240).trim() + '...';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ 
                    y: -12, 
                    scale: 1.05,
                    rotate: index % 2 === 0 ? 1 : -1,
                    transition: { 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                  style={{
                    transform: 'translateZ(0)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Fun animated decorative elements */}
                  <svg
                    className="absolute right-0 top-0 h-full w-[35%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    viewBox="0 0 100 200"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <motion.path
                      d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                      fill="none"
                      stroke={iconColor.includes('yellow') ? '#fbbf24' : 
                             iconColor.includes('blue') ? '#3b82f6' :
                             iconColor.includes('purple') ? '#8b5cf6' :
                             iconColor.includes('green') ? '#10b981' :
                             iconColor.includes('pink') ? '#ec4899' :
                             '#6366f1'}
                      strokeWidth="18"
                      strokeLinecap="round"
                      className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                      style={{
                        opacity: 0,
                        strokeDasharray: 1000,
                        strokeDashoffset: 1000,
                      }}
                    />
                  </svg>

                  {/* Bouncy decorative dots */}
                  {[
                    { x: '75%', y: '20%', size: 6, delay: 0 },
                    { x: '85%', y: '45%', size: 5, delay: 0.1 },
                    { x: '80%', y: '75%', size: 7, delay: 0.2 },
                    { x: '90%', y: '30%', size: 5, delay: 0.15 },
                    { x: '78%', y: '60%', size: 6, delay: 0.25 },
                  ].map((dot, dotIndex) => (
                    <motion.div
                      key={dotIndex}
                      className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                      style={{
                        left: dot.x,
                        top: dot.y,
                        width: `${dot.size}px`,
                        height: `${dot.size}px`,
                        background: iconColor.includes('yellow') ? '#fbbf24' : 
                                   iconColor.includes('blue') ? '#3b82f6' :
                                   iconColor.includes('purple') ? '#8b5cf6' :
                                   iconColor.includes('green') ? '#10b981' :
                                   iconColor.includes('pink') ? '#ec4899' :
                                   '#6366f1',
                        boxShadow: `0 0 ${dot.size * 2}px ${iconColor.includes('yellow') ? '#fbbf24' : 
                                   iconColor.includes('blue') ? '#3b82f6' :
                                   iconColor.includes('purple') ? '#8b5cf6' :
                                   iconColor.includes('green') ? '#10b981' :
                                   iconColor.includes('pink') ? '#ec4899' :
                                   '#6366f1'}40`,
                        animationDelay: `${dot.delay}s`,
                      }}
                    />
                  ))}

                  {/* Gradient glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${
                        iconColor.includes('yellow') ? '#fbbf2420' : 
                        iconColor.includes('blue') ? '#3b82f620' :
                        iconColor.includes('purple') ? '#8b5cf620' :
                        iconColor.includes('green') ? '#10b98120' :
                        iconColor.includes('pink') ? '#ec489920' :
                        '#6366f120'
                      }, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  {isEditMode && editingSection === `ai-${index}` ? (
                    <div className="relative z-10 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Title</label>
                        <Input
                          value={editedCardTitle}
                          onChange={(e) => setEditedCardTitle(e.target.value)}
                          placeholder="Card title..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Content</label>
                        <Textarea
                          value={editedCardText}
                          onChange={(e) => setEditedCardText(e.target.value)}
                          className="min-h-[120px]"
                          placeholder="Card content..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancelCard}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveCard('ai', index)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <motion.div 
                          className={`p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl ${iconColor} shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:animate-[wiggleIcon_0.5s_ease-in-out_forwards]`}
                          style={{ transform: 'translateZ(10px)' }}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                        <motion.h3 
                          className="flex-1" 
                          style={{ transform: 'translateZ(5px)' }}
                        >
                          {item.title}
                        </motion.h3>
                        {isEditMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCard('ai', index, item)}
                            className="flex-shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {displayText}
                      </p>
                      {needsTruncate && (
                        <button
                          onClick={(e) => {
                            toggleAICard(index);
                            e.currentTarget.blur();
                          }}
                          className="mt-3 flex items-center gap-1 text-sm font-medium transition-all relative cursor-pointer hover:translate-x-0.5"
                        >
                          <motion.span
                            className="inline-block"
                            animate={{
                              backgroundImage: [
                                "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                "linear-gradient(180deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)",
                                "linear-gradient(225deg, #ec4899 0%, #3b82f6 50%, #8b5cf6 100%)",
                                "linear-gradient(270deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                              ],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            style={{
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </motion.span>
                          {isExpanded ? (
                            <ChevronUp className={`w-4 h-4 ${iconColor}`} />
                          ) : (
                            <ChevronDown className={`w-4 h-4 ${iconColor}`} />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Process - Grid with Expandable Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ order: sectionOrder?.indexOf('process') ?? 6 }}
        >
          <SectionControls sectionId="process" label="Process" />
          
          {/* Section Title and Subheading - Editable */}
          <div className="mb-8">
            {isEditMode && editingSection === 'processTitle' ? (
              <div className="space-y-4 mb-4">
                <label className="block text-sm font-medium">Section Title</label>
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Section title..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('processTitle')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 mb-2">
                <h2 className="flex-1">{processTitle}</h2>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('processTitle', processTitle)}
                    className="flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
            
            {isEditMode && editingSection === 'processSubheading' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium">Subheading</label>
                <Input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="Subheading text..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave('processSubheading')}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground flex-1">{processSubheading}</p>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('processSubheading', processSubheading)}
                    className="flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <Accordion type="multiple" defaultValue={["item-0"]} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processItems?.map((step, index) => {
              const gradients = [
                "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                "linear-gradient(135deg, #8b5cf6, #ec4899)",
                "linear-gradient(135deg, #ec4899, #fbbf24)",
                "linear-gradient(135deg, #fbbf24, #10b981)",
                "linear-gradient(135deg, #10b981, #3b82f6)"
              ];
              const icons = ["🔍", "✏️", "📊", "🎨", "✓"];
              const gradient = gradients[index % gradients.length];
              const icon = icons[index % icons.length];
              
              return (
              <AccordionItem key={index} value={`item-${index}`} className="border-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.08 }}
                  className="h-full"
                >
                  {isEditMode && editingSection === `process-${index}` ? (
                    <div className="h-full bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Title</label>
                        <Input
                          value={editedCardTitle}
                          onChange={(e) => setEditedCardTitle(e.target.value)}
                          placeholder="Card title..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Steps/Items</label>
                        {editedItems?.map((item, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input
                              value={item}
                              onChange={(e) => handleProcessItemChange(i, e.target.value)}
                              placeholder={`Step ${i + 1}...`}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProcessItem(i)}
                              disabled={editedItems?.length <= 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddProcessItem}
                          className="mt-2"
                        >
                          + Add Step
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-2">
                        <Button size="sm" variant="outline" onClick={handleCancelCard}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveCard('process', index)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative cursor-pointer">
                      {/* Gradient top border */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                        style={{
                          background: gradient
                        }}
                      />

                      {/* Header Container - for positioning edit button */}
                      <div className="relative">
                        {/* Header - Always visible */}
                        <AccordionTrigger className="px-5 pt-6 pb-4 hover:no-underline w-full [&[data-state=open]]:pb-3 cursor-pointer no-focus-ring">
                          <div className="flex items-start gap-4 w-full">
                            {/* Number badge with white background and colored number */}
                            <div 
                              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-md transition-all duration-300 group-hover:scale-105"
                            >
                              <span 
                                className="text-xl font-bold bg-clip-text text-transparent"
                                style={{
                                  backgroundImage: gradient
                                }}
                              >
                                {step.num}
                              </span>
                            </div>
                            
                            {/* Title */}
                            <div className="flex-1 text-left">
                              <h3 className="mb-1">{step.title}</h3>
                              <p className="text-sm text-muted-foreground/70">{step.items?.length || 0} steps</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        {/* Edit button - positioned absolutely to avoid nesting inside button */}
                        {isEditMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCard('process', index, step);
                            }}
                            className="absolute top-6 right-5 z-10"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Expandable content */}
                      <AccordionContent className="px-5 pb-5">
                        <ul className="space-y-3 pt-2">
                          {step.items?.map((item, i) => (
                            <li 
                              key={i}
                              className="text-muted-foreground text-sm leading-relaxed flex items-start gap-2.5"
                            >
                              <span 
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                                style={{
                                  background: gradient
                                }}
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </div>
                  )}
                </motion.div>
              </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Certifications & Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ order: sectionOrder?.indexOf('certifications') ?? 7 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="lg:col-span-2">
            <SectionControls sectionId="certifications" label="Certifications & Tools" />
          </div>
          
          {/* Certifications */}
          <motion.div
            whileHover={{ 
              y: -8,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }
            }}
            className="relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
          >
            {/* Gradient accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: "linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)"
              }}
            />
            
            {/* Section Title - Editable */}
            <div className="flex items-center gap-3 mb-6">
              {isEditMode && editingSection === 'certificationsTitle' ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Section title..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('certificationsTitle')}>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="flex-1">{certificationsTitle}</h2>
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('certificationsTitle', certificationsTitle)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="space-y-5">
              {certificationsItems?.map((cert, idx) => {
                const gradients = [
                  "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                ];
                const gradient = gradients[idx % gradients.length];
                
                return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + idx * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-border/20 hover:border-border/40 transition-all duration-300"
                >
                  {isEditMode && editingSection === `certification-${idx}` ? (
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Badge/Acronym</label>
                        <Input
                          value={editedBadge}
                          onChange={(e) => setEditedBadge(e.target.value)}
                          placeholder="e.g., SAFe, CSPO..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Certification Title</label>
                        <Input
                          value={editedCardTitle}
                          onChange={(e) => setEditedCardTitle(e.target.value)}
                          placeholder="Full certification name..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Organization</label>
                        <Input
                          value={editedCardText}
                          onChange={(e) => setEditedCardText(e.target.value)}
                          placeholder="Issuing organization..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancelCard}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveCard('certification', idx)}>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-sm font-semibold shadow-md"
                        style={{
                          background: gradient
                        }}
                      >
                        {cert.badge}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1">{cert.title}</p>
                        <p className="text-sm text-muted-foreground">{cert.org}</p>
                      </div>
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCard('certification', idx, cert)}
                          className="flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Tools */}
          <motion.div
            whileHover={{ 
              y: -8,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }
            }}
            className="relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
          >
            {/* Gradient accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: "linear-gradient(90deg, #a855f7, #3b82f6, #06b6d4)"
              }}
            />
            
            {/* Section Title - Editable */}
            <div className="flex items-center gap-3 mb-6">
              {isEditMode && editingSection === 'toolsTitle' ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Section title..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('toolsTitle')}>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="flex-1">{toolsTitle}</h2>
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('toolsTitle', toolsTitle)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <Accordion type="multiple" defaultValue={["tool-0"]} className="space-y-4">
              {toolsCategories?.map((section, idx) => {
                const gradients = [
                  "linear-gradient(135deg, #a855f7, #3b82f6)",
                  "linear-gradient(135deg, #3b82f6, #06b6d4)"
                ];
                const gradient = gradients[idx % gradients.length];
                
                return (
                <AccordionItem key={idx} value={`tool-${idx}`} className="border-none">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + idx * 0.1 }}
                    className="rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-border/20 cursor-pointer hover:border-border/40 transition-all duration-300"
                  >
                    {isEditMode && editingSection === `tools-${idx}` ? (
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <Input
                            value={editedCardTitle}
                            onChange={(e) => setEditedCardTitle(e.target.value)}
                            placeholder="Category name..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Tools (one per line)</label>
                          {editedItems?.map((tool, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <Input
                                value={tool}
                                onChange={(e) => handleProcessItemChange(i, e.target.value)}
                                placeholder={`Tool ${i + 1}...`}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveProcessItem(i)}
                                disabled={editedItems?.length <= 1}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddProcessItem}
                            className="mt-2"
                          >
                            + Add Tool
                          </Button>
                        </div>
                        
                        <div className="flex gap-2 justify-end pt-2">
                          <Button size="sm" variant="outline" onClick={handleCancelCard}>
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => handleSaveCard('tools', idx)}>
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:pb-2 cursor-pointer">
                          <div className="flex items-center gap-2 w-full">
                            <div 
                              className="w-1 h-4 rounded-full"
                              style={{
                                background: gradient
                              }}
                            />
                            <h4 className="text-sm text-left">{section.category}</h4>
                            <span className="ml-auto text-xs text-muted-foreground/70">
                              {section.tools?.length || 0} tools
                            </span>
                          </div>
                        </AccordionTrigger>
                        
                        {isEditMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCard('tools', idx, section);
                            }}
                            className="absolute top-3 right-3 z-10"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <AccordionContent className="px-4 pb-4">
                          <div className="flex flex-wrap gap-2 pt-2">
                            {section.tools?.map((tool) => (
                              <span 
                                key={tool}
                                className="px-3 py-1.5 text-sm rounded-lg bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-border/40 shadow-sm cursor-default select-none"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </AccordionContent>
                      </div>
                    )}
                  </motion.div>
                </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </PageLayout>
  );
}

export default About;