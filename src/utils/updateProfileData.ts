import { supabase } from '../lib/supabaseClient';

export async function updateCurrentUserProfile(profileData: any) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    console.log('🔄 Updating profile for user:', user.id);
    console.log('📊 Profile data to update:', profileData);

    // Update the profile with the current user's ID
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }

    console.log('✅ Profile updated successfully:', data);
    return data;

  } catch (error: any) {
    console.error('❌ Failed to update profile:', error);
    throw error;
  }
}

// Helper function to populate profile with hardcoded data
export async function populateProfileWithHardcodedData() {
  const hardcodedProfileData = {
    bio_paragraph_1: "Brian Bureson is a Colorado-based product designer and strategic design leader with 20+ years of experience delivering 0–1, research-backed digital products across enterprise, mid-size, and startup environments.",
    bio_paragraph_2: "Currently at Oracle (formerly at Skype, Microsoft, Motorola, NBCUniversal), leading design and research initiatives across complex enterprise systems and AI-powered products. Brian brings deep craft, collaborative leadership, and a proven track record of product innovation.",
    super_powers_title: "Super powers",
    super_powers: [
      "Strategic Design Leadership",
      "User Research & Insights",
      "Product Innovation",
      "Cross-functional Collaboration",
      "Design Systems & Standards"
    ],
    highlights_title: "Highlights",
    highlights: [
      "Led design for Microsoft Teams, serving 300M+ users",
      "Pioneered AI-powered design tools at Oracle"
    ],
    leadership_title: "Leadership & Impact",
    leadership_items: [
      "Built and led design teams of 15+ designers",
      "Established design systems used across 50+ products",
      "Mentored 20+ junior designers to senior roles"
    ],
    expertise_title: "Expertise",
    expertise_items: [
      "Product Strategy & Roadmapping",
      "User Experience Research",
      "Design Systems & Component Libraries",
      "Cross-platform Design",
      "AI/ML Product Integration"
    ],
    how_i_use_ai_title: "How I Use AI",
    how_i_use_ai_items: [
      "Design automation and workflow optimization",
      "User research analysis and insights generation",
      "Prototype and mockup creation",
      "Content strategy and copywriting assistance"
    ],
    process_title: "My Process",
    process_subheading: "A systematic approach to product design",
    process_items: [
      "Research & Discovery",
      "Strategy & Planning", 
      "Design & Prototyping",
      "Testing & Iteration",
      "Implementation & Launch"
    ],
    certifications_title: "Certifications",
    certifications_items: [
      "Google UX Design Certificate",
      "Nielsen Norman Group UX Certification",
      "Design Thinking Practitioner"
    ],
    tools_title: "Tools & Technologies",
    tools_categories: [
      {
        category: "Design",
        tools: ["Figma", "Sketch", "Adobe Creative Suite", "Principle"]
      },
      {
        category: "Research",
        tools: ["UserTesting", "Maze", "Optimal Workshop", "Hotjar"]
      },
      {
        category: "Development",
        tools: ["React", "TypeScript", "CSS/SCSS", "Git"]
      }
    ],
    section_order: [
      "bio",
      "superPowers", 
      "highlights",
      "leadership",
      "expertise",
      "howIUseAI",
      "process",
      "certifications",
      "tools"
    ]
  };

  return await updateCurrentUserProfile(hardcodedProfileData);
}
