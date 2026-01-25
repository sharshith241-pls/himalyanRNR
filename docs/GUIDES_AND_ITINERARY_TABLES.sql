-- Guides table to store guide information
CREATE TABLE public.guides (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_guides_email ON public.guides(email);

-- Enable Row Level Security
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Allow guides to view their own profile
CREATE POLICY "Guides can view own profile" ON public.guides
  FOR SELECT USING (auth.uid() = id);

-- Allow guides to update their own profile
CREATE POLICY "Guides can update own profile" ON public.guides
  FOR UPDATE USING (auth.uid() = id);


-- Trek Itinerary table to store trek day details
CREATE TABLE public.trek_itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID NOT NULL REFERENCES public.treks(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_trek_itinerary_trek_id ON public.trek_itinerary(trek_id);
CREATE INDEX idx_trek_itinerary_day ON public.trek_itinerary(trek_id, day);

-- Enable Row Level Security
ALTER TABLE public.trek_itinerary ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view itinerary (public information)
CREATE POLICY "Anyone can view itinerary" ON public.trek_itinerary
  FOR SELECT USING (true);

-- Allow guides to modify their own trek itinerary
CREATE POLICY "Guides can modify trek itinerary" ON public.trek_itinerary
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Guides can update trek itinerary" ON public.trek_itinerary
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Guides can delete trek itinerary" ON public.trek_itinerary
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );
