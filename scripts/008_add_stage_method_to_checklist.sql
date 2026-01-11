-- Add stage_number and method_key columns to checklist_items table
-- This allows each method to be independent per lifecycle stage

-- Add stage_number column (1-6 for the 6 lifecycle stages)
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS stage_number INTEGER;

-- Add method_key column (A, B, C, D, E)
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS method_key TEXT;

-- Add category_number for easier querying (1-4 for the 4 participation categories)
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS category_number INTEGER;

-- Create a unique constraint to ensure one record per project/stage/category/method combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_items_unique
ON checklist_items(project_id, stage_number, category_id, method_key)
WHERE stage_number IS NOT NULL AND method_key IS NOT NULL;

-- Add comment to explain the structure
COMMENT ON COLUMN checklist_items.stage_number IS 'Lifecycle stage (1-6): 1=INITIATION, 2=BRIEFING, 3=SCHEMATIC, 4=PRODUCT INFO, 5=ASSEMBLY, 6=CONSUMPTION';
COMMENT ON COLUMN checklist_items.method_key IS 'Method identifier (A, B, C, D, E) within the category';
COMMENT ON COLUMN checklist_items.category_number IS 'Category number (1-4): 1=NEEDS ASSESSMENT, 2=CO-CREATION, 3=FEEDBACK LOOPS, 4=DIGITAL PLATFORMS';
