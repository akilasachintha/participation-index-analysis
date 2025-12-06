-- Add image3_url and image4_url columns to item_details table
ALTER TABLE item_details ADD COLUMN IF NOT EXISTS image3_url TEXT;
ALTER TABLE item_details ADD COLUMN IF NOT EXISTS image4_url TEXT;
