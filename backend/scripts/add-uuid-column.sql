-- Add UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add uuid column to establishments table
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS local_image_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS s3_image_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_fetched_at TIMESTAMP;

-- Create unique index on uuid for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_establishments_uuid ON public.establishments(uuid);

-- Update existing records to have UUIDs (using v4 random)
UPDATE public.establishments 
SET uuid = uuid_generate_v4() 
WHERE uuid IS NULL;

-- Make uuid NOT NULL after populating
ALTER TABLE public.establishments 
ALTER COLUMN uuid SET NOT NULL;

-- Show sample of updated records
SELECT id, name, place_id, uuid, local_image_url 
FROM public.establishments 
LIMIT 5;

