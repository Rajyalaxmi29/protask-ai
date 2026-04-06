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
    const cachedId = localStorage.getItem(this.userKey);
    
    // If we have it cached, return it instantly to prevent UI blocking
    if (cachedId) return cachedId;

    if (navigator.onLine) {
      try {
        // Only try the network if we don't have a cached ID
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => setTimeout(() => reject('timeout'), 2000))
        ]);
        if (data?.session?.user?.id) {
          localStorage.setItem(this.userKey, data.session.user.id);
          return data.session.user.id;
        }
      } catch (e) {
        console.warn('Auth check failed or timed out, returning null');
      }
    }
    return null;
  }

  // --- Read Methods ---
  public async get<T>(table: string, userId: string, orderBy: string = 'created_at'): Promise<T[]> {
    const cacheKey = `cache_${table}_${userId}`;
    const isOnline = navigator.onLine;

    // Offline or fetch failed
    const cached = localStorage.getItem(cacheKey);
    let results = cached ? JSON.parse(cached) : [];

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
        }
      } catch (e) {
        console.warn(`Fetch failed for ${table}, falling back to cache`);
      }
    }

    // Apply pending local mutations to the results for UI consistency
    // This ensures that even if we just fetched from the network, 
    // items that haven't finished syncing yet are still reflected in the UI.
    const pending = this.getQueue().filter(m => m.table === table);
    
    // Create a map for faster lookup of existing IDs
    const resultsMap = new Map(results.map((r: any) => [r.id, r]));

    pending.forEach(m => {
      if (m.type === 'INSERT') {
        // Only add if not already in results (to prevent duplicates if sync happened mid-fetch)
        if (!resultsMap.has(m.id)) {
          results = [m.data, ...results];
          resultsMap.set(m.id, m.data);
        }
      } else if (m.type === 'UPDATE') {
        results = results.map((r: any) => r.id === m.id ? { ...r, ...m.data } : r);
      } else if (m.type === 'DELETE') {
        results = results.filter((r: any) => r.id !== m.id);
      }
    });

    return results as T[];
  }

  // --- Write Methods ---
  public async mutate(table: string, type: MutationType, data: any, id?: string) {
    const mutationId = id || data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9));
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
        // If it's a conflict, policy, or syntax error (invalid UUID), remove to prevent deadlock
        if (['42501', '23505', '22P02'].includes(error.code)) this.removeFromQueue(m.id);
      }
    } catch (e) {
      console.error(`Failed to sync item ${m.id}`, e);
    }
  }
}

export const persistentData = new PersistentData();
