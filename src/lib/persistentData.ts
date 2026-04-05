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

    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .order(orderBy, { ascending: false });

        if (!error && data) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return data as T[];
        }
      } catch (e) {
        console.warn(`Fetch failed for ${table}, falling back to cache`);
      }
    }

    // Offline or fetch failed
    const cached = localStorage.getItem(cacheKey);
    let results = cached ? JSON.parse(cached) : [];

    // Apply pending local mutations to the results for UI consistency
    const pending = this.getQueue().filter(m => m.table === table);
    pending.forEach(m => {
      if (m.type === 'INSERT') results = [m.data, ...results];
      if (m.type === 'UPDATE') results = results.map((r: any) => r.id === m.data.id ? { ...r, ...m.data } : r);
      if (m.type === 'DELETE') results = results.filter((r: any) => r.id !== m.id);
    });

    return results as T[];
  }

  // --- Write Methods ---
  public async mutate(table: string, type: MutationType, data: any, id?: string) {
    const mutationId = id || data.id || Math.random().toString(36).substr(2, 9);
    const mutation: OfflineMutation = {
      id: mutationId,
      table,
      type,
      data: { ...data, id: mutationId, created_at: data.created_at || new Date().toISOString() },
      timestamp: Date.now()
    };

    // 1. Add to optimistic queue
    this.addToQueue(mutation);

    // 2. Try to sync immediately if online
    if (navigator.onLine) {
      await this.syncItem(mutation);
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
        // If it's a conflict or policy error, we might want to remove it anyway to avoid infinite retries
        if (error.code === '42501' || error.code === '23505') this.removeFromQueue(m.id);
      }
    } catch (e) {
      console.error(`Failed to sync item ${m.id}`, e);
    }
  }
}

export const persistentData = new PersistentData();
