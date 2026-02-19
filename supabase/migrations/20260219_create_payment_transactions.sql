-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ext_transaction_code TEXT UNIQUE NOT NULL, -- Grow transactionCode
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable initially
    amount NUMERIC,
    status TEXT DEFAULT 'pending',
    payer_details JSONB, -- Store name, email, phone for reference
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Service Role (Edge Function) full access
CREATE POLICY "Service role full access" ON payment_transactions 
    FOR ALL USING (true);

-- User can view THEIR OWN transactions
CREATE POLICY "Users view own transactions" ON payment_transactions 
    FOR SELECT USING (auth.uid() = user_id);
