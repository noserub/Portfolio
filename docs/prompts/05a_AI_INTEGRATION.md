# Prompt 5a: AI Integration Add-On

## When to Use
**For projects requiring AI/LLM features** - Use this after core architecture is in place.

## Objective
Implement robust AI integration with OpenAI/Anthropic APIs, including rate limiting, cost management, streaming responses, and error handling.

## Instructions

### Step 1: AI Service Configuration
Set up AI service integration:

1. **AI Service Interface**
   ```typescript
   // src/services/aiService.ts
   interface AIConfig {
     apiKey: string;
     baseURL: string;
     model: string;
     maxTokens: number;
     temperature: number;
   }
   
   interface AIResponse {
     content: string;
     usage: {
       promptTokens: number;
       completionTokens: number;
       totalTokens: number;
     };
     cost: number;
   }
   
   export class AIService {
     private config: AIConfig;
     private rateLimiter: RateLimiter;
   
     constructor(config: AIConfig) {
       this.config = config;
       this.rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
     }
   
     async generateResponse(prompt: string, options?: Partial<AIConfig>): Promise<AIResponse> {
       await this.rateLimiter.wait();
       
       const response = await fetch(`${this.config.baseURL}/v1/chat/completions`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${this.config.apiKey}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           model: options?.model || this.config.model,
           messages: [{ role: 'user', content: prompt }],
           max_tokens: options?.maxTokens || this.config.maxTokens,
           temperature: options?.temperature || this.config.temperature
         })
       });
   
       if (!response.ok) {
         throw new Error(`AI API error: ${response.status}`);
       }
   
       const data = await response.json();
       return this.formatResponse(data);
     }
   
     private formatResponse(data: any): AIResponse {
       const content = data.choices[0].message.content;
       const usage = data.usage;
       const cost = this.calculateCost(usage.total_tokens);
   
       return { content, usage, cost };
     }
   
     private calculateCost(tokens: number): number {
       // Calculate cost based on model pricing
       const pricePerToken = 0.00002; // Example pricing
       return tokens * pricePerToken;
     }
   }
   ```

2. **Rate Limiter**
   ```typescript
   // src/utils/rateLimiter.ts
   export class RateLimiter {
     private requests: number[] = [];
     private maxRequests: number;
     private windowMs: number;
   
     constructor(maxRequests: number, windowMs: number) {
       this.maxRequests = maxRequests;
       this.windowMs = windowMs;
     }
   
     async wait(): Promise<void> {
       const now = Date.now();
       this.requests = this.requests.filter(time => now - time < this.windowMs);
   
       if (this.requests.length >= this.maxRequests) {
         const oldestRequest = Math.min(...this.requests);
         const waitTime = this.windowMs - (now - oldestRequest);
         await new Promise(resolve => setTimeout(resolve, waitTime));
       }
   
       this.requests.push(now);
     }
   }
   ```

### Step 2: AI Hooks
Create React hooks for AI integration:

1. **useAI Hook**
   ```typescript
   // src/hooks/useAI.ts
   import { useState, useCallback } from 'react';
   import { AIService } from '../services/aiService';
   
   interface UseAIOptions {
     model?: string;
     maxTokens?: number;
     temperature?: number;
   }
   
   export function useAI(options: UseAIOptions = {}) {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [totalCost, setTotalCost] = useState(0);
   
     const generateResponse = useCallback(async (prompt: string): Promise<string> => {
       setLoading(true);
       setError(null);
   
       try {
         const aiService = new AIService({
           apiKey: import.meta.env.VITE_OPENAI_API_KEY,
           baseURL: 'https://api.openai.com',
           model: options.model || 'gpt-3.5-turbo',
           maxTokens: options.maxTokens || 1000,
           temperature: options.temperature || 0.7
         });
   
         const response = await aiService.generateResponse(prompt, options);
         setTotalCost(prev => prev + response.cost);
         return response.content;
       } catch (err) {
         const errorMessage = err instanceof Error ? err.message : 'Unknown error';
         setError(errorMessage);
         throw err;
       } finally {
         setLoading(false);
       }
     }, [options]);
   
     return { generateResponse, loading, error, totalCost };
   }
   ```

