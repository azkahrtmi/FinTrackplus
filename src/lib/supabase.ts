import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EWallet {
  id: string;
  name: string;
  balance: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  name: string;
  max_budget: number;
  current_spent: number;
  e_wallet_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  theme_id: string;
  e_wallet_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}