import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Send, User, MessageSquare, CheckCircle, MapPin, Edit2, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { PageLayout } from '../components/layout/PageLayout';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useSEO } from '../hooks/useSEO';
import { useContactMessages } from '../hooks/useContactMessages';

interface ContactProps {
  onBack: () => void;
  isEditMode?: boolean;
}

export function Contact({ onBack, isEditMode = false }: ContactProps) {
  // Apply SEO for contact page
  useSEO('contact');
  
  // Supabase contact messages hook
  const { createMessage } = useContactMessages();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Editable content state
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [pageSubtitle, setPageSubtitle] = useState(
    "Have a question or want to work together? I'd love to hear from you."
  );
  const [contactInfo, setContactInfo] = useState({
    email: "brian@example.com",
    location: "Colorado, USA",
    availability: "Open to new opportunities"
  });
  const [editedText, setEditedText] = useState("");
  const [originalText, setOriginalText] = useState("");

  // Load saved content from localStorage and Supabase
  useEffect(() => {
    const loadContactData = async () => {
      // Load from localStorage first
      const saved = localStorage.getItem('contactPageContent');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.pageSubtitle) setPageSubtitle(parsed.pageSubtitle);
          if (parsed.contactInfo) setContactInfo(parsed.contactInfo);
        } catch (e) {
          console.error('Error loading Contact page content:', e);
        }
      }
      
      // Load email from Supabase profiles table
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single();
            
          if (profile && profile.email) {
            console.log('📧 Loading email from Supabase profiles:', profile.email);
            setContactInfo(prev => ({ ...prev, email: profile.email }));
          }
        }
      } catch (error) {
        console.error('❌ Failed to load email from Supabase:', error);
      }
    };
    
    loadContactData();
  }, []);

  // Save to localStorage
  const saveToLocalStorage = () => {
    const data = {
      pageSubtitle,
      contactInfo,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem('contactPageContent', JSON.stringify(data));
  };

  const handleEdit = (section: string, currentText: string) => {
    setEditingSection(section);
    setEditedText(currentText);
    setOriginalText(currentText);
  };

  const handleSave = async (section: string) => {
    if (section === 'subtitle') {
      setPageSubtitle(editedText);
    } else if (section === 'email') {
      setContactInfo({ ...contactInfo, email: editedText });
      
      // Save email to Supabase profiles table
      try {
        const { updateCurrentUserProfile } = await import('../utils/updateProfileData');
        await updateCurrentUserProfile({ email: editedText });
        console.log('✅ Email updated in Supabase profiles table');
      } catch (error) {
        console.error('❌ Failed to update email in Supabase:', error);
        // Still save to localStorage as fallback
      }
    } else if (section === 'location') {
      setContactInfo({ ...contactInfo, location: editedText });
    } else if (section === 'availability') {
      setContactInfo({ ...contactInfo, availability: editedText });
    }
    setEditingSection(null);
    setEditedText("");
    setOriginalText("");
    setTimeout(saveToLocalStorage, 100);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedText("");
    setOriginalText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit to Supabase
      const result = await createMessage({
        name: formData.name,
        email: formData.email,
        message: formData.message
      });
      
      if (result) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <PageLayout title="Get in touch" onBack={onBack}>
      <div className="max-w-7xl mx-auto">
        {/* Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {isEditMode && editingSection !== 'subtitle' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit('subtitle', pageSubtitle)}
              className="rounded-full mb-4"
            >
              <Edit2 className="w-3 h-3 mr-2" />
              Edit Subtitle
            </Button>
          )}
          
          {editingSection === 'subtitle' ? (
            <div className="space-y-4 max-w-2xl">
              <label className="block text-sm font-medium">Page Subtitle</label>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[80px] text-lg"
                placeholder="Enter page subtitle..."
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleSave('subtitle')}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xl text-muted-foreground max-w-2xl">
              {pageSubtitle}
            </p>
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form - Left Column (2/3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="relative p-8 md:p-10 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
              {/* Gradient top border */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)"
                }}
              />

              {/* Animated decorative curved line */}
              <svg
                className="absolute right-0 top-0 h-full w-[25%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                viewBox="0 0 100 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                  fill="none"
                  stroke="#ec4899"
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
                    background: '#ec4899',
                    boxShadow: `0 0 ${dot.size * 2}px #ec489940`,
                    animationDelay: `${dot.delay}s`,
                  }}
                />
              ))}

              {/* Gradient glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #ec489920, transparent 70%)',
                }}
              />

              {/* Subtle background pattern */}
              <div 
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none rounded-2xl"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="relative z-10">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        required
                        disabled={isSubmitting}
                        className="bg-input-background border-2 border-border/60 dark:border-border"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                        disabled={isSubmitting}
                        className="bg-input-background border-2 border-border/60 dark:border-border"
                      />
                    </div>

                    {/* Message Field */}
                    <div className="space-y-2">
                      <label htmlFor="message" className="flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell me about your project or inquiry..."
                        required
                        disabled={isSubmitting}
                        rows={6}
                        className="bg-input-background resize-y min-h-[140px] border-2 border-border/60 dark:border-border"
                      />
                    </div>

                    {/* Submit Button - Full width on mobile, left aligned on desktop */}
                    <div className="flex justify-start">
                      {/* Animated Gradient Border Wrapper */}
                      <motion.div
                        className="rounded-full p-[2px] w-full sm:w-auto"
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
                          type="submit"
                          disabled={isSubmitting}
                          className="relative rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm hover:bg-background/60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full"
                        >
                          {isSubmitting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full mx-auto"
                            />
                          ) : (
                            <span className="relative z-10 text-foreground font-bold flex items-center justify-center gap-2">
                              <Send className="w-4 h-4" />
                              Send message
                            </span>
                          )}
                        </button>
                      </motion.div>
                    </div>

                    {isEditMode && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-900 dark:text-yellow-100">
                          💡 <strong>Edit Mode:</strong> This is a demo form. In production, you'd connect this to a backend service or email API.
                        </p>
                      </div>
                    )}
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <h3 className="mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. I'll get back to you soon.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              {/* Gradient glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #ec489920, transparent 70%)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-pink-600 dark:text-pink-400 shadow-md">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3>Email</h3>
                  {isEditMode && editingSection !== 'email' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('email', contactInfo.email)}
                      className="ml-auto"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {editingSection === 'email' ? (
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      placeholder="email@example.com"
                      className="text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('email')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all cursor-pointer hover:underline"
                  >
                    {contactInfo.email}
                  </a>
                )}
              </div>
            </motion.div>

            {/* Location Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              {/* Gradient glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #3b82f620, transparent 70%)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-blue-600 dark:text-blue-400 shadow-md">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3>Location</h3>
                  {isEditMode && editingSection !== 'location' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('location', contactInfo.location)}
                      className="ml-auto"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {editingSection === 'location' ? (
                  <div className="space-y-2">
                    <Input
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      placeholder="City, Country"
                      className="text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSave('location')}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {contactInfo.location}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Contact;
