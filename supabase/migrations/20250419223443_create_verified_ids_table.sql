-- Create verified_ids table
CREATE TABLE IF NOT EXISTS verified_ids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id TEXT NOT NULL UNIQUE,
    verification_date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT NOT NULL,
    extracted_text TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on student_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_verified_ids_student_id ON verified_ids(student_id);

-- Create index on image_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_verified_ids_image_url ON verified_ids(image_url);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verified_ids_updated_at
    BEFORE UPDATE ON verified_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for student IDs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-ids', 'student-ids', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to only allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-ids' AND
    auth.role() = 'authenticated'
);

-- Set up storage policy to only allow users to read their own ID
CREATE POLICY "Allow users to read their own ID"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-ids' AND
    (storage.foldername(name))[1] = auth.uid()::text
); 