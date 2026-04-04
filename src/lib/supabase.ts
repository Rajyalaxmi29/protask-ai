import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Type definitions matching DB schema ─────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TransactionType = 'expense' | 'income';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  remind_at: string;
  category: string;
  is_done: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string;
  via?: string;
  note?: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  type?: string;
  size?: number;
  url?: string;
  folder: string;
  created_at: string;
}

// ─── Helper: get current user id ─────────────────────────────────────────────
export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
