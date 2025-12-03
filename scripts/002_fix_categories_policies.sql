-- Add missing policies for categories table to allow public insert, update, and delete
CREATE POLICY "Allow public insert access to categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to categories" ON categories FOR DELETE USING (true);