2. **useStreamingAI Hook**
   ```typescript
   // src/hooks/useStreamingAI.ts
   export function useStreamingAI(options: UseAIOptions = {}) {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [streamingContent, setStreamingContent] = useState('');
   
     const generateStreamingResponse = useCallback(async (prompt: string): Promise<void> => {
       setLoading(true);
       setError(null);
       setStreamingContent('');
   
       try {
         const response = await fetch('/api/ai/stream', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ prompt, ...options })
         });
   
         if (!response.ok) {
           throw new Error(`Streaming error: ${response.status}`);
         }
   
         const reader = response.body?.getReader();
         if (!reader) throw new Error('No reader available');
   
         while (true) {
           const { done, value } = await reader.read();
           if (done) break;
   
           const chunk = new TextDecoder().decode(value);
           const lines = chunk.split('\n');
   
           for (const line of lines) {
             if (line.startsWith('data: ')) {
               const data = line.slice(6);
               if (data === '[DONE]') {
                 setLoading(false);
                 return;
               }
   
               try {
                 const parsed = JSON.parse(data);
                 const content = parsed.choices[0].delta.content;
                 if (content) {
                   setStreamingContent(prev => prev + content);
                 }
               } catch (e) {
                 // Ignore parsing errors
               }
             }
           }
         }
       } catch (err) {
         const errorMessage = err instanceof Error ? err.message : 'Unknown error';
         setError(errorMessage);
       } finally {
         setLoading(false);
       }
     }, [options]);
   
     return { generateStreamingResponse, loading, error, streamingContent };
   }
   ```

### Step 3: Context Management
Implement context management for AI conversations:

1. **Context Manager**
   ```typescript
   // src/utils/contextManager.ts
   interface Message {
     role: 'user' | 'assistant' | 'system';
     content: string;
     timestamp: number;
   }
   
   export class ContextManager {
     private messages: Message[] = [];
     private maxContextLength: number;
   
     constructor(maxContextLength: number = 4000) {
       this.maxContextLength = maxContextLength;
     }
   
     addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
       this.messages.push({
         role,
         content,
         timestamp: Date.now()
       });
   
       this.trimContext();
     }
   
     getContext(): Message[] {
       return [...this.messages];
     }
   
     clearContext(): void {
       this.messages = [];
     }
   
     private trimContext(): void {
       let totalLength = this.messages.reduce((sum, msg) => sum + msg.content.length, 0);
   
       while (totalLength > this.maxContextLength && this.messages.length > 1) {
         const removed = this.messages.shift();
         if (removed) {
           totalLength -= removed.content.length;
         }
       }
     }
   }
   ```

### Step 4: AI Components
Create reusable AI components:

1. **AI Chat Component**
   ```typescript
   // src/components/AIChat.tsx
   import React, { useState, useRef, useEffect } from 'react';
   import { useAI } from '../hooks/useAI';
   import { ContextManager } from '../utils/contextManager';
   
   interface AIChatProps {
     systemPrompt?: string;
     placeholder?: string;
   }
   
   export const AIChat: React.FC<AIChatProps> = ({ 
     systemPrompt = "You are a helpful assistant.",
     placeholder = "Ask me anything..."
   }) => {
     const [messages, setMessages] = useState<Message[]>([]);
     const [input, setInput] = useState('');
     const [contextManager] = useState(() => new ContextManager());
     const { generateResponse, loading, error } = useAI();
     const messagesEndRef = useRef<HTMLDivElement>(null);
   
     useEffect(() => {
       if (systemPrompt) {
         contextManager.addMessage('system', systemPrompt);
       }
     }, [systemPrompt, contextManager]);
   
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       if (!input.trim() || loading) return;
   
       const userMessage = input.trim();
       setInput('');
       setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
       contextManager.addMessage('user', userMessage);
   
       try {
         const response = await generateResponse(userMessage);
         setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
         contextManager.addMessage('assistant', response);
       } catch (err) {
         console.error('AI generation error:', err);
       }
     };
   
     useEffect(() => {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [messages]);
   
     return (
       <div className="ai-chat">
         <div className="messages">
           {messages.map((message, index) => (
             <div key={index} className={`message ${message.role}`}>
               <div className="content">{message.content}</div>
               <div className="timestamp">
                 {new Date(message.timestamp).toLocaleTimeString()}
               </div>
             </div>
           ))}
           {loading && (
             <div className="message assistant">
               <div className="typing-indicator">AI is thinking...</div>
             </div>
           )}
         </div>
         {error && (
           <div className="error-message">
             Error: {error}
           </div>
         )}
         <form onSubmit={handleSubmit} className="input-form">
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder={placeholder}
             disabled={loading}
           />
           <button type="submit" disabled={loading || !input.trim()}>
             Send
           </button>
         </form>
       </div>
     );
   };
   ```

