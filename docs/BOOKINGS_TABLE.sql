-- Bookings table for storing trek bookings and payment information
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID NOT NULL REFERENCES public.treks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT NOT NULL UNIQUE,
  razorpay_signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_bookings_user_email ON public.bookings(user_email);
CREATE INDEX idx_bookings_trek_id ON public.bookings(trek_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_razorpay_payment_id ON public.bookings(razorpay_payment_id);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

-- Allow anyone to insert bookings (payment system creates them)
CREATE POLICY "Allow payment system to create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update their own bookings
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);
