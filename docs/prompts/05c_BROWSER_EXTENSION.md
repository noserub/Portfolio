# Prompt 5c: Browser Extension Architecture Add-On

## When to Use
**For browser extensions** - Use this FIRST, before other prompts, as extensions have different architecture requirements.

## Objective
Implement browser extension architecture with Manifest V3, content scripts, background service workers, message passing, and Chrome Storage API integration.

## Instructions

### Step 1: Extension Structure Setup
Set up the proper extension directory structure:

1. **Directory Structure**
   ```
   src/
   ├── manifest.json
   ├── background/
   │   ├── service-worker.ts
   │   └── index.ts
   ├── content/
   │   ├── content-script.ts
   │   └── inject.ts
   ├── popup/
   │   ├── popup.html
   │   ├── popup.tsx
   │   └── index.ts
   ├── options/
   │   ├── options.html
   │   ├── options.tsx
   │   └── index.ts
   └── shared/
       ├── types.ts
       ├── utils.ts
       └── constants.ts
   ```

2. **Manifest V3 Configuration**
   ```json
   // manifest.json
   {
     "manifest_version": 3,
     "name": "Your Extension Name",
     "version": "1.0.0",
     "description": "Your extension description",
     "permissions": [
       "activeTab",
       "storage",
       "scripting",
       "webRequest",
       "webRequestBlocking"
     ],
     "host_permissions": [
       "https://*/*",
       "http://*/*"
     ],
     "background": {
       "service_worker": "background/service-worker.js"
     },
     "content_scripts": [
       {
         "matches": ["<all_urls>"],
         "js": ["content/content-script.js"],
         "run_at": "document_start"
       }
     ],
     "action": {
       "default_popup": "popup/popup.html",
       "default_title": "Your Extension"
     },
     "options_page": "options/options.html",
     "web_accessible_resources": [
       {
         "resources": ["inject/*"],
         "matches": ["<all_urls>"]
       }
     ]
   }
   ```

### Step 2: Background Service Worker
Implement the background service worker:

1. **Service Worker Setup**
   ```typescript
   // src/background/service-worker.ts
   import { MessageHandler } from '../shared/messageHandler';
   import { StorageManager } from '../shared/storageManager';
   import { TabManager } from '../shared/tabManager';
   
   class BackgroundService {
     private messageHandler: MessageHandler;
     private storageManager: StorageManager;
     private tabManager: TabManager;
   
     constructor() {
       this.messageHandler = new MessageHandler();
       this.storageManager = new StorageManager();
       this.tabManager = new TabManager();
       this.setupEventListeners();
     }
   
     private setupEventListeners(): void {
       // Handle messages from content scripts and popup
       chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
         this.messageHandler.handleMessage(message, sender, sendResponse);
       });
   
       // Handle tab updates
       chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
         this.tabManager.handleTabUpdate(tabId, changeInfo, tab);
       });
   
       // Handle extension installation
       chrome.runtime.onInstalled.addListener((details) => {
         this.handleInstallation(details);
       });
     }
   
     private async handleInstallation(details: chrome.runtime.InstalledDetails): Promise<void> {
       if (details.reason === 'install') {
         // Set default settings
         await this.storageManager.setDefaults();
         console.log('Extension installed successfully');
       }
     }
   }
   
   new BackgroundService();
   ```

2. **Message Handler**
   ```typescript
   // src/shared/messageHandler.ts
   export interface ExtensionMessage {
     type: string;
     payload?: any;
     tabId?: number;
   }
   
   export class MessageHandler {
     async handleMessage(
       message: ExtensionMessage, 
       sender: chrome.runtime.MessageSender, 
       sendResponse: (response?: any) => void
     ): Promise<void> {
       try {
         switch (message.type) {
           case 'GET_TAB_INFO':
             const tabInfo = await this.getTabInfo(sender.tab?.id);
             sendResponse(tabInfo);
             break;
   
           case 'ANALYZE_TRANSACTION':
             const analysis = await this.analyzeTransaction(message.payload);
             sendResponse(analysis);
             break;
   
           case 'SAVE_SETTINGS':
             await this.saveSettings(message.payload);
             sendResponse({ success: true });
             break;
   
           default:
             console.warn('Unknown message type:', message.type);
             sendResponse({ error: 'Unknown message type' });
         }
       } catch (error) {
         console.error('Error handling message:', error);
         sendResponse({ error: error.message });
       }
     }
   
     private async getTabInfo(tabId?: number): Promise<any> {
       if (!tabId) return null;
   
       const tab = await chrome.tabs.get(tabId);
       return {
         url: tab.url,
         title: tab.title,
         active: tab.active
       };
     }
   
     private async analyzeTransaction(transactionData: any): Promise<any> {
       // Implement AI analysis logic
       return { risk: 'low', confidence: 0.85 };
     }
   
     private async saveSettings(settings: any): Promise<void> {
       await chrome.storage.sync.set({ settings });
     }
   }
   ```

### Step 3: Content Script Architecture
Implement content script functionality:

