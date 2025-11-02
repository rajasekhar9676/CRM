-- Create contacts table for contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert contacts (for public contact form)
CREATE POLICY "Public can insert contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow admins to view all contacts
-- Note: This checks the users table for admin role
-- If using service role, it bypasses RLS automatically
CREATE POLICY "Admins can view all contacts"
  ON contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Policy: Service role (admin client) can update all contacts
CREATE POLICY "Admins can update contacts"
  ON contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    auth.role() = 'service_role'
  );

-- Add comment
COMMENT ON TABLE contacts IS 'Contact form submissions from website visitors';
COMMENT ON COLUMN contacts.status IS 'Status: new, read, replied, archived';
COMMENT ON COLUMN contacts.ip_address IS 'IP address of the submitter (for spam detection)';
COMMENT ON COLUMN contacts.user_agent IS 'User agent of the submitter (for spam detection)';

