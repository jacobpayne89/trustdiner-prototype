-- Add tags fields to support chain-wide and venue-specific tagging

-- Add tags field to chains table for chain-wide tags
ALTER TABLE venues.chains 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add tags field to establishments table for venue-specific tags  
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add indexes for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_chains_tags ON venues.chains USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_establishments_tags ON public.establishments USING GIN (tags);

-- Add some example chain tags for existing chains
UPDATE venues.chains 
SET tags = '["Chain", "Fast Food"]'::jsonb 
WHERE name = 'McDonald''s' AND tags = '[]'::jsonb;

UPDATE venues.chains 
SET tags = '["Chain", "Coffee Shop"]'::jsonb 
WHERE name = 'Starbucks' AND tags = '[]'::jsonb;

UPDATE venues.chains 
SET tags = '["Chain", "Sandwich Shop"]'::jsonb 
WHERE name = 'Pret A Manger' AND tags = '[]'::jsonb;

UPDATE venues.chains 
SET tags = '["Chain", "Mexican Restaurant"]'::jsonb 
WHERE name ILIKE '%chipotle%' AND tags = '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN venues.chains.tags IS 'JSONB array of tags that apply to all venues in this chain (e.g., ["Chain", "Fast Food"])';
COMMENT ON COLUMN public.establishments.tags IS 'JSONB array of venue-specific tags (merged with chain tags when displayed)';
