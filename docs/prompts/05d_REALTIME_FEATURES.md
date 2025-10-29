# Prompt 5d: Real-time Features Add-On

## When to Use
**For collaborative/real-time apps** - Use this after core architecture is in place.

## Objective
Implement real-time features using Supabase Realtime subscriptions, optimistic updates, conflict resolution, presence indicators, and live data sync.

## Instructions

### Step 1: Supabase Realtime Setup
Configure Supabase Realtime subscriptions:

1. **Realtime Configuration**
   ```typescript
   // src/lib/realtimeClient.ts
   import { supabase } from './supabaseClient';
   
   export class RealtimeClient {
     private subscriptions: Map<string, any> = new Map();
   
     subscribeToTable(
       table: string, 
       callback: (payload: any) => void,
       filter?: string
     ): string {
       const subscriptionKey = `${table}_${Date.now()}`;
       
       const subscription = supabase
         .channel(`${table}_changes`)
         .on(
           'postgres_changes',
           {
             event: '*',
             schema: 'public',
             table,
             filter
           },
           callback
         )
         .subscribe();
   
       this.subscriptions.set(subscriptionKey, subscription);
       return subscriptionKey;
     }
   
     subscribeToUser(
       userId: string,
       callback: (payload: any) => void
     ): string {
       return this.subscribeToTable('profiles', callback, `user_id=eq.${userId}`);
     }
   
     unsubscribe(subscriptionKey: string): void {
       const subscription = this.subscriptions.get(subscriptionKey);
       if (subscription) {
         subscription.unsubscribe();
         this.subscriptions.delete(subscriptionKey);
       }
     }
   
     unsubscribeAll(): void {
       this.subscriptions.forEach((subscription) => {
         subscription.unsubscribe();
       });
       this.subscriptions.clear();
     }
   }
   
   export const realtimeClient = new RealtimeClient();
   ```

2. **Realtime Hook**
   ```typescript
   // src/hooks/useRealtime.ts
   import { useEffect, useRef } from 'react';
   import { realtimeClient } from '../lib/realtimeClient';
   
   interface UseRealtimeOptions {
     table: string;
     filter?: string;
     onInsert?: (payload: any) => void;
     onUpdate?: (payload: any) => void;
     onDelete?: (payload: any) => void;
   }
   
   export function useRealtime(options: UseRealtimeOptions) {
     const subscriptionRef = useRef<string | null>(null);
   
     useEffect(() => {
       const handleChange = (payload: any) => {
         switch (payload.eventType) {
           case 'INSERT':
             options.onInsert?.(payload);
             break;
           case 'UPDATE':
             options.onUpdate?.(payload);
             break;
           case 'DELETE':
             options.onDelete?.(payload);
             break;
         }
       };
   
       subscriptionRef.current = realtimeClient.subscribeToTable(
         options.table,
         handleChange,
         options.filter
       );
   
       return () => {
         if (subscriptionRef.current) {
           realtimeClient.unsubscribe(subscriptionRef.current);
         }
       };
     }, [options.table, options.filter]);
   }
   ```

### Step 2: Optimistic Updates
Implement optimistic update patterns:

1. **Optimistic Update Hook**
   ```typescript
   // src/hooks/useOptimisticUpdates.ts
   import { useState, useCallback } from 'react';
   
   interface OptimisticUpdate<T> {
     id: string;
     data: T;
     status: 'pending' | 'success' | 'error';
     error?: string;
   }
   
   export function useOptimisticUpdates<T>(
     initialData: T[],
     updateFunction: (id: string, data: Partial<T>) => Promise<T>
   ) {
     const [data, setData] = useState<T[]>(initialData);
     const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());
   
     const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
       // Create optimistic update
       const optimisticUpdate: OptimisticUpdate<T> = {
         id,
         data: { ...data.find(item => (item as any).id === id), ...updates } as T,
         status: 'pending'
       };
   
       setOptimisticUpdates(prev => new Map(prev).set(id, optimisticUpdate));
   
       try {
         const result = await updateFunction(id, updates);
         
         // Update local data
         setData(prev => prev.map(item => 
           (item as any).id === id ? result : item
         ));
   
         // Mark as success
         setOptimisticUpdates(prev => {
           const newMap = new Map(prev);
           const update = newMap.get(id);
           if (update) {
             update.status = 'success';
             newMap.set(id, update);
           }
           return newMap;
         });
   
         // Remove after delay
         setTimeout(() => {
           setOptimisticUpdates(prev => {
             const newMap = new Map(prev);
             newMap.delete(id);
             return newMap;
           });
         }, 2000);
   
       } catch (error) {
         // Mark as error
         setOptimisticUpdates(prev => {
           const newMap = new Map(prev);
           const update = newMap.get(id);
           if (update) {
             update.status = 'error';
             update.error = error.message;
             newMap.set(id, update);
           }
           return newMap;
         });
       }
     }, [data, updateFunction]);
   
     const getOptimisticData = useCallback(() => {
       return data.map(item => {
         const optimisticUpdate = optimisticUpdates.get((item as any).id);
         if (optimisticUpdate && optimisticUpdate.status === 'pending') {
           return optimisticUpdate.data;
         }
         return item;
       });
     }, [data, optimisticUpdates]);
   
     return {
       data: getOptimisticData(),
       updateItem,
       optimisticUpdates: Array.from(optimisticUpdates.values())
     };
   }
   ```

