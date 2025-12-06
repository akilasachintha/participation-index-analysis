-- Create projects table
CREATE TABLE IF NOT EXISTS projects
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
                         WITH TIME ZONE DEFAULT NOW()
    );

-- Create categories table (Goal Setting, Programming, Co-Production, Implementation)
CREATE TABLE IF NOT EXISTS categories
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
    );

-- Insert default categories
INSERT INTO categories (name, sort_order)
VALUES ('GOAL SETTING', 1),
       ('PROGRAMMING', 2),
       ('CO-PRODUCTION', 3),
       ('IMPLEMENTATION', 4) ON CONFLICT (name) DO NOTHING;

-- Create checklist_items table (stores all analog and digital items)
CREATE TABLE IF NOT EXISTS checklist_items
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    project_id UUID NOT NULL REFERENCES projects
(
    id
) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories
(
    id
)
  ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK
(
    item_type
    IN
(
    'analog',
    'digital'
)),
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW()
    );

-- Create item_details table (stores the form data for each checklist item)
CREATE TABLE IF NOT EXISTS item_details
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    checklist_item_id UUID NOT NULL REFERENCES checklist_items
(
    id
) ON DELETE CASCADE UNIQUE,
    activity TEXT,
    image1_url TEXT,
    image2_url TEXT,
    total_participation_n NUMERIC,
    very_high_participation_fvh NUMERIC,
    high_participation_fh NUMERIC,
    normal_participation_fn NUMERIC,
    low_participation_fl NUMERIC,
    very_low_participation_fvl NUMERIC,
    calculated_pi NUMERIC,
    assumptions TEXT,
    data_collected_by TEXT,
    collection_date DATE,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW()
    );

-- Enable Row Level Security (allowing public access for this app since no auth is required)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for this app)
CREATE
POLICY "Allow public read access to projects" ON projects FOR
SELECT USING (true);
CREATE
POLICY "Allow public insert access to projects" ON projects FOR INSERT WITH CHECK (true);
CREATE
POLICY "Allow public update access to projects" ON projects FOR
UPDATE USING (true);
CREATE
POLICY "Allow public delete access to projects" ON projects FOR DELETE
USING (true);

CREATE
POLICY "Allow public read access to categories" ON categories FOR
SELECT USING (true);

CREATE
POLICY "Allow public read access to checklist_items" ON checklist_items FOR
SELECT USING (true);
CREATE
POLICY "Allow public insert access to checklist_items" ON checklist_items FOR INSERT WITH CHECK (true);
CREATE
POLICY "Allow public update access to checklist_items" ON checklist_items FOR
UPDATE USING (true);
CREATE
POLICY "Allow public delete access to checklist_items" ON checklist_items FOR DELETE
USING (true);

CREATE
POLICY "Allow public read access to item_details" ON item_details FOR
SELECT USING (true);
CREATE
POLICY "Allow public insert access to item_details" ON item_details FOR INSERT WITH CHECK (true);
CREATE
POLICY "Allow public update access to item_details" ON item_details FOR
UPDATE USING (true);
CREATE
POLICY "Allow public delete access to item_details" ON item_details FOR DELETE
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_project_id ON checklist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category_id ON checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_item_details_checklist_item_id ON item_details(checklist_item_id);
