/*
  # Create Fintrack Plus Database Schema

  1. New Tables
    - `e_wallets`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `balance` (numeric, default 0)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `themes`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `max_budget` (numeric, not null)
      - `current_spent` (numeric, default 0)
      - `e_wallet_id` (uuid, references e_wallets)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `description` (text, not null)
      - `amount` (numeric, not null)
      - `type` (text, check: 'income' or 'expense')
      - `theme_id` (uuid, references themes, nullable)
      - `e_wallet_id` (uuid, references e_wallets)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own e_wallets and related data

  3. Functions
    - Helper functions for updating balances and spending calculations
*/

-- Create e_wallets table
CREATE TABLE IF NOT EXISTS e_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  balance numeric DEFAULT 0 NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  max_budget numeric NOT NULL DEFAULT 0,
  current_spent numeric DEFAULT 0 NOT NULL,
  e_wallet_id uuid REFERENCES e_wallets(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  e_wallet_id uuid REFERENCES e_wallets(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE e_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for e_wallets
CREATE POLICY "Users can manage their own e-wallets"
  ON e_wallets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for themes
CREATE POLICY "Users can manage themes of their e-wallets"
  ON themes
  FOR ALL
  TO authenticated
  USING (
    e_wallet_id IN (
      SELECT id FROM e_wallets WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    e_wallet_id IN (
      SELECT id FROM e_wallets WHERE user_id = auth.uid()
    )
  );

-- Create policies for transactions
CREATE POLICY "Users can manage transactions of their e-wallets"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    e_wallet_id IN (
      SELECT id FROM e_wallets WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    e_wallet_id IN (
      SELECT id FROM e_wallets WHERE user_id = auth.uid()
    )
  );

-- Create function to update theme spending
CREATE OR REPLACE FUNCTION increment_theme_spending(theme_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE themes 
  SET current_spent = current_spent + amount,
      updated_at = now()
  WHERE id = theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update theme spending (for edits)
CREATE OR REPLACE FUNCTION update_theme_spending(theme_id uuid, old_amount numeric, new_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE themes 
  SET current_spent = current_spent - old_amount + new_amount,
      updated_at = now()
  WHERE id = theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update wallet balance (simple)
CREATE OR REPLACE FUNCTION update_wallet_balance_simple(wallet_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE e_wallets 
  SET balance = balance + amount,
      updated_at = now()
  WHERE id = wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update wallet balance (for edits)
CREATE OR REPLACE FUNCTION update_wallet_balance(
  wallet_id uuid, 
  old_amount numeric, 
  old_type text, 
  new_amount numeric, 
  new_type text
)
RETURNS void AS $$
DECLARE
  adjustment numeric;
BEGIN
  -- Reverse the old transaction
  IF old_type = 'income' THEN
    adjustment := -old_amount;
  ELSE
    adjustment := old_amount;
  END IF;
  
  -- Apply the new transaction
  IF new_type = 'income' THEN
    adjustment := adjustment + new_amount;
  ELSE
    adjustment := adjustment - new_amount;
  END IF;
  
  UPDATE e_wallets 
  SET balance = balance + adjustment,
      updated_at = now()
  WHERE id = wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_e_wallets_user_id ON e_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_themes_e_wallet_id ON themes(e_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_e_wallet_id ON transactions(e_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_theme_id ON transactions(theme_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);