### Step 3: Conflict Resolution
Implement conflict resolution strategies:

1. **Conflict Resolver**
   ```typescript
   // src/utils/conflictResolver.ts
   export interface ConflictResolution {
     strategy: 'last-write-wins' | 'merge' | 'manual';
     resolve: (local: any, remote: any) => any;
   }
   
   export class ConflictResolver {
     static lastWriteWins(local: any, remote: any): any {
       const localTime = new Date(local.updated_at).getTime();
       const remoteTime = new Date(remote.updated_at).getTime();
       return localTime > remoteTime ? local : remote;
     }
   
     static merge(local: any, remote: any): any {
       return {
         ...local,
         ...remote,
         updated_at: new Date().toISOString(),
         merged_at: new Date().toISOString()
       };
     }
   
     static manual(local: any, remote: any): any {
       // Return both for manual resolution
       return {
         local,
         remote,
         requires_manual_resolution: true
       };
     }
   
     static resolveConflict(
       local: any, 
       remote: any, 
       strategy: ConflictResolution['strategy']
     ): any {
       switch (strategy) {
         case 'last-write-wins':
           return this.lastWriteWins(local, remote);
         case 'merge':
           return this.merge(local, remote);
         case 'manual':
           return this.manual(local, remote);
         default:
           return this.lastWriteWins(local, remote);
       }
     }
   }
   ```

2. **Conflict Resolution Hook**
   ```typescript
   // src/hooks/useConflictResolution.ts
   import { useState, useCallback } from 'react';
   import { ConflictResolver } from '../utils/conflictResolver';
   
   export function useConflictResolution() {
     const [conflicts, setConflicts] = useState<any[]>([]);
   
     const handleConflict = useCallback((
       local: any,
       remote: any,
       strategy: 'last-write-wins' | 'merge' | 'manual' = 'last-write-wins'
     ) => {
       const resolution = ConflictResolver.resolveConflict(local, remote, strategy);
       
       if (resolution.requires_manual_resolution) {
         setConflicts(prev => [...prev, resolution]);
         return null;
       }
   
       return resolution;
     }, []);
   
     const resolveConflict = useCallback((conflictId: string, resolution: any) => {
       setConflicts(prev => prev.filter(c => c.id !== conflictId));
       return resolution;
     }, []);
   
     return {
       conflicts,
       handleConflict,
       resolveConflict
     };
   }
   ```

### Step 4: Presence Indicators
Implement user presence tracking:

1. **Presence Manager**
   ```typescript
   // src/utils/presenceManager.ts
   export interface PresenceData {
     user_id: string;
     status: 'online' | 'away' | 'offline';
     last_seen: string;
     current_page?: string;
     activity?: string;
   }
   
   export class PresenceManager {
     private presenceData: PresenceData | null = null;
     private heartbeatInterval: NodeJS.Timeout | null = null;
     private supabase: any;
   
     constructor(supabase: any) {
       this.supabase = supabase;
     }
   
     async setPresence(data: Partial<PresenceData>): Promise<void> {
       this.presenceData = {
         user_id: data.user_id || '',
         status: data.status || 'online',
         last_seen: new Date().toISOString(),
         current_page: data.current_page,
         activity: data.activity
       };
   
       await this.supabase
         .from('presence')
         .upsert(this.presenceData);
     }
   
     startHeartbeat(userId: string): void {
       this.heartbeatInterval = setInterval(async () => {
         await this.setPresence({ user_id: userId, status: 'online' });
       }, 30000); // Update every 30 seconds
     }
   
     stopHeartbeat(): void {
       if (this.heartbeatInterval) {
         clearInterval(this.heartbeatInterval);
         this.heartbeatInterval = null;
       }
     }
   
     async setAway(): Promise<void> {
       if (this.presenceData) {
         await this.setPresence({ ...this.presenceData, status: 'away' });
       }
     }
   
     async setOffline(): Promise<void> {
       if (this.presenceData) {
         await this.setPresence({ ...this.presenceData, status: 'offline' });
       }
     }
   }
   ```

