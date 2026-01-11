-- Add stage-based participation tracking

-- Create stages table
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    category TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Insert the 4 stages
INSERT INTO stages (number, title, subtitle, category, sort_order) VALUES
(1, 'PARTICIPATORY NEEDS ASSESSMENT AND PROGRAMMING', 'Emphasizes early and continuous engagement with actors to inform spatial decision-making', 'GOAL SETTING', 1),
(2, 'COLLABORATIVE DESIGN AND CO-CREATION WORKSHOPS', 'Redistribute power within the design process by creating conditions for meaningful collaboration', 'PROGRAMMING', 2),
(3, 'ITERATIVE FEEDBACK LOOPS AND SYSTEMATIC DOCUMENTATION', 'Recording community inputs, design decisions, and subsequent revisions, and clearly communicating how participant contributions influence the evolving project', 'PROGRAMMING', 3),
(4, 'DIGITAL PARTICIPATORY PLATFORMS', 'Creates continuous and flexible engagement across time and space', 'CO-PRODUCTION', 4)
ON CONFLICT (number) DO NOTHING;

-- Create stage_methods table
CREATE TABLE IF NOT EXISTS stage_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    method_key TEXT NOT NULL,
    method_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(stage_id, method_key)
);

-- Insert stage methods
INSERT INTO stage_methods (stage_id, method_key, method_name, sort_order)
SELECT s.id, m.method_key, m.method_name, m.sort_order
FROM stages s
CROSS JOIN (
    VALUES
    (1, 'A', 'Problem-Tree Analysis', 1),
    (1, 'B', 'Surveys & Interviews', 2),
    (1, 'C', 'Focus Group Discussions', 3),
    (1, 'D', 'Participatory Mapping', 4),
    (2, 'A', 'Charrettes', 1),
    (2, 'B', 'Scenario Building Exercises', 2),
    (2, 'C', 'Model-Making Activities', 3),
    (3, 'A', 'Public Exhibition', 1),
    (4, 'A', 'Web-based Portals', 1),
    (4, 'B', 'Interactive Mapping Tools', 2),
    (4, 'C', 'Online Forums', 3),
    (4, 'D', 'Mobile Applications', 4),
    (4, 'E', 'Immersive/Virtual Reality-Based Workshops', 5)
) AS m(stage_number, method_key, method_name, sort_order)
WHERE s.number = m.stage_number
ON CONFLICT (stage_id, method_key) DO NOTHING;

-- Create project_stage_progress table
CREATE TABLE IF NOT EXISTS project_stage_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_method_id UUID NOT NULL REFERENCES stage_methods(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, stage_method_id)
);

-- Enable RLS
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stage_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to stages" ON stages FOR SELECT USING (true);
CREATE POLICY "Allow public read access to stage_methods" ON stage_methods FOR SELECT USING (true);
CREATE POLICY "Allow public read access to project_stage_progress" ON project_stage_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to project_stage_progress" ON project_stage_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to project_stage_progress" ON project_stage_progress FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to project_stage_progress" ON project_stage_progress FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stage_methods_stage_id ON stage_methods(stage_id);
CREATE INDEX IF NOT EXISTS idx_project_stage_progress_project_id ON project_stage_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stage_progress_stage_method_id ON project_stage_progress(stage_method_id);