### Step 5: Cost Management
Implement cost tracking and management:

1. **Cost Tracker**
   ```typescript
   // src/utils/costTracker.ts
   export class CostTracker {
     private costs: number[] = [];
     private dailyLimit: number;
   
     constructor(dailyLimit: number = 10) {
       this.dailyLimit = dailyLimit;
     }
   
     addCost(cost: number): void {
       this.costs.push(cost);
       this.cleanOldCosts();
     }
   
     getTotalCost(): number {
       return this.costs.reduce((sum, cost) => sum + cost, 0);
     }
   
     getRemainingBudget(): number {
       return Math.max(0, this.dailyLimit - this.getTotalCost());
     }
   
     canMakeRequest(estimatedCost: number): boolean {
       return this.getRemainingBudget() >= estimatedCost;
     }
   
     private cleanOldCosts(): void {
       const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
       this.costs = this.costs.filter(cost => cost > oneDayAgo);
     }
   }
   ```

### Step 6: Error Handling
Implement robust error handling for AI failures:

1. **AI Error Handler**
   ```typescript
   // src/utils/aiErrorHandler.ts
   export class AIErrorHandler {
     static handleError(error: any): string {
       if (error.status === 429) {
         return 'Rate limit exceeded. Please try again later.';
       }
   
       if (error.status === 401) {
         return 'Invalid API key. Please check your configuration.';
       }
   
       if (error.status === 400) {
         return 'Invalid request. Please check your input.';
       }
   
       if (error.status === 500) {
         return 'AI service is temporarily unavailable. Please try again later.';
       }
   
       return 'An unexpected error occurred. Please try again.';
     }
   
     static shouldRetry(error: any): boolean {
       return error.status >= 500 || error.status === 429;
     }
   
     static getRetryDelay(attempt: number): number {
       return Math.min(1000 * Math.pow(2, attempt), 30000);
     }
   }
   ```

### Step 7: AI Utilities
Create utility functions for AI operations:

1. **Text Processing**
   ```typescript
   // src/utils/aiUtils.ts
   export const truncateText = (text: string, maxLength: number): string => {
     if (text.length <= maxLength) return text;
     return text.substring(0, maxLength - 3) + '...';
   };
   
   export const extractKeywords = (text: string): string[] => {
     const words = text.toLowerCase().split(/\s+/);
     const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
     return words.filter(word => word.length > 2 && !stopWords.has(word));
   };
   
   export const formatAIResponse = (response: string): string => {
     return response
       .replace(/\n\n/g, '\n')
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>');
   };
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ AI service integration with rate limiting
2. ✅ React hooks for AI operations
3. ✅ Streaming AI responses
4. ✅ Context management for conversations
5. ✅ Reusable AI chat components
6. ✅ Cost tracking and management
7. ✅ Robust error handling
8. ✅ AI utility functions

## Next Steps
After completing AI integration:
- Run **Prompt 4: Production Readiness** to prepare for deployment
- Or run **Prompt 5d: Real-time Features** if real-time AI features are needed

## Notes
- All AI operations include rate limiting to prevent API abuse
- Cost tracking helps manage API expenses
- Error handling is comprehensive for production use
- Context management prevents token limit issues
- Components are designed to be reusable across the application