2. **Presence Hook**
   ```typescript
   // src/hooks/usePresence.ts
   import { useState, useEffect, useCallback } from 'react';
   import { PresenceManager } from '../utils/presenceManager';
   import { supabase } from '../lib/supabaseClient';
   
   export function usePresence(userId: string) {
     const [presence, setPresence] = useState<PresenceData | null>(null);
     const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
     const [presenceManager] = useState(() => new PresenceManager(supabase));
   
     useEffect(() => {
       // Set initial presence
       presenceManager.setPresence({ user_id: userId, status: 'online' });
       presenceManager.startHeartbeat(userId);
   
       // Listen for presence changes
       const subscription = supabase
         .channel('presence_changes')
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: 'presence'
         }, (payload) => {
           if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             setPresence(payload.new);
           }
         })
         .subscribe();
   
       // Get online users
       const getOnlineUsers = async () => {
         const { data } = await supabase
           .from('presence')
           .select('*')
           .eq('status', 'online');
         setOnlineUsers(data || []);
       };
   
       getOnlineUsers();
   
       return () => {
         presenceManager.stopHeartbeat();
         subscription.unsubscribe();
       };
     }, [userId, presenceManager]);
   
     const updateActivity = useCallback(async (activity: string) => {
       await presenceManager.setPresence({ user_id: userId, activity });
     }, [userId, presenceManager]);
   
     const setAway = useCallback(async () => {
       await presenceManager.setAway();
     }, [presenceManager]);
   
     const setOffline = useCallback(async () => {
       await presenceManager.setOffline();
     }, [presenceManager]);
   
     return {
       presence,
       onlineUsers,
       updateActivity,
       setAway,
       setOffline
     };
   }
   ```

### Step 5: Live Data Sync
Implement live data synchronization:

1. **Data Sync Manager**
   ```typescript
   // src/utils/dataSyncManager.ts
   export class DataSyncManager {
     private syncQueue: any[] = [];
     private isSyncing: boolean = false;
     private supabase: any;
   
     constructor(supabase: any) {
       this.supabase = supabase;
     }
   
     async syncData(table: string, data: any): Promise<void> {
       this.syncQueue.push({ table, data });
       
       if (!this.isSyncing) {
         await this.processSyncQueue();
       }
     }
   
     private async processSyncQueue(): Promise<void> {
       this.isSyncing = true;
   
       while (this.syncQueue.length > 0) {
         const { table, data } = this.syncQueue.shift();
         
         try {
           await this.syncTableData(table, data);
         } catch (error) {
           console.error('Sync error:', error);
           // Re-queue failed sync
           this.syncQueue.unshift({ table, data });
         }
       }
   
       this.isSyncing = false;
     }
   
     private async syncTableData(table: string, data: any): Promise<void> {
       const { error } = await this.supabase
         .from(table)
         .upsert(data);
   
       if (error) {
         throw error;
       }
     }
   }
   ```

2. **Live Sync Hook**
   ```typescript
   // src/hooks/useLiveSync.ts
   import { useEffect, useCallback } from 'react';
   import { DataSyncManager } from '../utils/dataSyncManager';
   import { supabase } from '../lib/supabaseClient';
   
   export function useLiveSync(table: string) {
     const [dataSyncManager] = useState(() => new DataSyncManager(supabase));
   
     const syncData = useCallback(async (data: any) => {
       await dataSyncManager.syncData(table, data);
     }, [table, dataSyncManager]);
   
     useEffect(() => {
       // Set up real-time sync
       const subscription = supabase
         .channel(`${table}_sync`)
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table
         }, (payload) => {
           // Handle real-time updates
           console.log('Live sync update:', payload);
         })
         .subscribe();
   
       return () => {
         subscription.unsubscribe();
       };
     }, [table]);
   
     return { syncData };
   }
   ```

### Step 6: Collaborative Features
Implement collaborative editing:

