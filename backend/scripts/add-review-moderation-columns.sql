-- Add moderation columns to reviews table
ALTER TABLE reviews.allergen_reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_allergen_reviews_flagged ON reviews.allergen_reviews(is_flagged);
CREATE INDEX IF NOT EXISTS idx_allergen_reviews_hidden ON reviews.allergen_reviews(is_hidden);

-- Add comments for documentation
COMMENT ON COLUMN reviews.allergen_reviews.is_flagged IS 'Whether the review has been flagged for moderation';
COMMENT ON COLUMN reviews.allergen_reviews.is_hidden IS 'Whether the review is hidden from public view';
COMMENT ON COLUMN reviews.allergen_reviews.admin_response IS 'Optional response from TrustDiner admin team';