1. **Content Script Setup**
   ```typescript
   // src/content/content-script.ts
   import { TransactionDetector } from './transactionDetector';
   import { UIManager } from './uiManager';
   import { MessageSender } from '../shared/messageSender';
   
   class ContentScript {
     private transactionDetector: TransactionDetector;
     private uiManager: UIManager;
     private messageSender: MessageSender;
   
     constructor() {
       this.transactionDetector = new TransactionDetector();
       this.uiManager = new UIManager();
       this.messageSender = new MessageSender();
       this.init();
     }
   
     private init(): void {
       // Wait for DOM to be ready
       if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', () => this.setup());
       } else {
         this.setup();
       }
     }
   
     private setup(): void {
       // Detect crypto transaction pages
       if (this.transactionDetector.isCryptoPage()) {
         this.setupTransactionMonitoring();
       }
   
       // Setup message listeners
       this.setupMessageListeners();
     }
   
     private setupTransactionMonitoring(): void {
       // Monitor for transaction forms
       const observer = new MutationObserver((mutations) => {
         mutations.forEach((mutation) => {
           if (mutation.type === 'childList') {
             this.transactionDetector.detectNewTransactions();
           }
         });
       });
   
       observer.observe(document.body, {
         childList: true,
         subtree: true
       });
     }
   
     private setupMessageListeners(): void {
       chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
         this.handleMessage(message, sender, sendResponse);
       });
     }
   
     private async handleMessage(message: any, sender: any, sendResponse: any): Promise<void> {
       switch (message.type) {
         case 'SHOW_RISK_ANALYSIS':
           await this.uiManager.showRiskAnalysis(message.payload);
           break;
   
         case 'HIDE_RISK_ANALYSIS':
           this.uiManager.hideRiskAnalysis();
           break;
   
         default:
           console.warn('Unknown message type in content script:', message.type);
       }
     }
   }
   
   new ContentScript();
   ```

2. **Transaction Detector**
   ```typescript
   // src/content/transactionDetector.ts
   export class TransactionDetector {
     private cryptoSelectors = [
       'input[placeholder*="amount"]',
       'input[placeholder*="value"]',
       'input[placeholder*="ETH"]',
       'input[placeholder*="BTC"]',
       'button[data-testid*="send"]',
       'button[data-testid*="transfer"]'
     ];
   
     isCryptoPage(): boolean {
       const url = window.location.href;
       const cryptoKeywords = ['metamask', 'wallet', 'ethereum', 'bitcoin', 'crypto', 'defi'];
       return cryptoKeywords.some(keyword => url.toLowerCase().includes(keyword));
     }
   
     detectNewTransactions(): void {
       const transactionElements = this.findTransactionElements();
       transactionElements.forEach(element => {
         this.analyzeTransaction(element);
       });
     }
   
     private findTransactionElements(): Element[] {
       const elements: Element[] = [];
       this.cryptoSelectors.forEach(selector => {
         const found = document.querySelectorAll(selector);
         elements.push(...Array.from(found));
       });
       return elements;
     }
   
     private async analyzeTransaction(element: Element): Promise<void> {
       const transactionData = this.extractTransactionData(element);
       if (transactionData) {
         // Send to background script for AI analysis
         chrome.runtime.sendMessage({
           type: 'ANALYZE_TRANSACTION',
           payload: transactionData
         });
       }
     }
   
     private extractTransactionData(element: Element): any {
       // Extract transaction data from the element
       const form = element.closest('form');
       if (!form) return null;
   
       const inputs = form.querySelectorAll('input');
       const data: any = {};
   
       inputs.forEach(input => {
         const name = input.name || input.id || input.placeholder;
         if (name) {
           data[name] = input.value;
         }
       });
   
       return data;
     }
   }
   ```

### Step 4: Popup Interface
Create the extension popup:

1. **Popup Component**
   ```typescript
   // src/popup/popup.tsx
   import React, { useState, useEffect } from 'react';
   import { createRoot } from 'react-dom/client';
   import { RiskAnalysis } from './components/RiskAnalysis';
   import { Settings } from './components/Settings';
   import { useExtensionState } from './hooks/useExtensionState';
   
   const Popup: React.FC = () => {
     const [activeTab, setActiveTab] = useState<'analysis' | 'settings'>('analysis');
     const { currentTab, riskData, isLoading } = useExtensionState();
   
     return (
       <div className="popup-container">
         <div className="popup-header">
           <h1>Crypto Risk Analyzer</h1>
           <div className="tab-buttons">
             <button 
               className={activeTab === 'analysis' ? 'active' : ''}
               onClick={() => setActiveTab('analysis')}
             >
               Analysis
             </button>
             <button 
               className={activeTab === 'settings' ? 'active' : ''}
               onClick={() => setActiveTab('settings')}
             >
               Settings
             </button>
           </div>
         </div>
   
         <div className="popup-content">
           {activeTab === 'analysis' && (
             <RiskAnalysis 
               riskData={riskData}
               isLoading={isLoading}
               currentTab={currentTab}
             />
           )}
           {activeTab === 'settings' && (
             <Settings />
           )}
         </div>
       </div>
     );
   };
   
   const container = document.getElementById('root');
   if (container) {
     const root = createRoot(container);
     root.render(<Popup />);
   }
   ```