1. **Collaborative Editor**
   ```typescript
   // src/components/CollaborativeEditor.tsx
   import React, { useState, useEffect } from 'react';
   import { useRealtime } from '../hooks/useRealtime';
   import { useOptimisticUpdates } from '../hooks/useOptimisticUpdates';
   
   interface CollaborativeEditorProps {
     documentId: string;
     initialContent: string;
   }
   
   export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
     documentId,
     initialContent
   }) => {
     const [content, setContent] = useState(initialContent);
     const [collaborators, setCollaborators] = useState<any[]>([]);
   
     // Real-time updates
     useRealtime({
       table: 'documents',
       filter: `id=eq.${documentId}`,
       onUpdate: (payload) => {
         if (payload.new.content !== content) {
           setContent(payload.new.content);
         }
       }
     });
   
     // Optimistic updates
     const { updateItem } = useOptimisticUpdates(
       [{ id: documentId, content }],
       async (id, updates) => {
         const { data } = await supabase
           .from('documents')
           .update(updates)
           .eq('id', id)
           .select()
           .single();
         return data;
       }
     );
   
     const handleContentChange = (newContent: string) => {
       setContent(newContent);
       updateItem(documentId, { content: newContent });
     };
   
     return (
       <div className="collaborative-editor">
         <div className="collaborators">
           {collaborators.map(collaborator => (
             <div key={collaborator.id} className="collaborator">
               <div className="avatar" style={{ backgroundColor: collaborator.color }}>
                 {collaborator.name[0]}
               </div>
               <span>{collaborator.name}</span>
             </div>
           ))}
         </div>
         
         <textarea
           value={content}
           onChange={(e) => handleContentChange(e.target.value)}
           placeholder="Start typing..."
           className="editor-textarea"
         />
       </div>
     );
   };
   ```

### Step 7: Real-time Notifications
Implement real-time notifications:

1. **Notification Manager**
   ```typescript
   // src/utils/notificationManager.ts
   export class NotificationManager {
     private supabase: any;
   
     constructor(supabase: any) {
       this.supabase = supabase;
     }
   
     async sendNotification(
       userId: string,
       title: string,
       message: string,
       type: 'info' | 'success' | 'warning' | 'error' = 'info'
     ): Promise<void> {
       await this.supabase
         .from('notifications')
         .insert({
           user_id: userId,
           title,
           message,
           type,
           read: false,
           created_at: new Date().toISOString()
         });
     }
   
     async markAsRead(notificationId: string): Promise<void> {
       await this.supabase
         .from('notifications')
         .update({ read: true })
         .eq('id', notificationId);
     }
   
     async getUnreadNotifications(userId: string): Promise<any[]> {
       const { data } = await this.supabase
         .from('notifications')
         .select('*')
         .eq('user_id', userId)
         .eq('read', false)
         .order('created_at', { ascending: false });
   
       return data || [];
     }
   }
   ```

2. **Notification Hook**
   ```typescript
   // src/hooks/useNotifications.ts
   import { useState, useEffect } from 'react';
   import { NotificationManager } from '../utils/notificationManager';
   import { supabase } from '../lib/supabaseClient';
   
   export function useNotifications(userId: string) {
     const [notifications, setNotifications] = useState<any[]>([]);
     const [unreadCount, setUnreadCount] = useState(0);
     const [notificationManager] = useState(() => new NotificationManager(supabase));
   
     useEffect(() => {
       // Get initial notifications
       const getNotifications = async () => {
         const data = await notificationManager.getUnreadNotifications(userId);
         setNotifications(data);
         setUnreadCount(data.length);
       };
   
       getNotifications();
   
       // Listen for new notifications
       const subscription = supabase
         .channel('notifications')
         .on('postgres_changes', {
           event: 'INSERT',
           schema: 'public',
           table: 'notifications',
           filter: `user_id=eq.${userId}`
         }, (payload) => {
           setNotifications(prev => [payload.new, ...prev]);
           setUnreadCount(prev => prev + 1);
         })
         .subscribe();
   
       return () => {
         subscription.unsubscribe();
       };
     }, [userId, notificationManager]);
   
     const markAsRead = async (notificationId: string) => {
       await notificationManager.markAsRead(notificationId);
       setNotifications(prev => 
         prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
       );
       setUnreadCount(prev => Math.max(0, prev - 1));
     };
   
     return {
       notifications,
       unreadCount,
       markAsRead
     };
   }
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ Supabase Realtime subscriptions
2. ✅ Optimistic update patterns
3. ✅ Conflict resolution strategies
4. ✅ User presence tracking
5. ✅ Live data synchronization
6. ✅ Collaborative editing features
7. ✅ Real-time notifications
8. ✅ Message passing system

## Next Steps
After completing real-time features:
- Run **Prompt 3: Performance Optimization** to optimize real-time operations
- Run **Prompt 4: Production Readiness** to prepare for deployment

## Notes
- Real-time features require careful state management
- Optimistic updates improve perceived performance
- Conflict resolution prevents data loss
- Presence indicators enhance collaboration
- All real-time operations are designed to be efficient and scalable


