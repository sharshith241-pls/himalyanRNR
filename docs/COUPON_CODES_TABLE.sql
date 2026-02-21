-- Create coupon codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_expiry TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  trek_ids TEXT[] DEFAULT ARRAY[]::TEXT[], -- Optional: specific treks this coupon is valid for
  
  -- Metadata
  notes TEXT,
  
  CONSTRAINT check_discount CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  CONSTRAINT check_uses CHECK (current_uses <= max_uses OR max_uses IS NULL)
);

-- Create index for faster coupon lookups
CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_active ON coupon_codes(is_active);

-- Create coupon usage tracking table
CREATE TABLE IF NOT EXISTS coupon_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id VARCHAR(100), -- Razorpay payment ID
  trek_id VARCHAR(100) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for usage logs
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage_logs(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage_logs(user_id);
CREATE INDEX idx_coupon_usage_payment_id ON coupon_usage_logs(payment_id);

-- Enable RLS
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for coupon codes
CREATE POLICY "Anyone can view active coupon codes"
  ON coupon_codes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only creator can update their coupon codes"
  ON coupon_codes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can create coupon codes"
  ON coupon_codes FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (SELECT value FROM (SELECT value FROM jsonb_each_text((auth.jwt() -> 'app_metadata'::text)::jsonb)) WHERE key = 'role' AND value = 'admin')));

-- Policies for usage logs
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage_logs FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE email IN (SELECT value FROM (SELECT value FROM jsonb_each_text((auth.jwt() -> 'app_metadata'::text)::jsonb)) WHERE key = 'role' AND value = 'admin')));

CREATE POLICY "Only backend can insert usage logs"
  ON coupon_usage_logs FOR INSERT
  WITH CHECK (true); -- Controlled by backend API

-- Insert a sample coupon for testing (optional)
-- INSERT INTO coupon_codes (code, discount_percentage, created_by, max_uses, notes)
-- VALUES ('WELCOME10', 10.00, (SELECT id FROM auth.users LIMIT 1), NULL, 'Welcome coupon for all users');