2. **Extension State Hook**
   ```typescript
   // src/popup/hooks/useExtensionState.ts
   import { useState, useEffect } from 'react';
   
   export function useExtensionState() {
     const [currentTab, setCurrentTab] = useState<any>(null);
     const [riskData, setRiskData] = useState<any>(null);
     const [isLoading, setIsLoading] = useState(false);
   
     useEffect(() => {
       // Get current tab info
       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0]) {
           setCurrentTab(tabs[0]);
         }
       });
   
       // Listen for risk analysis updates
       chrome.runtime.onMessage.addListener((message) => {
         if (message.type === 'RISK_ANALYSIS_UPDATE') {
           setRiskData(message.payload);
           setIsLoading(false);
         }
       });
     }, []);
   
     const analyzeCurrentPage = async () => {
       setIsLoading(true);
       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0]) {
           chrome.tabs.sendMessage(tabs[0].id!, {
             type: 'ANALYZE_CURRENT_PAGE'
           });
         }
       });
     };
   
     return {
       currentTab,
       riskData,
       isLoading,
       analyzeCurrentPage
     };
   }
   ```

### Step 5: Chrome Storage Integration
Implement storage management:

1. **Storage Manager**
   ```typescript
   // src/shared/storageManager.ts
   export class StorageManager {
     async get<T>(key: string): Promise<T | null> {
       try {
         const result = await chrome.storage.sync.get(key);
         return result[key] || null;
       } catch (error) {
         console.error('Error getting from storage:', error);
         return null;
       }
     }
   
     async set(key: string, value: any): Promise<void> {
       try {
         await chrome.storage.sync.set({ [key]: value });
       } catch (error) {
         console.error('Error setting storage:', error);
       }
     }
   
     async remove(key: string): Promise<void> {
       try {
         await chrome.storage.sync.remove(key);
       } catch (error) {
         console.error('Error removing from storage:', error);
       }
     }
   
     async clear(): Promise<void> {
       try {
         await chrome.storage.sync.clear();
       } catch (error) {
         console.error('Error clearing storage:', error);
       }
     }
   
     async setDefaults(): Promise<void> {
       const defaults = {
         settings: {
           riskThreshold: 0.7,
           autoAnalyze: true,
           showWarnings: true
         },
         userPreferences: {
           theme: 'dark',
           language: 'en'
         }
       };
   
       await this.set('defaults', defaults);
     }
   }
   ```

### Step 6: Build Configuration
Set up extension build process:

1. **Vite Extension Config**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react-swc';
   import { resolve } from 'path';
   
   export default defineConfig({
     plugins: [react()],
     build: {
       rollupOptions: {
         input: {
           popup: resolve(__dirname, 'src/popup/popup.html'),
           options: resolve(__dirname, 'src/options/options.html'),
           'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
           'content-script': resolve(__dirname, 'src/content/content-script.ts')
         },
         output: {
           entryFileNames: (chunkInfo) => {
             if (chunkInfo.name === 'service-worker') {
               return 'background/service-worker.js';
             }
             if (chunkInfo.name === 'content-script') {
               return 'content/content-script.js';
             }
             return '[name].js';
           }
         }
       }
     },
     resolve: {
       alias: {
         '@': resolve(__dirname, './src')
       }
     }
   });
   ```

2. **Package.json Scripts**
   ```json
   {
     "scripts": {
       "build:extension": "vite build",
       "dev:extension": "vite build --watch",
       "package:extension": "npm run build:extension && zip -r extension.zip dist/"
     }
   }
   ```

### Step 7: Testing Setup
Set up extension testing:

1. **Extension Test Utils**
   ```typescript
   // src/shared/testUtils.ts
   export const mockChromeAPI = () => {
     global.chrome = {
       runtime: {
         onMessage: {
           addListener: jest.fn(),
           removeListener: jest.fn()
         },
         sendMessage: jest.fn(),
         getURL: jest.fn()
       },
       tabs: {
         query: jest.fn(),
         sendMessage: jest.fn()
       },
       storage: {
         sync: {
           get: jest.fn(),
           set: jest.fn(),
           remove: jest.fn(),
           clear: jest.fn()
         }
       }
     } as any;
   };
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ Proper extension directory structure
2. ✅ Manifest V3 configuration
3. ✅ Background service worker
4. ✅ Content script architecture
5. ✅ Popup interface with React
6. ✅ Chrome Storage API integration
7. ✅ Message passing system
8. ✅ Build configuration for extensions
9. ✅ Testing setup

## Next Steps
After completing extension architecture:
- Run **Prompt 1: Initial Assessment** (adapted for extensions)
- Run **Prompt 2: Database Architecture** for data persistence
- Run **Prompt 5a: AI Integration** for risk analysis
- Run **Prompt 4: Production Readiness** for deployment

## Notes
- This prompt must be run FIRST for extension projects
- Extension architecture is fundamentally different from web apps
- Content scripts run in isolated contexts
- Background service workers have limited APIs
- All communication happens through message passing


