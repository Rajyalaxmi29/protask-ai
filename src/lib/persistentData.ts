import { supabase } from './supabase';

type MutationType = 'INSERT' | 'UPDATE' | 'DELETE';

interface OfflineMutation {
  id: string;
  table: string;
  type: MutationType;
  data: any;
  timestamp: number;
}

class PersistentData {
  private queueKey = 'offline_mutations';
  private userKey = 'last_user_id';

  public async getUserId(): Promise<string | null> {
    if (navigator.onLine) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.id) {
          localStorage.setItem(this.userKey, data.session.user.id);
          return data.session.user.id;
        }
      } catch (e) {}
    }
    return localStorage.getItem(this.userKey);
  }

  // --- Read Methods ---
  public async get<T>(table: string, userId: string, orderBy: string = 'created_at'): Promise<T[]> {
    const cacheKey = `cache_${table}_${userId}`;
    const isOnline = navigator.onLine;
    let results: any[] = [];

    // 1. Try to fetch from Supabase if online
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .order(orderBy, { ascending: false });

        if (!error && data) {
          results = data;
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          throw new Error('Supabase fetch failed');
        }
      } catch (e) {
        console.warn(`Fetch failed for ${table}, falling back to cache:`, e);
        const cached = localStorage.getItem(cacheKey);
        results = cached ? JSON.parse(cached) : [];
      }
    } else {
      // 2. Not online, use cache
      const cached = localStorage.getItem(cacheKey);
      results = cached ? JSON.parse(cached) : [];
    }

    // 3. APPLY PENDING LOCAL MUTATIONS FOR UI CONSISTENCY
    // This solves the bug where items vanish on refresh because they aren't synced yet.
    const pending = this.getQueue().filter(m => m.table === table);
    pending.forEach(m => {
      if (m.type === 'INSERT') {
        // Prevent duplicates if by any chance the item is already in the server result
        if (!results.find((r: any) => r.id === m.id)) {
          results = [m.data, ...results];
        }
      } else if (m.type === 'UPDATE') {
        results = results.map((r: any) => r.id === m.data.id ? { ...r, ...m.data } : r);
      } else if (m.type === 'DELETE') {
        results = results.filter((r: any) => r.id !== m.id);
      }
    });

    return results as T[];
  }

  // --- Write Methods ---
  public async mutate(table: string, type: MutationType, data: any, id?: string) {
    // Generate a valid UUID v4 (RFC 4122) for Supabase compatibility
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      // Manual UUID v4 construction as fallback
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const mutationId = id || data.id || generateUUID();
    const mutation: OfflineMutation = {
      id: mutationId,
      table,
      type,
      data: { ...data, id: mutationId, created_at: data.created_at || new Date().toISOString() },
      timestamp: Date.now()
    };

    // 1. Add to optimistic queue
    this.addToQueue(mutation);

    // 2. Trigger sync in the background IF online, but do NOT await it
    // This makes the UI update INSTANTLY even on a slow connection
    if (navigator.onLine) {
      this.syncItem(mutation).catch(e => console.warn('Background sync failed:', e));
    }
    
    return mutation.data;
  }

  // --- Queue Management ---
  private getQueue(): OfflineMutation[] {
    return JSON.parse(localStorage.getItem(this.queueKey) || '[]');
  }

  private addToQueue(m: OfflineMutation) {
    const queue = this.getQueue();
    queue.push(m);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  private removeFromQueue(id: string) {
    const queue = this.getQueue().filter(m => m.id !== id);
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  // --- Syncing ---
  public async syncAll() {
    if (!navigator.onLine) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} pending items...`);
    for (const item of queue) {
      await this.syncItem(item);
    }
  }

  private async syncItem(m: OfflineMutation) {
    try {
      let error;
      if (m.type === 'INSERT') {
        const { error: err } = await supabase.from(m.table).insert(m.data);
        error = err;
      } else if (m.type === 'UPDATE') {
        const { error: err } = await supabase.from(m.table).update(m.data).eq('id', m.data.id);
        error = err;
      } else if (m.type === 'DELETE') {
        const { error: err } = await supabase.from(m.table).delete().eq('id', m.id);
        error = err;
      }

      if (!error) {
        this.removeFromQueue(m.id);
      } else {
        console.error(`Sync error for ${m.table}:`, error);
        // Supabase error objects might have the code in different places; let's log everything
        try {
          const errorMsg = typeof error === 'object' ? JSON.stringify(error) : error;
          console.error(`Detailed sync failure info: ${errorMsg}`);
        } catch (e) {}

        // If it's a conflict, policy error, or invalid data, remove it to stop the error loop
        // 22P02 = Invalid UUID format, 23502 = Not null violation, etc.
        const isClientError = error.code && (error.code.startsWith('22') || error.code.startsWith('23') || error.code === '42501');
        
        if (isClientError || error.status === 400 || (error.message && error.message.includes('invalid input syntax'))) {
          console.warn(`Removing unfixable item ${m.id} from queue to stop retries.`);
          this.removeFromQueue(m.id);
        }
      }
    } catch (e) {
      console.error(`Failed to sync item ${m.id}`, e);
    }
  }
}

export const persistentData = new PersistentData();
